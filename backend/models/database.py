"""Database models and connection setup."""
import os
import logging
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Boolean, ForeignKey, JSON, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

Base = declarative_base()
logger = logging.getLogger(__name__)


class User(Base):
    """User model for authentication and management."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    agents = relationship("Agent", back_populates="user", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")


class Agent(Base):
    """AI Agent configuration model."""
    __tablename__ = "agents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    agent_type = Column(String, nullable=False)  # whatsapp, telegram, instagram, chatbot, gmail
    description = Column(Text)
    status = Column(String, default="inactive")  # inactive, training, active, error
    
    # Agent-specific configuration
    config = Column(JSON, default=dict)  # Store agent-specific settings
    
    # Integration settings
    integration_code = Column(Text)  # Code snippet for embedding
    api_endpoint = Column(String)  # API endpoint for this agent
    webhook_url = Column(String)  # Webhook URL for receiving messages
    
    # Training info
    is_trained = Column(Boolean, default=False)
    training_status = Column(String, default="pending")  # pending, processing, completed, failed
    last_trained_at = Column(DateTime)
    
    # RAG settings
    collection_name = Column(String)  # Chroma collection name
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="agents")
    documents = relationship("Document", back_populates="agent")
    conversations = relationship("Conversation", back_populates="agent", cascade="all, delete-orphan")


class Document(Base):
    """Document model for training data."""
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=True)
    
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # pdf, image, text, url
    file_size = Column(Integer)
    
    # Content extraction
    extracted_text = Column(Text)
    content_metadata = Column(JSON, default=dict)
    
    # Processing status
    processing_status = Column(String, default="pending")  # pending, processing, completed, failed
    processing_error = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="documents")
    agent = relationship("Agent", back_populates="documents")


class Conversation(Base):
    """Conversation/chat history model."""
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=False)
    external_id = Column(String)  # WhatsApp number, Telegram chat ID, etc.
    platform = Column(String)  # whatsapp, telegram, instagram, chatbot, gmail
    
    # Conversation metadata
    title = Column(String)
    extra_data = Column("metadata", JSON, default=dict)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    agent = relationship("Agent", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    """Individual message in a conversation."""
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    
    role = Column(String, nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    
    # Message metadata
    message_type = Column(String, default="text")  # text, image, file, etc.
    extra_data = Column("metadata", JSON, default=dict)
    
    # RAG context used
    rag_context = Column(JSON, default=dict)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")


class AgentIntegration(Base):
    """Track agent integrations by users."""
    __tablename__ = "agent_integrations"
    
    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=False)
    integration_type = Column(String, nullable=False)  # snippet, api, webhook, sdk
    integration_data = Column(JSON, default=dict)
    is_active = Column(Boolean, default=True)
    usage_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


# Database connection
def get_engine(database_url: str = None):
    """Create database engine."""
    if database_url is None:
        database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        database_url = "sqlite:////tmp/ai_agent_platform.db" if os.getenv("VERCEL") else "sqlite:///./ai_agent_platform.db"
    
    connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
    return create_engine(database_url, connect_args=connect_args)


def init_db(engine):
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)


def get_session_local(engine):
    """Get session maker."""
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)


# SessionLocal is wired at runtime by app.main lifespan.
# Avoid creating/writing DB files at import time (serverless filesystems are read-only outside /tmp).
SessionLocal = None
