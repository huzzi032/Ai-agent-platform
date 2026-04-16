"""WhatsApp Agent using WhatsApp Business Cloud API."""
import os
import logging
from typing import Dict, Any, Optional, List
import httpx

from services.rag_service import get_rag_service
from models.database import SessionLocal, Conversation, Message

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class WhatsAppAgent:
    """WhatsApp Agent for handling messages via Meta WhatsApp Cloud API."""
    
    def __init__(
        self,
        access_token: str,
        phone_number_id: str,
        verify_token: str,
        groq_api_key: str,
        api_version: str = "v20.0"
    ):
        """Initialize WhatsApp agent."""
        self.access_token = access_token
        self.phone_number_id = phone_number_id
        self.verify_token = verify_token
        self.graph_api_base = f"https://graph.facebook.com/{api_version}"
        self.rag_service = get_rag_service(groq_api_key)

        logger.info(f"WhatsApp Cloud Agent initialized with phone_number_id: {phone_number_id}")

    @staticmethod
    def _normalize_phone_number(number: str) -> str:
        """Normalize phone number for WhatsApp Cloud API."""
        if not number:
            return ""

        cleaned = "".join(ch for ch in number if ch.isdigit())
        return cleaned
    
    def send_message(self, to_number: str, message: str) -> Dict[str, Any]:
        """Send a WhatsApp message using Cloud API."""
        try:
            if not self.access_token or not self.phone_number_id:
                raise ValueError("WhatsApp Cloud credentials are not configured")

            recipient = self._normalize_phone_number(to_number)
            if not recipient:
                raise ValueError("Invalid recipient phone number")

            url = f"{self.graph_api_base}/{self.phone_number_id}/messages"
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            payload = {
                "messaging_product": "whatsapp",
                "to": recipient,
                "type": "text",
                "text": {"body": message}
            }

            response = httpx.post(url, headers=headers, json=payload, timeout=20.0)
            response.raise_for_status()
            result = response.json()

            message_id = None
            messages = result.get("messages") or []
            if messages:
                message_id = messages[0].get("id")

            logger.info(f"WhatsApp message sent to {recipient}: {message_id}")

            return {
                "success": True,
                "message_id": message_id,
                "raw": result
            }

        except Exception as e:
            logger.error(f"Error sending WhatsApp message: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def _extract_messages(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract incoming text messages from WhatsApp Cloud webhook payload."""
        incoming_messages: List[Dict[str, Any]] = []

        for entry in data.get("entry", []):
            for change in entry.get("changes", []):
                value = change.get("value", {})

                contacts = value.get("contacts") or []
                contact_name = ""
                if contacts:
                    contact_name = contacts[0].get("profile", {}).get("name", "")

                for msg in value.get("messages", []):
                    if msg.get("type") != "text":
                        continue

                    text_body = msg.get("text", {}).get("body", "").strip()
                    sender_wa_id = msg.get("from", "")

                    if not text_body or not sender_wa_id:
                        continue

                    incoming_messages.append({
                        "from": sender_wa_id,
                        "name": contact_name,
                        "text": text_body,
                        "message_id": msg.get("id")
                    })

        return incoming_messages

    async def handle_webhook(
        self,
        data: Dict[str, Any],
        agent_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle incoming webhook from WhatsApp Cloud API."""
        try:
            messages = self._extract_messages(data)
            if not messages:
                return {"success": True, "processed_messages": 0}

            collection_name = agent_config.get("collection_name")
            system_prompt = agent_config.get("system_prompt", "You are a helpful WhatsApp assistant.")

            db = SessionLocal()
            try:
                for incoming in messages:
                    from_number = incoming["from"]
                    body = incoming["text"]
                    message_id = incoming.get("message_id")
                    display_name = incoming.get("name") or from_number

                    logger.info(f"Received WhatsApp message from {from_number}: {body[:100]}...")

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
                            title=f"WhatsApp: {display_name}",
                            extra_data={"wa_id": from_number, "name": display_name}
                        )
                        db.add(conversation)
                        db.commit()
                        db.refresh(conversation)

                    user_message = Message(
                        conversation_id=conversation.id,
                        role="user",
                        content=body,
                        message_type="text",
                        extra_data={"message_id": message_id, "wa_id": from_number}
                    )
                    db.add(user_message)

                    chat_history = []
                    for msg in conversation.messages[-10:]:
                        chat_history.append({
                            "role": msg.role,
                            "content": msg.content
                        })

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

                    assistant_message = Message(
                        conversation_id=conversation.id,
                        role="assistant",
                        content=response_text,
                        message_type="text",
                        rag_context={"sources": result.get("sources", [])} if collection_name else None
                    )
                    db.add(assistant_message)
                    db.commit()

                    send_result = self.send_message(from_number, response_text)
                    if not send_result.get("success"):
                        logger.error(
                            "Failed to send WhatsApp response to %s: %s",
                            from_number,
                            send_result.get("error")
                        )

                return {"success": True, "processed_messages": len(messages)}

            finally:
                db.close()

        except Exception as e:
            logger.error(f"Error handling WhatsApp webhook: {e}")
            return {"success": False, "error": str(e)}

    def get_integration_snippet(self, agent_id: int, webhook_url: str) -> Dict[str, Any]:
        """Get integration code snippet for WhatsApp."""
        return {
            "type": "whatsapp",
            "setup_steps": [
                "1. Create a Meta Developer account at https://developers.facebook.com/",
                "2. Create a Business app and add the WhatsApp product",
                "3. In WhatsApp > API Setup, copy Access Token and Phone Number ID",
                "4. Configure Webhook in Meta dashboard:",
                f"   Callback URL: {webhook_url}",
                "5. Set Verify Token to match WHATSAPP_VERIFY_TOKEN",
                "6. Subscribe webhook field: messages",
                "7. Save credentials in .env"
            ],
            "code_snippet": f'''# WhatsApp Cloud API Integration for Agent {agent_id}
import requests

ACCESS_TOKEN = "your_whatsapp_access_token"
PHONE_NUMBER_ID = "your_whatsapp_phone_number_id"

def send_whatsapp_message(to_number: str, text: str):
    url = f"https://graph.facebook.com/v20.0/{{PHONE_NUMBER_ID}}/messages"
    headers = {{
        "Authorization": f"Bearer {{ACCESS_TOKEN}}",
        "Content-Type": "application/json"
    }}
    payload = {{
        "messaging_product": "whatsapp",
        "to": to_number,
        "type": "text",
        "text": {{"body": text}}
    }}
    response = requests.post(url, headers=headers, json=payload, timeout=20)
    response.raise_for_status()
    return response.json()

result = send_whatsapp_message("923001234567", "Hello from AI Agent!")
print(result)
''',
            "webhook_url": webhook_url,
            "api_endpoint": f"/api/agents/{agent_id}/webhook/whatsapp",
            "requirements": [
                "Meta Developer App (Business type)",
                "WhatsApp Cloud Access Token",
                "WhatsApp Phone Number ID",
                "Webhook URL with HTTPS",
                "Matching Verify Token"
            ]
        }

    def verify_webhook(self, mode: Optional[str], token: Optional[str], challenge: Optional[str]) -> Optional[str]:
        """Verify webhook subscription from Meta."""
        if mode == "subscribe" and token == self.verify_token:
            logger.info("WhatsApp webhook verified successfully")
            return challenge
        return None


def create_whatsapp_agent(
    access_token: str = None,
    phone_number_id: str = None,
    verify_token: str = None,
    groq_api_key: str = None,
    allow_incomplete: bool = False
) -> WhatsAppAgent:
    """Factory function to create WhatsApp agent."""
    access_token = access_token or os.getenv("WHATSAPP_ACCESS_TOKEN")
    phone_number_id = phone_number_id or os.getenv("WHATSAPP_PHONE_NUMBER_ID")
    verify_token = verify_token or os.getenv("WHATSAPP_VERIFY_TOKEN")
    groq_api_key = groq_api_key or os.getenv("GROQ_API_KEY")

    if not allow_incomplete and not all([access_token, phone_number_id, verify_token]):
        raise ValueError("WhatsApp Cloud credentials not configured")

    return WhatsAppAgent(
        access_token=access_token or "",
        phone_number_id=phone_number_id or "",
        verify_token=verify_token or "",
        groq_api_key=groq_api_key
    )
