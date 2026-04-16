"""RAG (Retrieval Augmented Generation) service backed by Chroma and Groq."""
import os
import logging
from types import SimpleNamespace
from typing import List, Dict, Any, Optional

import chromadb
import requests
from langchain_text_splitters import RecursiveCharacterTextSplitter


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class _DirectGroqLLM:
    """Lightweight Groq client that matches the minimal invoke().content contract."""

    def __init__(self, api_key: str, model_name: str, temperature: float, max_tokens: int):
        self.api_key = api_key
        self.model_name = model_name
        self.temperature = temperature
        self.max_tokens = max_tokens

    def invoke(self, prompt: str):
        if not self.api_key:
            raise ValueError("GROQ_API_KEY is not configured")

        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": self.model_name,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": self.temperature,
                "max_tokens": self.max_tokens,
            },
            timeout=45,
        )
        response.raise_for_status()

        data = response.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        return SimpleNamespace(content=content)


class RAGService:
    """Service for RAG operations with Chroma retrieval and Groq generation."""

    def __init__(self, groq_api_key: str, persist_directory: str = "./chroma_db"):
        """Initialize RAG service."""
        self.groq_api_key = groq_api_key
        self.persist_directory = persist_directory

        if not self.groq_api_key:
            logger.warning("GROQ_API_KEY is not configured. RAG responses will fail until it is set.")

        self.chroma_client = chromadb.PersistentClient(path=persist_directory)

        groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        self.llm = self._build_llm(groq_api_key, groq_model)

        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", " ", ""],
        )

        logger.info("RAG Service initialized successfully")

    def _build_llm(self, groq_api_key: str, model_name: str):
        """Build LLM client with a safe fallback when LangChain import chain breaks."""
        try:
            from langchain_groq import ChatGroq

            return ChatGroq(
                groq_api_key=groq_api_key,
                model_name=model_name,
                temperature=0.7,
                max_tokens=4096,
            )
        except Exception as exc:
            logger.warning(
                "ChatGroq unavailable (%s). Falling back to direct Groq HTTP client.",
                exc,
            )
            return _DirectGroqLLM(
                api_key=groq_api_key,
                model_name=model_name,
                temperature=0.7,
                max_tokens=4096,
            )

    def _get_collection(self, collection_name: str, create_if_missing: bool = True):
        """Get collection and optionally create it if it does not exist."""
        try:
            return self.chroma_client.get_collection(name=collection_name)
        except Exception:
            if not create_if_missing:
                raise
            return self.chroma_client.create_collection(name=collection_name)

    def create_collection(self, collection_name: str) -> bool:
        """Create a new Chroma collection for an agent."""
        try:
            self._get_collection(collection_name, create_if_missing=True)
            logger.info(f"Created collection: {collection_name}")
            return True
        except Exception as e:
            logger.error(f"Error creating collection: {e}")
            return False

    def delete_collection(self, collection_name: str) -> bool:
        """Delete a Chroma collection."""
        try:
            self.chroma_client.delete_collection(name=collection_name)
            logger.info(f"Deleted collection: {collection_name}")
            return True
        except Exception as e:
            logger.error(f"Error deleting collection: {e}")
            return False

    def add_documents(
        self,
        collection_name: str,
        documents: List[str],
        metadatas: Optional[List[Dict]] = None,
        ids: Optional[List[str]] = None,
    ) -> int:
        """Add documents to a collection."""
        try:
            collection = self._get_collection(collection_name, create_if_missing=True)

            all_chunks: List[str] = []
            all_metadatas: List[Dict[str, Any]] = []
            all_ids: List[str] = []

            for i, doc in enumerate(documents):
                chunks = self.text_splitter.split_text(doc)
                for j, chunk in enumerate(chunks):
                    all_chunks.append(chunk)

                    base_metadata = metadatas[i] if metadatas and i < len(metadatas) else {}
                    metadata = dict(base_metadata)
                    metadata["chunk_index"] = j
                    metadata["source_index"] = i
                    all_metadatas.append(metadata)

                    doc_id = f"{ids[i] if ids and i < len(ids) else f'doc_{i}'}_chunk_{j}"
                    all_ids.append(doc_id)

            if not all_chunks:
                return 0

            collection.add(documents=all_chunks, metadatas=all_metadatas, ids=all_ids)

            logger.info(f"Added {len(all_chunks)} chunks to collection {collection_name}")
            return len(all_chunks)

        except Exception as e:
            logger.error(f"Error adding documents: {e}")
            raise

    def _query_collection(self, collection_name: str, query: str, k: int) -> Dict[str, Any]:
        """Run similarity query against a Chroma collection."""
        collection = self._get_collection(collection_name, create_if_missing=False)
        return collection.query(
            query_texts=[query],
            n_results=max(1, k),
            include=["documents", "metadatas", "distances"],
        )

    def query(
        self,
        collection_name: str,
        query: str,
        system_prompt: Optional[str] = None,
        chat_history: Optional[List[Dict]] = None,
        k: int = 5,
    ) -> Dict[str, Any]:
        """Query the RAG system."""
        try:
            search_result = self._query_collection(collection_name, query, k)

            retrieved_docs = (search_result.get("documents") or [[]])[0] or []
            retrieved_metadatas = (search_result.get("metadatas") or [[]])[0] or []

            context = "\n\n".join(retrieved_docs)

            default_system_prompt = """You are a helpful AI assistant. Use the following context to answer the user's question.
If you don't know the answer based on the context, say so politely and offer to help with something else.

Context:
{context}
"""

            prompt_template = system_prompt or default_system_prompt
            if "{context}" not in prompt_template:
                prompt_template = f"{prompt_template}\n\nContext:\n{{context}}"

            history_text = ""
            if chat_history:
                for msg in chat_history[-5:]:
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    history_text += f"{role}: {content}\n"

            full_prompt = f"""{prompt_template}

{history_text}
User: {query}

Assistant:"""

            response = self.llm.invoke(full_prompt.format(context=context)).content

            sources = []
            for i, doc_content in enumerate(retrieved_docs):
                metadata = retrieved_metadatas[i] if i < len(retrieved_metadatas) else {}
                sources.append(
                    {
                        "content": doc_content[:200] + "..." if len(doc_content) > 200 else doc_content,
                        "metadata": metadata,
                    }
                )

            return {
                "response": response,
                "sources": sources,
                "retrieved_chunks": len(retrieved_docs),
            }

        except Exception as e:
            logger.error(f"Error querying RAG: {e}")
            error_text = str(e).lower()

            if "invalid api key" in error_text or "invalid_api_key" in error_text or "401" in error_text:
                return {
                    "response": "Configuration error: GROQ_API_KEY is missing or invalid. Please update your .env and restart backend.",
                    "sources": [],
                    "error": str(e),
                }

            return {
                "response": "I apologize, but I encountered an error processing your request. Please try again.",
                "sources": [],
                "error": str(e),
            }

    def create_qa_chain(self, collection_name: str, system_prompt: Optional[str] = None) -> Any:
        """Compatibility method retained for older callers."""
        raise NotImplementedError("create_qa_chain is unavailable in the lightweight deployment profile. Use query().")

    def similarity_search(self, collection_name: str, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """Perform similarity search on a collection."""
        try:
            search_result = self._query_collection(collection_name, query, k)
            retrieved_docs = (search_result.get("documents") or [[]])[0] or []
            retrieved_metadatas = (search_result.get("metadatas") or [[]])[0] or []
            retrieved_distances = (search_result.get("distances") or [[]])[0] or []

            formatted_results: List[Dict[str, Any]] = []
            for i, doc_content in enumerate(retrieved_docs):
                metadata = retrieved_metadatas[i] if i < len(retrieved_metadatas) else {}
                distance = retrieved_distances[i] if i < len(retrieved_distances) else 0.0
                formatted_results.append(
                    {
                        "content": doc_content,
                        "metadata": metadata,
                        "score": float(distance),
                    }
                )

            return formatted_results

        except Exception as e:
            logger.error(f"Error in similarity search: {e}")
            return []

    def get_collection_stats(self, collection_name: str) -> Dict[str, Any]:
        """Get statistics about a collection."""
        try:
            collection = self._get_collection(collection_name, create_if_missing=False)
            count = collection.count()

            return {
                "collection_name": collection_name,
                "document_count": count,
                "exists": True,
            }

        except Exception as e:
            return {
                "collection_name": collection_name,
                "document_count": 0,
                "exists": False,
                "error": str(e),
            }


# Singleton instance
_rag_service = None


def get_rag_service(groq_api_key: str = None, persist_directory: str = "./chroma_db") -> RAGService:
    """Get or create RAG service singleton."""
    global _rag_service
    if _rag_service is None:
        if groq_api_key is None:
            groq_api_key = os.getenv("GROQ_API_KEY", "")
        _rag_service = RAGService(groq_api_key, persist_directory)
    return _rag_service
