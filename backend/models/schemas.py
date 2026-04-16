"""Pydantic schemas for API requests and responses."""
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# ============ ENUMS ============
class AgentType(str, Enum):
    WHATSAPP = "whatsapp"
    TELEGRAM = "telegram"
    INSTAGRAM = "instagram"
    CHATBOT = "chatbot"
    GMAIL = "gmail"


class AgentStatus(str, Enum):
    INACTIVE = "inactive"
    TRAINING = "training"
    ACTIVE = "active"
    ERROR = "error"


class TrainingStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class DocumentType(str, Enum):
    PDF = "pdf"
    IMAGE = "image"
    TEXT = "text"
    URL = "url"


# ============ USER SCHEMAS ============
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ============ AGENT SCHEMAS ============
class AgentConfig(BaseModel):
    """Agent-specific configuration."""
    # WhatsApp
    phone_number: Optional[str] = None
    whatsapp_phone_number_id: Optional[str] = None
    whatsapp_access_token: Optional[str] = None
    whatsapp_verify_token: Optional[str] = None
    
    # Telegram
    bot_token: Optional[str] = None
    
    # Instagram
    account_id: Optional[str] = None
    
    # Chatbot
    widget_color: Optional[str] = "#4F46E5"
    widget_position: Optional[str] = "bottom-right"
    welcome_message: Optional[str] = "Hello! How can I help you today?"
    
    # Gmail
    email_address: Optional[str] = None
    auto_reply: Optional[bool] = True
    
    # General
    system_prompt: Optional[str] = "You are a helpful AI assistant."
    max_context_length: Optional[int] = 10
    temperature: Optional[float] = 0.7


class AgentBase(BaseModel):
    name: str
    agent_type: AgentType
    description: Optional[str] = None
    config: Optional[AgentConfig] = None


class AgentCreate(AgentBase):
    pass


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    config: Optional[AgentConfig] = None
    status: Optional[AgentStatus] = None


class AgentResponse(AgentBase):
    id: int
    user_id: int
    status: AgentStatus
    is_trained: bool
    training_status: TrainingStatus
    last_trained_at: Optional[datetime]
    collection_name: Optional[str]
    integration_code: Optional[str]
    api_endpoint: Optional[str]
    webhook_url: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AgentDetailResponse(AgentResponse):
    documents: List["DocumentResponse"] = []
    conversation_count: int = 0


# ============ DOCUMENT SCHEMAS ============
class DocumentBase(BaseModel):
    filename: str
    file_type: DocumentType


class DocumentCreate(DocumentBase):
    pass


class DocumentResponse(DocumentBase):
    id: int
    user_id: int
    agent_id: Optional[int]
    original_filename: str
    file_size: Optional[int]
    processing_status: str
    processing_error: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class DocumentUploadResponse(BaseModel):
    document: DocumentResponse
    message: str


# ============ TRAINING SCHEMAS ============
class TrainRequest(BaseModel):
    agent_id: int
    document_ids: Optional[List[int]] = None  # If None, use all documents


class TrainResponse(BaseModel):
    success: bool
    message: str
    agent_id: int
    documents_processed: int
    chunks_created: int


class TrainingStatusResponse(BaseModel):
    agent_id: int
    status: TrainingStatus
    progress: Optional[float] = None
    message: Optional[str] = None


# ============ CONVERSATION SCHEMAS ============
class MessageBase(BaseModel):
    role: str
    content: str
    message_type: Optional[str] = "text"


class MessageCreate(MessageBase):
    pass


class MessageResponse(MessageBase):
    id: int
    conversation_id: int
    extra_data: Optional[Dict[str, Any]] = None
    rag_context: Optional[Dict[str, Any]] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class ConversationBase(BaseModel):
    external_id: Optional[str] = None
    platform: str
    title: Optional[str] = None


class ConversationCreate(ConversationBase):
    agent_id: int


class ConversationResponse(ConversationBase):
    id: int
    agent_id: int
    extra_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []
    
    class Config:
        from_attributes = True


# ============ CHAT SCHEMAS ============
class ChatRequest(BaseModel):
    agent_id: int
    message: str
    conversation_id: Optional[int] = None
    external_id: Optional[str] = None  # For external platforms
    metadata: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    response: str
    conversation_id: int
    message_id: int
    sources: Optional[List[Dict[str, Any]]] = None


class TestMode(str, Enum):
    CONVERSATION = "conversation"
    SIMULATION = "simulation"


class AgentTestRequest(BaseModel):
    message: str
    mode: TestMode = TestMode.CONVERSATION
    session_id: Optional[str] = None


class AgentTestResponse(BaseModel):
    agent_id: int
    agent_type: AgentType
    mode: TestMode
    response: str
    conversation_id: Optional[int] = None
    sources: Optional[List[Dict[str, Any]]] = None
    simulated_payload: Optional[Dict[str, Any]] = None


# ============ INTEGRATION SCHEMAS ============
class IntegrationType(str, Enum):
    SNIPPET = "snippet"
    API = "api"
    WEBHOOK = "webhook"
    SDK = "sdk"


class IntegrationResponse(BaseModel):
    agent_id: int
    integration_type: IntegrationType
    code: Optional[str] = None
    api_endpoint: Optional[str] = None
    webhook_url: Optional[str] = None
    documentation: Optional[str] = None
    setup_instructions: Optional[List[str]] = None


class WidgetConfigResponse(BaseModel):
    agent_id: int
    widget_code: str
    script_url: str
    configuration: Dict[str, Any]


# ============ WEBHOOK SCHEMAS ============
class WhatsAppWebhook(BaseModel):
    object: Optional[str] = None
    entry: Optional[List[Dict[str, Any]]] = None


class TelegramWebhook(BaseModel):
    update_id: int
    message: Optional[Dict[str, Any]] = None
    callback_query: Optional[Dict[str, Any]] = None


class InstagramWebhookEntry(BaseModel):
    id: str
    time: int
    messaging: Optional[List[Dict[str, Any]]] = None
    changes: Optional[List[Dict[str, Any]]] = None


class InstagramWebhook(BaseModel):
    object: str
    entry: List[InstagramWebhookEntry]


class GmailWebhook(BaseModel):
    message: Dict[str, Any]
    subscription: str


# ============ HEALTH / DASHBOARD SCHEMAS ============
class HealthCheck(BaseModel):
    status: str
    version: str
    services: Dict[str, Any] = {}


class AgentStats(BaseModel):
    total_agents: int = 0
    active_agents: int = 0
    total_conversations: int = 0
    total_messages: int = 0
    agents_by_type: Dict[str, int] = {}


class UserDashboard(BaseModel):
    user: UserResponse
    agents: List[AgentResponse] = []
    stats: AgentStats
    recent_conversations: List[Any] = []

    class Config:
        from_attributes = True


# ============ DASHBOARD SCHEMAS ============
class AgentStats(BaseModel):
    total_agents: int
    active_agents: int
    total_conversations: int
    total_messages: int
    agents_by_type: Dict[str, int]


class UserDashboard(BaseModel):
    user: UserResponse
    agents: List[AgentResponse]
    stats: AgentStats
    recent_conversations: List[ConversationResponse]


# ============ HEALTH CHECK ============
class HealthCheck(BaseModel):
    status: str
    version: str
    services: Dict[str, bool]
