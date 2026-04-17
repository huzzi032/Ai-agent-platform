"""Services module."""
from .document_processor import DocumentProcessor, get_document_processor


def __getattr__(name):
    if name in {"RAGService", "get_rag_service"}:
        from .rag_service import RAGService, get_rag_service

        return {
            "RAGService": RAGService,
            "get_rag_service": get_rag_service,
        }[name]
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

__all__ = [
    'RAGService',
    'DocumentProcessor',
    'get_rag_service',
    'get_document_processor'
]
