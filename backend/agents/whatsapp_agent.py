"""WhatsApp Agent using Twilio API."""
import os
import logging
from typing import Dict, Any, Optional
from twilio.rest import Client
from twilio.twiml.messaging_response import MessagingResponse
from fastapi import Request

from services.rag_service import get_rag_service
from models.database import SessionLocal, Conversation, Message

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class WhatsAppAgent:
    """WhatsApp Agent for handling WhatsApp messages via Twilio."""
    
    def __init__(
        self, 
        account_sid: str, 
        auth_token: str, 
        phone_number: str,
        groq_api_key: str
    ):
        """Initialize WhatsApp agent."""
        self.account_sid = account_sid
        self.auth_token = auth_token
        self.phone_number = phone_number
        self.client = Client(account_sid, auth_token)
        self.rag_service = get_rag_service(groq_api_key)
        
        logger.info(f"WhatsApp Agent initialized with number: {phone_number}")
    
    def send_message(self, to_number: str, message: str) -> Dict[str, Any]:
        """Send a WhatsApp message."""
        try:
            # Format number for WhatsApp
            if not to_number.startswith("whatsapp:"):
                to_number = f"whatsapp:{to_number}"
            
            from_number = f"whatsapp:{self.phone_number}"
            
            message = self.client.messages.create(
                from_=from_number,
                body=message,
                to=to_number
            )
            
            logger.info(f"Message sent to {to_number}: {message.sid}")
            
            return {
                "success": True,
                "message_sid": message.sid,
                "status": message.status
            }
            
        except Exception as e:
            logger.error(f"Error sending WhatsApp message: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def handle_webhook(
        self, 
        request: Request, 
        agent_config: Dict[str, Any]
    ) -> str:
        """Handle incoming webhook from Twilio."""
        try:
            # Parse form data from Twilio
            form_data = await request.form()
            data = dict(form_data)
            
            from_number = data.get("From", "").replace("whatsapp:", "")
            body = data.get("Body", "").strip()
            message_sid = data.get("MessageSid", "")
            num_media = int(data.get("NumMedia", 0))
            
            logger.info(f"Received message from {from_number}: {body[:100]}...")
            
            # Get agent settings
            collection_name = agent_config.get("collection_name")
            system_prompt = agent_config.get("system_prompt", "You are a helpful WhatsApp assistant.")
            
            # Get or create conversation
            db = SessionLocal()
            try:
                conversation = db.query(Conversation).filter(
                    Conversation.agent_id == agent_config["agent_id"],
                    Conversation.external_id == from_number,
                    Conversation.platform == "whatsapp"
                ).first()
                
                if not conversation:
                    conversation = Conversation(
                        agent_id=agent_config["agent_id"],
                        external_id=from_number,
                        platform="whatsapp",
                        title=f"WhatsApp: {from_number}"
                    )
                    db.add(conversation)
                    db.commit()
                    db.refresh(conversation)
                
                # Save user message
                user_message = Message(
                    conversation_id=conversation.id,
                    role="user",
                    content=body,
                    message_type="text",
                    extra_data={"message_sid": message_sid}
                )
                db.add(user_message)
                
                # Get chat history
                chat_history = []
                for msg in conversation.messages[-10:]:
                    chat_history.append({
                        "role": msg.role,
                        "content": msg.content
                    })
                
                # Generate response using RAG
                if collection_name:
                    result = self.rag_service.query(
                        collection_name=collection_name,
                        query=body,
                        system_prompt=system_prompt,
                        chat_history=chat_history
                    )
                    response_text = result["response"]
                else:
                    response_text = "Hello! I'm not fully trained yet. Please upload documents and train me first."
                
                # Save assistant message
                assistant_message = Message(
                    conversation_id=conversation.id,
                    role="assistant",
                    content=response_text,
                    message_type="text",
                    rag_context={"sources": result.get("sources", [])} if collection_name else None
                )
                db.add(assistant_message)
                db.commit()
                
                # Create Twilio response
                twiml = MessagingResponse()
                twiml.message(response_text)
                
                return str(twiml)
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error handling WhatsApp webhook: {e}")
            twiml = MessagingResponse()
            twiml.message("Sorry, I encountered an error. Please try again.")
            return str(twiml)
    
    def get_integration_snippet(self, agent_id: int, webhook_url: str) -> Dict[str, Any]:
        """Get integration code snippet for WhatsApp."""
        return {
            "type": "whatsapp",
            "setup_steps": [
                "1. Create a Twilio account at https://www.twilio.com/try-twilio",
                "2. Get a WhatsApp-enabled phone number from Twilio",
                "3. Configure the webhook URL in Twilio Console:",
                f"   URL: {webhook_url}",
                "4. Set the webhook for incoming messages",
                "5. Add your Twilio credentials to the .env file"
            ],
            "code_snippet": f'''# WhatsApp Integration for Agent {agent_id}
# Using Twilio API

from twilio.rest import Client

# Initialize client
client = Client(
    "your_twilio_account_sid",
    "your_twilio_auth_token"
)

# Send message
message = client.messages.create(
    from_="whatsapp:your_twilio_number",
    body="Hello from AI Agent!",
    to="whatsapp:recipient_number"
)

print(f"Message sent: {{message.sid}}")
''',
            "webhook_url": webhook_url,
            "api_endpoint": f"/api/agents/{agent_id}/webhook/whatsapp",
            "requirements": [
                "Twilio Account",
                "WhatsApp-enabled phone number",
                "Webhook URL configured"
            ]
        }
    
    def verify_webhook(self, request: Request) -> bool:
        """Verify Twilio webhook signature."""
        # In production, implement proper signature verification
        # https://www.twilio.com/docs/usage/security#validating-requests
        return True


def create_whatsapp_agent(
    account_sid: str = None,
    auth_token: str = None,
    phone_number: str = None,
    groq_api_key: str = None
) -> WhatsAppAgent:
    """Factory function to create WhatsApp agent."""
    account_sid = account_sid or os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = auth_token or os.getenv("TWILIO_AUTH_TOKEN")
    phone_number = phone_number or os.getenv("TWILIO_PHONE_NUMBER")
    groq_api_key = groq_api_key or os.getenv("GROQ_API_KEY")
    
    if not all([account_sid, auth_token, phone_number]):
        raise ValueError("Twilio credentials not configured")
    
    return WhatsAppAgent(account_sid, auth_token, phone_number, groq_api_key)
