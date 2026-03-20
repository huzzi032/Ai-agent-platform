"""Chatbot Agent with embeddable widget for websites."""
import os
import json
import logging
from typing import Dict, Any, Optional, List

from services.rag_service import get_rag_service
from models.database import SessionLocal, Conversation, Message

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ChatbotAgent:
    """Chatbot Agent for website embedding."""
    
    def __init__(self, groq_api_key: str):
        """Initialize Chatbot agent."""
        self.rag_service = get_rag_service(groq_api_key)
        logger.info("Chatbot Agent initialized")
    
    async def chat(
        self,
        message: str,
        conversation_id: Optional[int] = None,
        session_id: Optional[str] = None,
        agent_config: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Process a chat message and return response."""
        try:
            agent_config = agent_config or {}
            collection_name = agent_config.get("collection_name")
            system_prompt = agent_config.get(
                "system_prompt",
                "You are a helpful chatbot assistant."
            )
            agent_id = agent_config.get("agent_id")
            
            # Get or create conversation
            db = SessionLocal()
            try:
                if conversation_id:
                    conversation = db.query(Conversation).filter(
                        Conversation.id == conversation_id
                    ).first()
                elif session_id:
                    conversation = db.query(Conversation).filter(
                        Conversation.agent_id == agent_id,
                        Conversation.external_id == session_id,
                        Conversation.platform == "chatbot"
                    ).first()
                else:
                    conversation = None
                
                if not conversation and agent_id:
                    conversation = Conversation(
                        agent_id=agent_id,
                        external_id=session_id or f"session_{os.urandom(8).hex()}",
                        platform="chatbot",
                        title=f"Chatbot Session"
                    )
                    db.add(conversation)
                    db.commit()
                    db.refresh(conversation)
                
                if conversation:
                    # Save user message
                    user_message = Message(
                        conversation_id=conversation.id,
                        role="user",
                        content=message,
                        message_type="text"
                    )
                    db.add(user_message)
                    
                    # Get chat history
                    chat_history = []
                    for msg in conversation.messages[-10:]:
                        chat_history.append({
                            "role": msg.role,
                            "content": msg.content
                        })
                else:
                    chat_history = []
                
                # Generate response using RAG
                if collection_name:
                    result = self.rag_service.query(
                        collection_name=collection_name,
                        query=message,
                        system_prompt=system_prompt,
                        chat_history=chat_history
                    )
                    response_text = result["response"]
                    sources = result.get("sources", [])
                else:
                    response_text = (
                        "Hello! I'm your AI assistant. I'm currently being set up "
                        "with knowledge. Please check back soon!"
                    )
                    sources = []
                
                # Save assistant message
                if conversation:
                    assistant_message = Message(
                        conversation_id=conversation.id,
                        role="assistant",
                        content=response_text,
                        message_type="text",
                        rag_context={"sources": sources} if collection_name else None
                    )
                    db.add(assistant_message)
                    db.commit()
                    
                    return {
                        "success": True,
                        "response": response_text,
                        "conversation_id": conversation.id,
                        "session_id": conversation.external_id,
                        "sources": sources
                    }
                else:
                    return {
                        "success": True,
                        "response": response_text,
                        "sources": sources
                    }
                    
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error in chat: {e}")
            return {
                "success": False,
                "error": str(e),
                "response": "I apologize, but I encountered an error. Please try again."
            }
    
    def generate_widget_code(
        self, 
        agent_id: int, 
        api_url: str,
        config: Dict[str, Any] = None
    ) -> str:
        """Generate embeddable widget code."""
        config = config or {}
        
        widget_color = config.get("widget_color", "#4F46E5")
        widget_position = config.get("widget_position", "bottom-right")
        welcome_message = config.get(
            "welcome_message", 
            "Hello! How can I help you today?"
        )
        
        position_css = {
            "bottom-right": "bottom: 20px; right: 20px;",
            "bottom-left": "bottom: 20px; left: 20px;",
            "top-right": "top: 20px; right: 20px;",
            "top-left": "top: 20px; left: 20px;"
        }.get(widget_position, "bottom: 20px; right: 20px;")
        
        widget_code = f'''
<!-- AI Chatbot Widget - Agent {agent_id} -->
<div id="ai-chatbot-widget-{agent_id}"></div>
<script>
(function() {{
    // Configuration
    const CONFIG = {{
        agentId: {agent_id},
        apiUrl: "{api_url}",
        color: "{widget_color}",
        welcomeMessage: "{welcome_message}",
        position: "{widget_position}"
    }};
    
    // Create widget HTML
    const widgetHTML = `
        <style>
            #ai-chat-widget-{agent_id} {{
                position: fixed;
                {position_css}
                z-index: 9999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }}
            
            .chat-button-{agent_id} {{
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: {widget_color};
                color: white;
                border: none;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.2s;
            }}
            
            .chat-button-{agent_id}:hover {{
                transform: scale(1.05);
            }}
            
            .chat-container-{agent_id} {{
                position: fixed;
                {position_css}
                width: 380px;
                height: 500px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                display: none;
                flex-direction: column;
                overflow: hidden;
            }}
            
            .chat-header-{agent_id} {{
                background: {widget_color};
                color: white;
                padding: 16px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }}
            
            .chat-header-{agent_id} h3 {{
                margin: 0;
                font-size: 16px;
                font-weight: 600;
            }}
            
            .chat-close-{agent_id} {{
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            }}
            
            .chat-messages-{agent_id} {{
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                background: #f8f9fa;
            }}
            
            .message-{agent_id} {{
                margin-bottom: 16px;
                max-width: 80%;
                padding: 12px 16px;
                border-radius: 12px;
                font-size: 14px;
                line-height: 1.5;
            }}
            
            .message-user-{agent_id} {{
                background: {widget_color};
                color: white;
                margin-left: auto;
                border-bottom-right-radius: 4px;
            }}
            
            .message-bot-{agent_id} {{
                background: white;
                color: #333;
                border-bottom-left-radius: 4px;
                box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            }}
            
            .chat-input-container-{agent_id} {{
                padding: 16px 20px;
                background: white;
                border-top: 1px solid #e5e7eb;
                display: flex;
                gap: 12px;
            }}
            
            .chat-input-{agent_id} {{
                flex: 1;
                padding: 12px 16px;
                border: 1px solid #e5e7eb;
                border-radius: 24px;
                font-size: 14px;
                outline: none;
            }}
            
            .chat-input-{agent_id}:focus {{
                border-color: {widget_color};
            }}
            
            .chat-send-{agent_id} {{
                width: 44px;
                height: 44px;
                border-radius: 50%;
                background: {widget_color};
                color: white;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }}
            
            .typing-indicator-{agent_id} {{
                display: none;
                padding: 12px 16px;
                background: white;
                border-radius: 12px;
                margin-bottom: 16px;
                width: fit-content;
            }}
            
            .typing-indicator-{agent_id} span {{
                display: inline-block;
                width: 8px;
                height: 8px;
                background: #999;
                border-radius: 50%;
                margin: 0 2px;
                animation: typing 1s infinite;
            }}
            
            .typing-indicator-{agent_id} span:nth-child(2) {{
                animation-delay: 0.2s;
            }}
            
            .typing-indicator-{agent_id} span:nth-child(3) {{
                animation-delay: 0.4s;
            }}
            
            @keyframes typing {{
                0%, 100% {{ transform: translateY(0); }}
                50% {{ transform: translateY(-5px); }}
            }}
        </style>
        
        <button class="chat-button-{agent_id}" onclick="toggleChat{agent_id}()">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
        </button>
        
        <div class="chat-container-{agent_id}" id="chatContainer{agent_id}">
            <div class="chat-header-{agent_id}">
                <h3>💬 AI Assistant</h3>
                <button class="chat-close-{agent_id}" onclick="toggleChat{agent_id}()">×</button>
            </div>
            <div class="chat-messages-{agent_id}" id="chatMessages{agent_id}">
                <div class="typing-indicator-{agent_id}" id="typing{agent_id}">
                    <span></span><span></span><span></span>
                </div>
            </div>
            <div class="chat-input-container-{agent_id}">
                <input type="text" class="chat-input-{agent_id}" id="chatInput{agent_id}" 
                       placeholder="Type your message..." 
                       onkeypress="handleKeyPress{agent_id}(event)">
                <button class="chat-send-{agent_id}" onclick="sendMessage{agent_id}()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </div>
        </div>
    `;
    
    // Inject widget
    document.getElementById('ai-chatbot-widget-{agent_id}').innerHTML = widgetHTML;
    
    // State
    let sessionId = localStorage.getItem('chatSession{agent_id}') || generateSessionId();
    let conversationId = localStorage.getItem('chatConversation{agent_id}') || null;
    
    function generateSessionId() {{
        const id = 'session_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('chatSession{agent_id}', id);
        return id;
    }}
    
    // Toggle chat
    window.toggleChat{agent_id} = function() {{
        const container = document.getElementById('chatContainer{agent_id}');
        const button = document.querySelector('.chat-button-{agent_id}');
        
        if (container.style.display === 'flex') {{
            container.style.display = 'none';
            button.style.display = 'flex';
        }} else {{
            container.style.display = 'flex';
            button.style.display = 'none';
            
            // Show welcome message if first time
            if (!localStorage.getItem('chatWelcome{agent_id}')) {{
                addMessage('bot', CONFIG.welcomeMessage);
                localStorage.setItem('chatWelcome{agent_id}', 'true');
            }}
            
            document.getElementById('chatInput{agent_id}').focus();
        }}
    }};
    
    // Add message to chat
    function addMessage(role, text) {{
        const container = document.getElementById('chatMessages{agent_id}');
        const typing = document.getElementById('typing{agent_id}');
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-{agent_id} message-${{role === 'user' ? 'user' : 'bot'}}-{agent_id}`;
        messageDiv.textContent = text;
        
        container.insertBefore(messageDiv, typing);
        container.scrollTop = container.scrollHeight;
    }}
    
    // Show/hide typing indicator
    function showTyping(show) {{
        document.getElementById('typing{agent_id}').style.display = show ? 'block' : 'none';
    }}
    
    // Send message
    window.sendMessage{agent_id} = async function() {{
        const input = document.getElementById('chatInput{agent_id}');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message
        addMessage('user', message);
        input.value = '';
        
        // Show typing
        showTyping(true);
        
        try {{
            // Call API
            const response = await fetch(`${{CONFIG.apiUrl}}/api/chat`, {{
                method: 'POST',
                headers: {{ 'Content-Type': 'application/json' }},
                body: JSON.stringify({{
                    message: message,
                    agent_id: CONFIG.agentId,
                    session_id: sessionId,
                    conversation_id: conversationId
                }})
            }});
            
            const data = await response.json();
            
            // Hide typing
            showTyping(false);
            
            if (data.success) {{
                addMessage('bot', data.response);
                
                // Save conversation ID
                if (data.conversation_id) {{
                    conversationId = data.conversation_id;
                    localStorage.setItem('chatConversation{agent_id}', conversationId);
                }}
            }} else {{
                addMessage('bot', 'Sorry, I encountered an error. Please try again.');
            }}
        }} catch (error) {{
            showTyping(false);
            addMessage('bot', 'Sorry, I couldn\'t connect. Please try again.');
            console.error('Chat error:', error);
        }}
    }};
    
    // Handle enter key
    window.handleKeyPress{agent_id} = function(event) {{
        if (event.key === 'Enter') {{
            sendMessage{agent_id}();
        }}
    }};
}})();
</script>
'''
        return widget_code.strip()
    
    def get_integration_options(
        self, 
        agent_id: int, 
        api_url: str,
        config: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Get all integration options for the chatbot."""
        config = config or {}
        
        widget_code = self.generate_widget_code(agent_id, api_url, config)
        
        return {
            "type": "chatbot",
            "integration_methods": [
                {
                    "name": "Widget Embed",
                    "description": "Copy and paste this code into your website HTML",
                    "code": widget_code,
                    "placement": "Before closing </body> tag"
                },
                {
                    "name": "Direct API",
                    "description": "Use the REST API directly",
                    "code": f'''// JavaScript API Client
const chatbot = {{
    apiUrl: "{api_url}/api/chat",
    agentId: {agent_id},
    sessionId: "your_session_id",
    
    async sendMessage(message) {{
        const response = await fetch(this.apiUrl, {{
            method: 'POST',
            headers: {{ 'Content-Type': 'application/json' }},
            body: JSON.stringify({{
                message: message,
                agent_id: this.agentId,
                session_id: this.sessionId
            }})
        }});
        return await response.json();
    }}
}};

// Usage
chatbot.sendMessage("Hello!").then(response => {{
    console.log(response.response);
}});
''',
                    "endpoint": f"{api_url}/api/chat",
                    "method": "POST",
                    "headers": {
                        "Content-Type": "application/json"
                    },
                    "body": {
                        "message": "string",
                        "agent_id": agent_id,
                        "session_id": "string (optional)",
                        "conversation_id": "integer (optional)"
                    }
                },
                {
                    "name": "React Component",
                    "description": "React component for easy integration",
                    "code": f'''// ChatbotWidget.jsx
import React, {{ useState, useRef, useEffect }} from 'react';

const ChatbotWidget = () => {{
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId] = useState(() => 
    localStorage.getItem('chatSession') || `session_${{Math.random().toString(36).substr(2, 9)}}`
  );
  
  const sendMessage = async () => {{
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, {{ role: 'user', text: input }}]);
    
    const response = await fetch('{api_url}/api/chat', {{
      method: 'POST',
      headers: {{ 'Content-Type': 'application/json' }},
      body: JSON.stringify({{
        message: input,
        agent_id: {agent_id},
        session_id: sessionId
      }})
    }});
    
    const data = await response.json();
    setMessages(prev => [...prev, {{ role: 'bot', text: data.response }}]);
    setInput('');
  }};
  
  return (
    <div className="chatbot-widget">
      {{/* Your JSX here */}}
    </div>
  );
}};

export default ChatbotWidget;
'''
                },
                {
                    "name": "WordPress Plugin",
                    "description": "Shortcode for WordPress",
                    "code": f'''// Add to your theme's functions.php or custom plugin

function ai_chatbot_shortcode() {{
    ob_start();
    ?>
    <div id="ai-chatbot"></div>
    <script src="{api_url}/api/agents/{agent_id}/widget.js"></script>
    <?php
    return ob_get_clean();
}}
add_shortcode('ai_chatbot', 'ai_chatbot_shortcode');

// Usage in posts/pages:
// [ai_chatbot]
'''
                }
            ],
            "configuration": {
                "widget_color": config.get("widget_color", "#4F46E5"),
                "widget_position": config.get("widget_position", "bottom-right"),
                "welcome_message": config.get("welcome_message", "Hello! How can I help you today?"),
                "custom_css": "Add your custom CSS to override default styles"
            }
        }


def create_chatbot_agent(groq_api_key: str = None) -> ChatbotAgent:
    """Factory function to create Chatbot agent."""
    groq_api_key = groq_api_key or os.getenv("GROQ_API_KEY")
    return ChatbotAgent(groq_api_key)
