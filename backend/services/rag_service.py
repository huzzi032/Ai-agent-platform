"""RAG (Retrieval Augmented Generation) Service using LangChain and Groq."""
import os
import importlib
import chromadb
from typing import List, Dict, Any, Optional
from langchain_groq import ChatGroq
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import PromptTemplate
from langchain_core.documents import Document as LangchainDocument
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
import logging


def _load_retrieval_qa() -> Any:
    """Load RetrievalQA from whichever LangChain package is available."""
    for module_name in ("langchain.chains", "langchain_community.chains"):
        try:
            module = importlib.import_module(module_name)
            return getattr(module, "RetrievalQA")
        except (ImportError, AttributeError):
            continue
    return None


RetrievalQA = _load_retrieval_qa()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RAGService:
    """Service for RAG operations with LangChain and Groq."""
    
    def __init__(self, groq_api_key: str, persist_directory: str = "./chroma_db"):
        """Initialize RAG service."""
        self.groq_api_key = groq_api_key
        self.persist_directory = persist_directory

        if not self.groq_api_key:
            logger.warning("GROQ_API_KEY is not configured. RAG responses will fail until it is set.")
        
        # Initialize embeddings
        self.embeddings = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2",
            model_kwargs={'device': 'cpu'}
        )
        
        # Initialize Chroma client
        self.chroma_client = chromadb.PersistentClient(path=persist_directory)
        
        # Initialize LLM
        groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        self.llm = ChatGroq(
            groq_api_key=groq_api_key,
            model_name=groq_model,
            temperature=0.7,
            max_tokens=4096
        )
        
        # Text splitter for chunking
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        
        logger.info("RAG Service initialized successfully")
    
    def create_collection(self, collection_name: str) -> bool:
        """Create a new Chroma collection for an agent."""
        try:
            self.chroma_client.create_collection(name=collection_name)
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
        ids: Optional[List[str]] = None
    ) -> int:
        """Add documents to a collection."""
        try:
            # Get or create collection
            try:
                collection = self.chroma_client.get_collection(name=collection_name)
            except:
                collection = self.chroma_client.create_collection(name=collection_name)
            
            # Split documents into chunks
            all_chunks = []
            all_metadatas = []
            all_ids = []
            
            for i, doc in enumerate(documents):
                chunks = self.text_splitter.split_text(doc)
                for j, chunk in enumerate(chunks):
                    all_chunks.append(chunk)
                    
                    # Metadata
                    metadata = metadatas[i] if metadatas and i < len(metadatas) else {}
                    metadata["chunk_index"] = j
                    metadata["source_index"] = i
                    all_metadatas.append(metadata)
                    
                    # ID
                    doc_id = f"{ids[i] if ids and i < len(ids) else f'doc_{i}'}_chunk_{j}"
                    all_ids.append(doc_id)
            
            # Add to collection
            collection.add(
                documents=all_chunks,
                metadatas=all_metadatas,
                ids=all_ids
            )
            
            logger.info(f"Added {len(all_chunks)} chunks to collection {collection_name}")
            return len(all_chunks)
            
        except Exception as e:
            logger.error(f"Error adding documents: {e}")
            raise
    
    def get_vectorstore(self, collection_name: str) -> Chroma:
        """Get LangChain Chroma vectorstore for a collection."""
        return Chroma(
            client=self.chroma_client,
            collection_name=collection_name,
            embedding_function=self.embeddings
        )
    
    def query(
        self, 
        collection_name: str, 
        query: str, 
        system_prompt: Optional[str] = None,
        chat_history: Optional[List[Dict]] = None,
        k: int = 5
    ) -> Dict[str, Any]:
        """Query the RAG system."""
        try:
            # Get vectorstore
            vectorstore = self.get_vectorstore(collection_name)
            
            # Create retriever
            retriever = vectorstore.as_retriever(
                search_type="similarity",
                search_kwargs={"k": k}
            )
            
            # Retrieve relevant documents
            retrieved_docs = retriever.invoke(query)
            
            # Format context
            context = "\n\n".join([doc.page_content for doc in retrieved_docs])
            
            # Build prompt
            default_system_prompt = """You are a helpful AI assistant. Use the following context to answer the user's question. 
If you don't know the answer based on the context, say so politely and offer to help with something else.

Context:
{context}
"""
            
            prompt_template = system_prompt or default_system_prompt

            # Many agent-level prompts are plain instructions without a {context}
            # placeholder. In that case, append context so RAG grounding is not lost.
            if "{context}" not in prompt_template:
                prompt_template = f"{prompt_template}\n\nContext:\n{{context}}"
            
            # Add chat history if provided
            history_text = ""
            if chat_history:
                for msg in chat_history[-5:]:  # Last 5 messages
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    history_text += f"{role}: {content}\n"
            
            full_prompt = f"""{prompt_template}

{history_text}
User: {query}

Assistant:"""
            
            # Generate response
            response = self.llm.invoke(full_prompt.format(context=context)).content
            
            # Prepare sources
            sources = []
            for doc in retrieved_docs:
                sources.append({
                    "content": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
                    "metadata": doc.metadata
                })
            
            return {
                "response": response,
                "sources": sources,
                "retrieved_chunks": len(retrieved_docs)
            }
            
        except Exception as e:
            logger.error(f"Error querying RAG: {e}")
            error_text = str(e).lower()

            if "invalid api key" in error_text or "invalid_api_key" in error_text or "401" in error_text:
                return {
                    "response": "Configuration error: GROQ_API_KEY is missing or invalid. Please update your .env and restart backend.",
                    "sources": [],
                    "error": str(e)
                }

            return {
                "response": "I apologize, but I encountered an error processing your request. Please try again.",
                "sources": [],
                "error": str(e)
            }
    
    def create_qa_chain(
        self, 
        collection_name: str,
        system_prompt: Optional[str] = None
    ) -> Any:
        """Create a RetrievalQA chain for an agent."""
        vectorstore = self.get_vectorstore(collection_name)
        
        # Custom prompt
        default_template = """Use the following pieces of context to answer the question at the end. 
If you don't know the answer, just say that you don't know, don't try to make up an answer.

{context}

Question: {question}
Helpful Answer:"""
        
        template = system_prompt or default_template
        
        QA_CHAIN_PROMPT = PromptTemplate(
            input_variables=["context", "question"],
            template=template,
        )

        if RetrievalQA is None:
            raise ImportError("RetrievalQA is unavailable. Install langchain or langchain-community.")
        
        # Create chain
        qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=vectorstore.as_retriever(search_kwargs={"k": 5}),
            return_source_documents=True,
            chain_type_kwargs={"prompt": QA_CHAIN_PROMPT}
        )
        
        return qa_chain
    
    def similarity_search(
        self, 
        collection_name: str, 
        query: str, 
        k: int = 5
    ) -> List[Dict[str, Any]]:
        """Perform similarity search on a collection."""
        try:
            vectorstore = self.get_vectorstore(collection_name)
            results = vectorstore.similarity_search_with_score(query, k=k)
            
            formatted_results = []
            for doc, score in results:
                formatted_results.append({
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "score": float(score)
                })
            
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error in similarity search: {e}")
            return []
    
    def get_collection_stats(self, collection_name: str) -> Dict[str, Any]:
        """Get statistics about a collection."""
        try:
            collection = self.chroma_client.get_collection(name=collection_name)
            count = collection.count()
            
            return {
                "collection_name": collection_name,
                "document_count": count,
                "exists": True
            }
            
        except Exception as e:
            return {
                "collection_name": collection_name,
                "document_count": 0,
                "exists": False,
                "error": str(e)
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
