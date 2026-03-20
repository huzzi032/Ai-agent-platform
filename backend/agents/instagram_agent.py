"""Instagram Agent using Meta Graph API."""
import os
import logging
from typing import Dict, Any, Optional, List
import httpx

from services.rag_service import get_rag_service
from models.database import SessionLocal, Conversation, Message

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class InstagramAgent:
    """Instagram Agent for handling Instagram DMs and comments via Meta Graph API."""
    
    def __init__(
        self, 
        access_token: str, 
        app_secret: str,
        business_account_id: str,
        groq_api_key: str
    ):
        """Initialize Instagram agent."""
        self.access_token = access_token
        self.app_secret = app_secret
        self.business_account_id = business_account_id
        self.graph_api_base = "https://graph.facebook.com/v18.0"
        self.rag_service = get_rag_service(groq_api_key)
        
        logger.info(f"Instagram Agent initialized for account: {business_account_id}")
    
    async def send_direct_message(
        self, 
        recipient_id: str, 
        message: str
    ) -> Dict[str, Any]:
        """Send a direct message to an Instagram user."""
        try:
            # Note: Instagram DM API has limitations
            # This uses the Messenger API for Instagram
            url = f"{self.graph_api_base}/me/messages"
            
            payload = {
                "recipient": {"id": recipient_id},
                "message": {"text": message},
                "access_token": self.access_token
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
            
            result = response.json()
            
            if "error" in result:
                logger.error(f"Error sending DM: {result['error']}")
                return {
                    "success": False,
                    "error": result["error"].get("message", "Unknown error")
                }
            
            logger.info(f"DM sent to {recipient_id}")
            return {
                "success": True,
                "message_id": result.get("message_id")
            }
            
        except Exception as e:
            logger.error(f"Error sending Instagram DM: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def reply_to_comment(
        self, 
        comment_id: str, 
        message: str
    ) -> Dict[str, Any]:
        """Reply to an Instagram comment."""
        try:
            url = f"{self.graph_api_base}/{comment_id}/replies"
            
            payload = {
                "message": message,
                "access_token": self.access_token
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
            
            result = response.json()
            
            if "error" in result:
                return {
                    "success": False,
                    "error": result["error"].get("message")
                }
            
            return {
                "success": True,
                "reply_id": result.get("id")
            }
            
        except Exception as e:
            logger.error(f"Error replying to comment: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_conversations(self) -> List[Dict[str, Any]]:
        """Get Instagram conversations."""
        try:
            url = f"{self.graph_api_base}/{self.business_account_id}/conversations"
            
            params = {
                "access_token": self.access_token,
                "fields": "participants,messages{{message,from,created_time}}"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
            
            result = response.json()
            
            if "error" in result:
                return []
            
            return result.get("data", [])
            
        except Exception as e:
            logger.error(f"Error getting conversations: {e}")
            return []
    
    async def handle_webhook(
        self, 
        data: Dict[str, Any], 
        agent_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle incoming webhook from Instagram/Meta."""
        try:
            logger.info(f"Received Instagram webhook: {data.get('object')}")
            
            if data.get("object") != "instagram":
                return {"success": True, "message": "Not an Instagram event"}
            
            for entry in data.get("entry", []):
                # Handle messaging events
                messaging_events = entry.get("messaging", [])
                
                for event in messaging_events:
                    sender = event.get("sender", {}).get("id")
                    recipient = event.get("recipient", {}).get("id")
                    message = event.get("message", {})
                    
                    if message:
                        text = message.get("text", "")
                        
                        logger.info(f"Message from {sender}: {text[:100]}...")
                        
                        # Get agent settings
                        collection_name = agent_config.get("collection_name")
                        system_prompt = agent_config.get(
                            "system_prompt", 
                            "You are a helpful Instagram assistant."
                        )
                        
                        # Get or create conversation
                        db = SessionLocal()
                        try:
                            conversation = db.query(Conversation).filter(
                                Conversation.agent_id == agent_config["agent_id"],
                                Conversation.external_id == sender,
                                Conversation.platform == "instagram"
                            ).first()
                            
                            if not conversation:
                                conversation = Conversation(
                                    agent_id=agent_config["agent_id"],
                                    external_id=sender,
                                    platform="instagram",
                                    title=f"Instagram: {sender}",
                                    extra_data={"sender_id": sender}
                                )
                                db.add(conversation)
                                db.commit()
                                db.refresh(conversation)
                            
                            # Save user message
                            user_message = Message(
                                conversation_id=conversation.id,
                                role="user",
                                content=text,
                                message_type="text",
                                extra_data={"message_id": message.get("mid")}
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
                                    query=text,
                                    system_prompt=system_prompt,
                                    chat_history=chat_history
                                )
                                response_text = result["response"]
                            else:
                                response_text = (
                                    "Hello! I'm not fully trained yet. "
                                    "Please upload documents and train me first."
                                )
                            
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
                            
                            # Send response
                            await self.send_direct_message(sender, response_text)
                            
                        finally:
                            db.close()
                
                # Handle comment mentions
                changes = entry.get("changes", [])
                for change in changes:
                    value = change.get("value", {})
                    
                    if value.get("field") == "mentions":
                        comment_id = value.get("comment_id")
                        media_id = value.get("media_id")
                        
                        logger.info(f"Mention in comment: {comment_id}")
                        # Handle mention logic here
            
            return {"success": True}
            
        except Exception as e:
            logger.error(f"Error handling Instagram webhook: {e}")
            return {"success": False, "error": str(e)}
    
    def verify_webhook(
        self, 
        mode: str, 
        token: str, 
        challenge: str,
        verify_token: str
    ) -> Optional[str]:
        """Verify webhook subscription from Meta."""
        if mode == "subscribe" and token == verify_token:
            logger.info("Webhook verified successfully")
            return challenge
        return None
    
    def get_integration_snippet(self, agent_id: int, webhook_url: str) -> Dict[str, Any]:
        """Get integration code snippet for Instagram."""
        return {
            "type": "instagram",
            "setup_steps": [
                "1. Create a Meta Developer account at https://developers.facebook.com/",
                "2. Create a new app and add Instagram product",
                "3. Get your App ID, App Secret, and Access Token",
                "4. Configure webhook URL in Meta Dashboard:",
                f"   URL: {webhook_url}",
                "5. Subscribe to messaging and mentions webhooks",
                "6. Add credentials to your .env file",
                "7. Note: Instagram DM API requires special permissions"
            ],
            "code_snippet": f'''# Instagram Integration for Agent {agent_id}
# Using Meta Graph API

import requests

# Configuration
ACCESS_TOKEN = "your_access_token"
BUSINESS_ACCOUNT_ID = "your_business_account_id"
GRAPH_API_BASE = "https://graph.facebook.com/v18.0"

def send_dm(recipient_id, message):
    """Send direct message to Instagram user"""
    url = f"{{GRAPH_API_BASE}}/me/messages"
    
    payload = {{
        "recipient": {{"id": recipient_id}},
        "message": {{"text": message}},
        "access_token": ACCESS_TOKEN
    }}
    
    response = requests.post(url, json=payload)
    return response.json()

def reply_to_comment(comment_id, message):
    """Reply to an Instagram comment"""
    url = f"{{GRAPH_API_BASE}}/{{comment_id}}/replies"
    
    payload = {{
        "message": message,
        "access_token": ACCESS_TOKEN
    }}
    
    response = requests.post(url, json=payload)
    return response.json()

# Example usage
result = send_dm("user_id", "Hello from AI Agent!")
print(result)
''',
            "webhook_url": webhook_url,
            "api_endpoint": f"/api/agents/{agent_id}/webhook/instagram",
            "requirements": [
                "Meta Developer Account",
                "Instagram Business Account",
                "Meta App with Instagram product",
                "Access Token with required permissions",
                "Note: DM API requires business verification"
            ],
            "limitations": [
                "Instagram DM API requires business verification",
                "Only approved apps can send DMs",
                "Rate limits apply"
            ]
        }
    
    async def get_account_info(self) -> Dict[str, Any]:
        """Get Instagram account information."""
        try:
            url = f"{self.graph_api_base}/{self.business_account_id}"
            
            params = {
                "access_token": self.access_token,
                "fields": "username,name,biography,followers_count,follows_count"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
            
            result = response.json()
            
            if "error" in result:
                return {"success": False, "error": result["error"]}
            
            return {"success": True, "account": result}
            
        except Exception as e:
            logger.error(f"Error getting account info: {e}")
            return {"success": False, "error": str(e)}


def create_instagram_agent(
    access_token: str = None,
    app_secret: str = None,
    business_account_id: str = None,
    groq_api_key: str = None
) -> InstagramAgent:
    """Factory function to create Instagram agent."""
    access_token = access_token or os.getenv("META_ACCESS_TOKEN")
    app_secret = app_secret or os.getenv("META_APP_SECRET")
    business_account_id = business_account_id or os.getenv("INSTAGRAM_BUSINESS_ACCOUNT_ID")
    groq_api_key = groq_api_key or os.getenv("GROQ_API_KEY")
    
    if not all([access_token, business_account_id]):
        raise ValueError("Instagram credentials not configured")
    
    return InstagramAgent(access_token, app_secret, business_account_id, groq_api_key)
