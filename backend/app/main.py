"""Main FastAPI application for AI Agent Platform."""
import datetime
import os
import logging
import io
import re
import zipfile
from contextlib import asynccontextmanager
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root before anything else
load_dotenv(Path(__file__).parent.parent.parent / ".env")

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

# Import models and schemas
from models.database import (
    get_engine, init_db, get_session_local, 
    User, Agent, Document, Conversation, Message
)
from models.schemas import (
    UserCreate, UserResponse, UserLogin, Token,
    AgentCreate, AgentUpdate, AgentResponse, AgentDetailResponse,
    DocumentResponse, DocumentUploadResponse,
    TrainRequest, TrainResponse, TrainingStatusResponse,
    ChatRequest, ChatResponse, AgentTestRequest, AgentTestResponse,
    IntegrationResponse, WidgetConfigResponse,
    HealthCheck, AgentStats, UserDashboard,
    WhatsAppWebhook, TelegramWebhook, InstagramWebhook
)

# Import services
from services.rag_service import get_rag_service
from services.document_processor import get_document_processor

# Import agents
from agents.whatsapp_agent import create_whatsapp_agent
from agents.telegram_agent import create_telegram_agent
from agents.instagram_agent import create_instagram_agent
from agents.gmail_agent import create_gmail_agent
from agents.chatbot_agent import create_chatbot_agent

# Import auth utilities
from app.auth import (
    authenticate_user, create_access_token, 
    get_current_user, get_password_hash,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from app.config import get_settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables
engine = None
SessionLocal = None
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    global engine, SessionLocal
    
    # Startup
    logger.info("Starting up AI Agent Platform...")
    
    # Initialize database
    engine = get_engine(settings.DATABASE_URL)
    init_db(engine)
    SessionLocal = get_session_local(engine)
    
    # Initialize RAG service
    try:
        rag_service = get_rag_service(settings.GROQ_API_KEY, settings.CHROMA_PERSIST_DIRECTORY)
        logger.info("RAG service initialized")
    except Exception as e:
        logger.warning(f"RAG service initialization failed: {e}")
    
    logger.info("AI Agent Platform started successfully!")
    
    yield
    
    # Shutdown
    logger.info("Shutting down AI Agent Platform...")


# Create FastAPI app
app = FastAPI(
    title="AI Agent Platform API",
    description="Multi-agent AI platform with RAG capabilities",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


# Dependency to get DB session
def get_db():
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _normalize_hex_color(color: str, default: str = "#4F46E5") -> str:
    """Normalize HEX color input for generated assets."""
    if not color:
        return default

    value = color.strip()
    if re.fullmatch(r"#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})", value):
        return value
    return default


def _sanitize_text(value: Optional[str], default: str, max_length: int = 120) -> str:
    """Sanitize untrusted text input before injecting into generated files."""
    if not value:
        return default
    cleaned = " ".join(str(value).split())
    return cleaned[:max_length] if cleaned else default


def _escape_php_single_quoted(value: str) -> str:
    """Escape text for safe insertion into single-quoted PHP strings."""
    return value.replace("\\", "\\\\").replace("'", "\\'")


def _build_wordpress_plugin_zip(
    agent_id: int,
    api_url: str,
    primary_color: str,
    welcome_message: str,
    bot_name: str,
    launcher_label: str,
    widget_position: str,
) -> bytes:
    """Build a WordPress plugin ZIP file that embeds the chatbot widget."""
    slug = f"ai-chatbot-agent-{agent_id}"
    php_filename = f"{slug}.php"
    position = widget_position if widget_position in {"bottom-right", "bottom-left"} else "bottom-right"

    api_url_php = _escape_php_single_quoted(api_url)
    welcome_message_php = _escape_php_single_quoted(welcome_message)
    bot_name_php = _escape_php_single_quoted(bot_name)
    launcher_label_php = _escape_php_single_quoted(launcher_label)
    primary_color_php = _escape_php_single_quoted(primary_color)
    position_php = _escape_php_single_quoted(position)

    plugin_php = f'''<?php
/**
 * Plugin Name: AI Chatbot Agent {agent_id}
 * Description: Embeds your AI Agent Platform chatbot on every page.
 * Version: 1.0.0
 * Author: AI Agent Platform
 */

if (!defined('ABSPATH')) {{
    exit;
}}

function ai_chatbot_agent_{agent_id}_enqueue_assets() {{
    $plugin_url = plugin_dir_url(__FILE__);

    wp_enqueue_style(
        'ai-chatbot-agent-{agent_id}-styles',
        $plugin_url . 'assets/chatbot-plugin.css',
        array(),
        '1.0.0'
    );

    wp_enqueue_script(
        'ai-chatbot-agent-{agent_id}-script',
        $plugin_url . 'assets/chatbot-plugin.js',
        array(),
        '1.0.0',
        true
    );

    wp_localize_script('ai-chatbot-agent-{agent_id}-script', 'aiChatbotConfig', array(
        'apiEndpoint' => '{api_url_php}/api/public/agents/{agent_id}/chat',
        'agentId' => {agent_id},
        'welcomeMessage' => '{welcome_message_php}',
        'botName' => '{bot_name_php}',
        'launcherLabel' => '{launcher_label_php}',
        'primaryColor' => '{primary_color_php}',
        'position' => '{position_php}'
    ));
}}
add_action('wp_enqueue_scripts', 'ai_chatbot_agent_{agent_id}_enqueue_assets');

function ai_chatbot_agent_{agent_id}_render_widget() {{
    ?>
    <div id="ai-chatbot-widget" class="ai-chatbot-position-<?php echo esc_attr(aiChatbotConfigPosition()); ?>" style="--ai-chatbot-primary: <?php echo esc_attr(aiChatbotConfigColor()); ?>;">
        <button id="ai-chatbot-toggle" type="button" aria-label="Open chatbot">
            <span class="ai-chatbot-toggle-icon">AI</span>
            <span class="ai-chatbot-toggle-label"><?php echo esc_html(aiChatbotConfigLabel()); ?></span>
        </button>

        <div id="ai-chatbot-panel" aria-hidden="true">
            <div class="ai-chatbot-header">
                <div class="ai-chatbot-title-wrap">
                    <p class="ai-chatbot-title"><?php echo esc_html(aiChatbotConfigName()); ?></p>
                    <p class="ai-chatbot-subtitle">AI Assistant</p>
                </div>
                <button id="ai-chatbot-close" type="button" aria-label="Close chatbot">&times;</button>
            </div>
            <div id="ai-chatbot-messages"></div>
            <div class="ai-chatbot-input-wrap">
                <textarea id="ai-chatbot-input" rows="1" placeholder="Type your message..."></textarea>
                <button id="ai-chatbot-send" type="button">Send</button>
            </div>
        </div>
    </div>
    <?php
}}
add_action('wp_footer', 'ai_chatbot_agent_{agent_id}_render_widget');

function aiChatbotConfigColor() {{
    return '{primary_color_php}';
}}

function aiChatbotConfigName() {{
    return '{bot_name_php}';
}}

function aiChatbotConfigLabel() {{
    return '{launcher_label_php}';
}}

function aiChatbotConfigPosition() {{
    return '{position_php}';
}}
?>
'''

    plugin_js = '''(function () {
    const config = window.aiChatbotConfig || {};

    const widget = document.getElementById('ai-chatbot-widget');
    const panel = document.getElementById('ai-chatbot-panel');
    const toggle = document.getElementById('ai-chatbot-toggle');
    const closeBtn = document.getElementById('ai-chatbot-close');
    const sendBtn = document.getElementById('ai-chatbot-send');
    const input = document.getElementById('ai-chatbot-input');
    const messages = document.getElementById('ai-chatbot-messages');

    if (!widget || !panel || !toggle || !sendBtn || !input || !messages) {
        return;
    }

    let hasWelcome = false;
    const sessionKey = `wp_chatbot_session_${config.agentId || 'default'}`;
    let sessionId = localStorage.getItem(sessionKey);

    if (!sessionId) {
        sessionId = `session_${Math.random().toString(36).slice(2, 12)}`;
        localStorage.setItem(sessionKey, sessionId);
    }

    function addMessage(role, text, extraClass) {
        const bubble = document.createElement('div');
        bubble.className = `ai-chatbot-message ai-chatbot-${role}${extraClass ? ` ${extraClass}` : ''}`;
        bubble.textContent = text;
        messages.appendChild(bubble);
        messages.scrollTop = messages.scrollHeight;
    }

    function togglePanel(forceOpen) {
        const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : panel.getAttribute('aria-hidden') === 'true';
        panel.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
        panel.classList.toggle('is-open', shouldOpen);

        if (shouldOpen && !hasWelcome) {
            addMessage('bot', config.welcomeMessage || 'Hello! How can I help you today?');
            hasWelcome = true;
            input.focus();
        }
    }

    async function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        addMessage('user', text);
        input.value = '';
        addMessage('bot', 'Typing...', 'is-typing');

        try {
            const response = await fetch(config.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agent_id: Number(config.agentId),
                    message: text,
                    external_id: sessionId
                })
            });

            const data = await response.json();
            const typing = messages.querySelector('.is-typing');
            if (typing) typing.remove();

            if (!response.ok) {
                addMessage('bot', data.detail || 'Unable to get a response right now.');
                return;
            }

            addMessage('bot', data.response || 'No response received.');
        } catch (error) {
            const typing = messages.querySelector('.is-typing');
            if (typing) typing.remove();
            addMessage('bot', 'Connection error. Please try again.');
            console.error('WordPress chatbot error:', error);
        }
    }

    toggle.addEventListener('click', function () {
        togglePanel();
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', function () {
            togglePanel(false);
        });
    }

    sendBtn.addEventListener('click', sendMessage);

    input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });
})();
'''

    plugin_css = '''#ai-chatbot-widget {
    position: fixed;
    z-index: 99999;
    font-family: "Segoe UI", Arial, sans-serif;
}

#ai-chatbot-widget.ai-chatbot-position-bottom-right {
    right: 20px;
    bottom: 20px;
}

#ai-chatbot-widget.ai-chatbot-position-bottom-left {
    left: 20px;
    bottom: 20px;
}

#ai-chatbot-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    border: none;
    border-radius: 999px;
    background: var(--ai-chatbot-primary, #4F46E5);
    color: #fff;
    padding: 12px 14px;
    cursor: pointer;
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.2);
}

.ai-chatbot-toggle-icon {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
}

#ai-chatbot-panel {
    width: 360px;
    height: 500px;
    margin-top: 10px;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.22);
    overflow: hidden;
    display: none;
    flex-direction: column;
}

#ai-chatbot-panel.is-open {
    display: flex;
}

.ai-chatbot-header {
    background: var(--ai-chatbot-primary, #4F46E5);
    color: #fff;
    padding: 14px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.ai-chatbot-title {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
}

.ai-chatbot-subtitle {
    margin: 2px 0 0;
    font-size: 12px;
    opacity: 0.9;
}

#ai-chatbot-close {
    border: none;
    background: transparent;
    color: #fff;
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
}

#ai-chatbot-messages {
    flex: 1;
    overflow-y: auto;
    background: #f8fafc;
    padding: 12px;
}

.ai-chatbot-message {
    max-width: 88%;
    margin-bottom: 10px;
    border-radius: 12px;
    padding: 10px 12px;
    line-height: 1.4;
    font-size: 14px;
    white-space: pre-wrap;
}

.ai-chatbot-user {
    background: var(--ai-chatbot-primary, #4F46E5);
    color: #fff;
    margin-left: auto;
}

.ai-chatbot-bot {
    background: #fff;
    border: 1px solid #e5e7eb;
    color: #1f2937;
}

.ai-chatbot-bot.is-typing {
    opacity: 0.7;
    font-style: italic;
}

.ai-chatbot-input-wrap {
    border-top: 1px solid #e5e7eb;
    display: flex;
    gap: 8px;
    padding: 10px;
    background: #fff;
}

#ai-chatbot-input {
    flex: 1;
    border-radius: 10px;
    border: 1px solid #d1d5db;
    padding: 10px;
    resize: none;
    font-size: 14px;
    font-family: inherit;
}

#ai-chatbot-send {
    border: none;
    border-radius: 10px;
    background: var(--ai-chatbot-primary, #4F46E5);
    color: #fff;
    padding: 0 14px;
    cursor: pointer;
    font-weight: 600;
}

@media (max-width: 640px) {
    #ai-chatbot-panel {
        width: min(92vw, 360px);
        height: 72vh;
    }
}
'''

    readme = f'''AI Chatbot Agent {agent_id} (WordPress Plugin)

Installation:
1. Go to WordPress Admin -> Plugins -> Add New -> Upload Plugin.
2. Upload this ZIP file and click Install.
3. Activate the plugin.
4. Open your website and the chatbot launcher will appear.

Configuration in this package:
- Agent ID: {agent_id}
- API endpoint: {api_url}/api/public/agents/{agent_id}/chat
- Primary color: {primary_color}
- Widget position: {position}
- Bot name: {bot_name}
- Launcher label: {launcher_label}
'''

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as plugin_zip:
        plugin_zip.writestr(f"{slug}/{php_filename}", plugin_php)
        plugin_zip.writestr(f"{slug}/assets/chatbot-plugin.js", plugin_js)
        plugin_zip.writestr(f"{slug}/assets/chatbot-plugin.css", plugin_css)
        plugin_zip.writestr(f"{slug}/README.txt", readme)

    return zip_buffer.getvalue()


# ============ HEALTH CHECK ============
@app.get("/api/health", response_model=HealthCheck)
async def health_check():
    """Health check endpoint."""
    services = {
        "database": engine is not None,
        "rag": True  # Add proper check
    }
    
    return HealthCheck(
        status="healthy" if all(services.values()) else "degraded",
        version="1.0.0",
        services=services
    )


# ============ AUTHENTICATION ============
@app.post("/api/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if user exists
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or username already exists"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password,
        full_name=user_data.full_name
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@app.post("/api/auth/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login and get access token."""
    user = authenticate_user(db, form_data.username, form_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info."""
    return current_user


# ============ AGENTS ============
@app.get("/api/agents", response_model=list[AgentResponse])
async def list_agents(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all agents for current user."""
    agents = db.query(Agent).filter(
        Agent.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    return agents


@app.post("/api/agents", response_model=AgentResponse)
async def create_agent(
    agent_data: AgentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new agent."""
    # Generate collection name for RAG
    import uuid
    collection_name = f"agent_{current_user.id}_{uuid.uuid4().hex[:8]}"
    
    # Create agent config
    config = agent_data.config.dict() if agent_data.config else {}
    
    # Create agent
    new_agent = Agent(
        user_id=current_user.id,
        name=agent_data.name,
        agent_type=agent_data.agent_type.value,
        description=agent_data.description,
        config=config,
        collection_name=collection_name,
        status="inactive"
    )
    
    db.add(new_agent)
    db.commit()
    db.refresh(new_agent)
    
    # Generate integration code
    webhook_base = f"{settings.API_URL}/api/agents/{new_agent.id}/webhook"
    new_agent.webhook_url = f"{webhook_base}/{agent_data.agent_type.value}"
    new_agent.api_endpoint = f"{settings.API_URL}/api/agents/{new_agent.id}/chat"
    
    db.commit()
    db.refresh(new_agent)
    
    # Create RAG collection
    try:
        rag_service = get_rag_service()
        rag_service.create_collection(collection_name)
    except Exception as e:
        logger.warning(f"Failed to create RAG collection: {e}")
    
    return new_agent


@app.get("/api/agents/{agent_id}", response_model=AgentDetailResponse)
async def get_agent(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get agent details."""
    agent = db.query(Agent).filter(
        Agent.id == agent_id,
        Agent.user_id == current_user.id
    ).first()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Get conversation count
    conversation_count = db.query(Conversation).filter(
        Conversation.agent_id == agent_id
    ).count()
    
    return {
        **agent.__dict__,
        "conversation_count": conversation_count
    }


@app.put("/api/agents/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: int,
    agent_data: AgentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an agent."""
    agent = db.query(Agent).filter(
        Agent.id == agent_id,
        Agent.user_id == current_user.id
    ).first()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Update fields
    if agent_data.name:
        agent.name = agent_data.name
    if agent_data.description is not None:
        agent.description = agent_data.description
    if agent_data.config:
        agent.config = agent_data.config.dict()
    if agent_data.status:
        agent.status = agent_data.status.value
    
    db.commit()
    db.refresh(agent)
    
    return agent


@app.delete("/api/agents/{agent_id}")
async def delete_agent(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an agent."""
    agent = db.query(Agent).filter(
        Agent.id == agent_id,
        Agent.user_id == current_user.id
    ).first()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Delete RAG collection
    try:
        rag_service = get_rag_service()
        rag_service.delete_collection(agent.collection_name)
    except Exception as e:
        logger.warning(f"Failed to delete RAG collection: {e}")
    
    db.delete(agent)
    db.commit()
    
    return {"success": True, "message": "Agent deleted successfully"}


# ============ DOCUMENTS ============
@app.post("/api/agents/{agent_id}/documents/upload", response_model=DocumentUploadResponse)
async def upload_document(
    agent_id: int,
    file: Optional[UploadFile] = File(None),
    url: Optional[str] = Form(None),
    text: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a document for agent training."""
    # Verify agent belongs to user
    agent = db.query(Agent).filter(
        Agent.id == agent_id,
        Agent.user_id == current_user.id
    ).first()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    processor = get_document_processor()
    
    # Handle different input types
    if file:
        # Save uploaded file
        upload_dir = f"./uploads/{current_user.id}/{agent_id}"
        os.makedirs(upload_dir, exist_ok=True)
        
        file_path = f"{upload_dir}/{file.filename}"
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Process file
        result = processor.process_file(file_path, file.filename)
        file_type = processor.get_file_type(file.filename)
        original_filename = file.filename
        
    elif url:
        # Process URL
        result = processor.process_url(url)
        file_path = url
        file_type = "url"
        original_filename = url.split('/')[-1] or "web_content"
        
    elif text:
        # Process text input
        result = processor.process_text_input(text)
        file_path = "text_input"
        file_type = "text"
        original_filename = "user_input.txt"
        
    else:
        raise HTTPException(
            status_code=400, 
            detail="No file, URL, or text provided"
        )
    
    # Create document record
    new_document = Document(
        user_id=current_user.id,
        agent_id=agent_id,
        filename=original_filename,
        original_filename=original_filename,
        file_path=file_path,
        file_type=file_type,
        file_size=os.path.getsize(file_path) if os.path.exists(file_path) else 0,
        extracted_text=result["text"],
        content_metadata=result["metadata"],
        processing_status="completed"
    )
    
    db.add(new_document)
    db.commit()
    db.refresh(new_document)
    
    return {
        "document": new_document,
        "message": "Document uploaded and processed successfully"
    }


@app.get("/api/agents/{agent_id}/documents", response_model=list[DocumentResponse])
async def list_documents(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List documents for an agent."""
    documents = db.query(Document).filter(
        Document.agent_id == agent_id,
        Document.user_id == current_user.id
    ).all()
    
    return documents


@app.delete("/api/documents/{document_id}")
async def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a document."""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete file if exists
    if os.path.exists(document.file_path):
        os.remove(document.file_path)
    
    db.delete(document)
    db.commit()
    
    return {"success": True, "message": "Document deleted successfully"}


# ============ TRAINING ============
@app.post("/api/agents/{agent_id}/train", response_model=TrainResponse)
async def train_agent(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Train agent on uploaded documents."""
    agent = db.query(Agent).filter(
        Agent.id == agent_id,
        Agent.user_id == current_user.id
    ).first()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Get documents
    documents = db.query(Document).filter(
        Document.agent_id == agent_id,
        Document.processing_status == "completed"
    ).all()
    
    if not documents:
        raise HTTPException(
            status_code=400, 
            detail="No documents available for training"
        )
    
    # Update agent status
    agent.training_status = "processing"
    agent.status = "training"
    db.commit()
    
    try:
        # Get RAG service
        rag_service = get_rag_service()
        
        # Prepare documents for training
        texts = []
        metadatas = []
        ids = []
        
        for doc in documents:
            if doc.extracted_text:
                texts.append(doc.extracted_text)
                metadatas.append({
                    "document_id": doc.id,
                    "filename": doc.filename,
                    "file_type": doc.file_type
                })
                ids.append(f"doc_{doc.id}")
        
        # Add to RAG
        chunks_created = rag_service.add_documents(
            collection_name=agent.collection_name,
            documents=texts,
            metadatas=metadatas,
            ids=ids
        )
        
        # Update agent
        agent.is_trained = True
        agent.training_status = "completed"
        agent.last_trained_at = datetime.utcnow()
        agent.status = "active"
        db.commit()
        
        return {
            "success": True,
            "message": "Agent trained successfully",
            "agent_id": agent_id,
            "documents_processed": len(documents),
            "chunks_created": chunks_created
        }
        
    except Exception as e:
        agent.training_status = "failed"
        agent.status = "error"
        db.commit()
        
        logger.error(f"Training failed: {e}")
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


@app.get("/api/agents/{agent_id}/training-status", response_model=TrainingStatusResponse)
async def get_training_status(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get training status for an agent."""
    agent = db.query(Agent).filter(
        Agent.id == agent_id,
        Agent.user_id == current_user.id
    ).first()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    return {
        "agent_id": agent_id,
        "status": agent.training_status,
        "message": f"Training is {agent.training_status}"
    }


# ============ CHAT ============
@app.post("/api/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Chat with an agent."""
    agent_id = request.agent_id
    
    # Get agent
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    if agent.status != "active":
        raise HTTPException(
            status_code=400, 
            detail="Agent is not active. Please train the agent first."
        )
    
    # Create chatbot agent
    chatbot = create_chatbot_agent()
    
    # Prepare config
    config = {
        "agent_id": agent.id,
        "collection_name": agent.collection_name,
        "system_prompt": agent.config.get("system_prompt", "You are a helpful assistant.")
    }
    
    # Process chat
    result = await chatbot.chat(
        message=request.message,
        conversation_id=request.conversation_id,
        session_id=request.external_id,
        agent_config=config
    )
    
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "Chat failed"))
    
    return {
        "response": result["response"],
        "conversation_id": result.get("conversation_id"),
        "message_id": 0,  # Will be set by database
        "sources": result.get("sources", [])
    }


@app.post("/api/public/agents/{agent_id}/chat", response_model=ChatResponse)
async def public_chat(
    agent_id: int,
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """Public chat endpoint for website/widget integrations (no auth)."""
    if request.agent_id != agent_id:
        raise HTTPException(status_code=400, detail="agent_id mismatch")

    agent = db.query(Agent).filter(Agent.id == agent_id).first()

    if not agent or agent.agent_type != "chatbot":
        raise HTTPException(status_code=404, detail="Chatbot agent not found")

    if agent.status != "active":
        raise HTTPException(
            status_code=400,
            detail="Agent is not active. Please train the agent first."
        )

    chatbot = create_chatbot_agent()
    config = {
        "agent_id": agent.id,
        "collection_name": agent.collection_name,
        "system_prompt": agent.config.get("system_prompt", "You are a helpful assistant.")
    }

    result = await chatbot.chat(
        message=request.message,
        conversation_id=request.conversation_id,
        session_id=request.external_id,
        agent_config=config
    )

    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Chat failed"))

    return {
        "response": result.get("response", ""),
        "conversation_id": result.get("conversation_id", 0),
        "message_id": 0,
        "sources": result.get("sources", [])
    }


@app.post("/api/agents/{agent_id}/test", response_model=AgentTestResponse)
async def test_agent(
    agent_id: int,
    request: AgentTestRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Test an agent with conversation or channel simulation mode."""
    agent = db.query(Agent).filter(
        Agent.id == agent_id,
        Agent.user_id == current_user.id
    ).first()

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    if agent.status != "active":
        raise HTTPException(
            status_code=400,
            detail="Agent is not active. Please train the agent first."
        )

    chatbot = create_chatbot_agent()
    session_id = request.session_id or f"test_{agent.agent_type}_{agent_id}"
    simulated_payload = None

    if request.mode == "simulation":
        if agent.agent_type == "whatsapp":
            simulated_payload = {
                "From": "whatsapp:+10000000000",
                "Body": request.message,
                "MessageSid": f"SM_TEST_{agent_id}"
            }
        elif agent.agent_type == "telegram":
            simulated_payload = {
                "update_id": 999999,
                "message": {
                    "from": {"id": 123456, "username": "test_user"},
                    "text": request.message
                }
            }
        elif agent.agent_type == "instagram":
            simulated_payload = {
                "object": "instagram",
                "entry": [{
                    "id": "test_entry",
                    "messaging": [{
                        "sender": {"id": "ig_test_user"},
                        "message": {"text": request.message}
                    }]
                }]
            }
        elif agent.agent_type == "gmail":
            simulated_payload = {
                "from": "test@example.com",
                "subject": "Test Email",
                "body": request.message
            }

    config = {
        "agent_id": agent.id,
        "collection_name": agent.collection_name,
        "system_prompt": agent.config.get("system_prompt", "You are a helpful assistant.")
    }

    result = await chatbot.chat(
        message=request.message,
        session_id=session_id,
        agent_config=config
    )

    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Test failed"))

    return {
        "agent_id": agent.id,
        "agent_type": agent.agent_type,
        "mode": request.mode,
        "response": result.get("response", ""),
        "conversation_id": result.get("conversation_id"),
        "sources": result.get("sources", []),
        "simulated_payload": simulated_payload
    }


# ============ INTEGRATIONS ============
@app.get("/api/agents/{agent_id}/integration/{integration_type}")
async def get_integration(
    agent_id: int,
    integration_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get integration code for an agent."""
    agent = db.query(Agent).filter(
        Agent.id == agent_id,
        Agent.user_id == current_user.id
    ).first()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    webhook_url = f"{settings.API_URL}/api/agents/{agent_id}/webhook/{agent.agent_type}"
    
    if agent.agent_type == "whatsapp":
        whatsapp_agent = create_whatsapp_agent()
        return whatsapp_agent.get_integration_snippet(agent_id, webhook_url)
        
    elif agent.agent_type == "telegram":
        telegram_agent = create_telegram_agent()
        return telegram_agent.get_integration_snippet(agent_id, webhook_url)
        
    elif agent.agent_type == "instagram":
        instagram_agent = create_instagram_agent()
        return instagram_agent.get_integration_snippet(agent_id, webhook_url)
        
    elif agent.agent_type == "gmail":
        gmail_agent = create_gmail_agent()
        return gmail_agent.get_integration_snippet(agent_id, webhook_url)
        
    elif agent.agent_type == "chatbot":
        chatbot_agent = create_chatbot_agent()
        return chatbot_agent.get_integration_options(
            agent_id, 
            settings.API_URL,
            agent.config
        )
    
    raise HTTPException(status_code=400, detail="Invalid agent type")


@app.get("/api/agents/{agent_id}/widget.js")
async def get_widget_js(
    agent_id: int,
    db: Session = Depends(get_db)
):
    """Get widget JavaScript for chatbot agent."""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    
    if not agent or agent.agent_type != "chatbot":
        raise HTTPException(status_code=404, detail="Chatbot agent not found")
    
    chatbot_agent = create_chatbot_agent()
    widget_code = chatbot_agent.generate_widget_code(
        agent_id, 
        settings.API_URL,
        agent.config
    )
    
    return HTMLResponse(content=widget_code, media_type="application/javascript")


@app.get("/api/agents/{agent_id}/integration/wordpress/plugin.zip")
async def download_wordpress_plugin_zip(
    agent_id: int,
    api_url: Optional[str] = Query(default=None),
    primary_color: Optional[str] = Query(default="#4F46E5"),
    welcome_message: Optional[str] = Query(default="Hello! How can I help you today?"),
    bot_name: Optional[str] = Query(default="AI Assistant"),
    launcher_label: Optional[str] = Query(default="Chat"),
    widget_position: Optional[str] = Query(default="bottom-right"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate and download a ready-to-upload WordPress plugin ZIP."""
    agent = db.query(Agent).filter(
        Agent.id == agent_id,
        Agent.user_id == current_user.id,
        Agent.agent_type == "chatbot"
    ).first()

    if not agent:
        raise HTTPException(status_code=404, detail="Chatbot agent not found")

    resolved_api_url = (api_url or settings.API_URL).rstrip('/')

    plugin_bytes = _build_wordpress_plugin_zip(
        agent_id=agent_id,
        api_url=resolved_api_url,
        primary_color=_normalize_hex_color(primary_color, agent.config.get("widget_color", "#4F46E5")),
        welcome_message=_sanitize_text(welcome_message, agent.config.get("welcome_message", "Hello! How can I help you today?"), max_length=220),
        bot_name=_sanitize_text(bot_name, agent.name, max_length=60),
        launcher_label=_sanitize_text(launcher_label, "Chat", max_length=24),
        widget_position=(widget_position or agent.config.get("widget_position", "bottom-right"))
    )

    filename = f"ai-chatbot-agent-{agent_id}-wordpress.zip"
    headers = {
        "Content-Disposition": f"attachment; filename={filename}"
    }

    return StreamingResponse(io.BytesIO(plugin_bytes), media_type="application/zip", headers=headers)


# ============ WEBHOOKS ============
@app.post("/api/agents/{agent_id}/webhook/whatsapp")
async def whatsapp_webhook(
    agent_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Handle WhatsApp webhook from Twilio."""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    whatsapp_agent = create_whatsapp_agent()
    
    config = {
        "agent_id": agent.id,
        "collection_name": agent.collection_name,
        "system_prompt": agent.config.get("system_prompt")
    }
    
    response = await whatsapp_agent.handle_webhook(request, config)
    return HTMLResponse(content=response, media_type="application/xml")


@app.post("/api/agents/{agent_id}/webhook/telegram")
async def telegram_webhook(
    agent_id: int,
    data: dict,
    db: Session = Depends(get_db)
):
    """Handle Telegram webhook."""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    telegram_agent = create_telegram_agent()
    
    config = {
        "agent_id": agent.id,
        "collection_name": agent.collection_name,
        "system_prompt": agent.config.get("system_prompt")
    }
    
    result = await telegram_agent.handle_webhook(data, config)
    return result


@app.get("/api/agents/{agent_id}/webhook/instagram")
async def instagram_verify_webhook(
    agent_id: int,
    hub_mode: str = None,
    hub_verify_token: str = None,
    hub_challenge: str = None,
    db: Session = Depends(get_db)
):
    """Verify Instagram webhook subscription."""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    instagram_agent = create_instagram_agent()
    
    verify_token = settings.META_VERIFY_TOKEN
    challenge = instagram_agent.verify_webhook(
        hub_mode, hub_verify_token, hub_challenge, verify_token
    )
    
    if challenge:
        return HTMLResponse(content=challenge)
    
    raise HTTPException(status_code=403, detail="Verification failed")


@app.post("/api/agents/{agent_id}/webhook/instagram")
async def instagram_webhook(
    agent_id: int,
    data: InstagramWebhook,
    db: Session = Depends(get_db)
):
    """Handle Instagram webhook."""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    instagram_agent = create_instagram_agent()
    
    config = {
        "agent_id": agent.id,
        "collection_name": agent.collection_name,
        "system_prompt": agent.config.get("system_prompt")
    }
    
    result = await instagram_agent.handle_webhook(data.dict(), config)
    return result


# ============ DASHBOARD ============
@app.get("/api/dashboard", response_model=UserDashboard)
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user dashboard data."""
    # Get agents
    agents = db.query(Agent).filter(Agent.user_id == current_user.id).all()
    
    # Calculate stats
    total_agents = len(agents)
    active_agents = sum(1 for a in agents if a.status == "active")
    
    agents_by_type = {}
    for agent in agents:
        agents_by_type[agent.agent_type] = agents_by_type.get(agent.agent_type, 0) + 1
    
    # Get conversations
    agent_ids = [a.id for a in agents]
    conversations = db.query(Conversation).filter(
        Conversation.agent_id.in_(agent_ids)
    ).order_by(Conversation.updated_at.desc()).limit(10).all()
    
    total_conversations = db.query(Conversation).filter(
        Conversation.agent_id.in_(agent_ids)
    ).count()
    
    total_messages = db.query(Message).join(Conversation).filter(
        Conversation.agent_id.in_(agent_ids)
    ).count()
    
    stats = AgentStats(
        total_agents=total_agents,
        active_agents=active_agents,
        total_conversations=total_conversations,
        total_messages=total_messages,
        agents_by_type=agents_by_type
    )
    
    return {
        "user": current_user,
        "agents": agents,
        "stats": stats,
        "recent_conversations": conversations
    }


# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
