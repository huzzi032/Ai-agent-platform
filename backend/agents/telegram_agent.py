"""Telegram Agent using python-telegram-bot."""
import os
import logging
from typing import Dict, Any, Optional
import httpx

from services.rag_service import get_rag_service
from models.database import SessionLocal, Conversation, Message

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TelegramAgent:
    """Telegram Agent for handling Telegram bot messages."""
    
    def __init__(self, bot_token: str, groq_api_key: str):
        """Initialize Telegram agent."""
        self.bot_token = bot_token
        self.api_base = f"https://api.telegram.org/bot{bot_token}"
        self.rag_service = get_rag_service(groq_api_key)
        
        logger.info("Telegram Agent initialized")
    
    async def send_message(
        self, 
        chat_id: str, 
        text: str,
        parse_mode: str = "HTML"
    ) -> Dict[str, Any]:
        """Send a message via Telegram Bot API."""
        try:
            url = f"{self.api_base}/sendMessage"
            
            payload = {
                "chat_id": chat_id,
                "text": text,
                "parse_mode": parse_mode
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                
            result = response.json()
            
            if result.get("ok"):
                logger.info(f"Message sent to chat {chat_id}")
                return {
                    "success": True,
                    "message_id": result["result"]["message_id"]
                }
            else:
                return {
                    "success": False,
                    "error": result.get("description", "Unknown error")
                }
                
        except Exception as e:
            logger.error(f"Error sending Telegram message: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def set_webhook(self, webhook_url: str) -> bool:
        """Set webhook for the bot."""
        try:
            url = f"{self.api_base}/setWebhook"
            
            payload = {
                "url": webhook_url,
                "allowed_updates": ["message", "callback_query"]
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
            
            result = response.json()
            
            if result.get("ok"):
                logger.info(f"Webhook set successfully: {webhook_url}")
                return True
            else:
                logger.error(f"Failed to set webhook: {result}")
                return False
                
        except Exception as e:
            logger.error(f"Error setting webhook: {e}")
            return False
    
    async def delete_webhook(self) -> bool:
        """Delete bot webhook."""
        try:
            url = f"{self.api_base}/deleteWebhook"
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url)
                response.raise_for_status()
            
            result = response.json()
            return result.get("ok", False)
            
        except Exception as e:
            logger.error(f"Error deleting webhook: {e}")
            return False
    
    async def get_bot_info(self) -> Dict[str, Any]:
        """Get bot information."""
        try:
            url = f"{self.api_base}/getMe"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url)
                response.raise_for_status()
            
            result = response.json()
            
            if result.get("ok"):
                return {
                    "success": True,
                    "bot": result["result"]
                }
            else:
                return {
                    "success": False,
                    "error": result.get("description")
                }
                
        except Exception as e:
            logger.error(f"Error getting bot info: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def handle_webhook(
        self, 
        data: Dict[str, Any], 
        agent_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle incoming webhook from Telegram."""
        try:
            logger.info(f"Received Telegram update: {data.get('update_id')}")
            
            # Extract message data
            message = data.get("message", {})
            callback_query = data.get("callback_query", {})
            
            if message:
                chat_id = message.get("chat", {}).get("id")
                text = message.get("text", "")
                from_user = message.get("from", {})
                username = from_user.get("username", "")
                first_name = from_user.get("first_name", "")
                
                logger.info(f"Message from {username or first_name}: {text[:100]}...")
                
                # Get agent settings
                collection_name = agent_config.get("collection_name")
                system_prompt = agent_config.get(
                    "system_prompt", 
                    "You are a helpful Telegram assistant."
                )
                
                # Get or create conversation
                db = SessionLocal()
                try:
                    conversation = db.query(Conversation).filter(
                        Conversation.agent_id == agent_config["agent_id"],
                        Conversation.external_id == str(chat_id),
                        Conversation.platform == "telegram"
                    ).first()
                    
                    if not conversation:
                        conversation = Conversation(
                            agent_id=agent_config["agent_id"],
                            external_id=str(chat_id),
                            platform="telegram",
                            title=f"Telegram: {username or first_name}",
                            extra_data={
                                "username": username,
                                "first_name": first_name,
                                "chat_id": chat_id
                            }
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
                        extra_data={
                            "message_id": message.get("message_id"),
                            "chat_id": chat_id
                        }
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
                    await self.send_message(chat_id, response_text)
                    
                    return {"success": True}
                    
                finally:
                    db.close()
            
            elif callback_query:
                # Handle callback queries (inline buttons)
                await self._handle_callback_query(callback_query, agent_config)
                return {"success": True}
            
            return {"success": True}
            
        except Exception as e:
            logger.error(f"Error handling Telegram webhook: {e}")
            return {"success": False, "error": str(e)}
    
    async def _handle_callback_query(
        self, 
        callback_query: Dict, 
        agent_config: Dict[str, Any]
    ):
        """Handle callback queries from inline keyboards."""
        query_id = callback_query.get("id")
        data = callback_query.get("data", "")
        
        # Answer the callback query
        url = f"{self.api_base}/answerCallbackQuery"
        async with httpx.AsyncClient() as client:
            await client.post(url, json={
                "callback_query_id": query_id,
                "text": "Processing..."
            })
    
    def get_integration_snippet(self, agent_id: int, webhook_url: str) -> Dict[str, Any]:
        """Get integration code snippet for Telegram."""
        return {
            "type": "telegram",
            "setup_steps": [
                "1. Create a Telegram bot using @BotFather",
                "2. Get your bot token from BotFather",
                "3. Add the bot token to your .env file",
                "4. The webhook will be automatically configured",
                f"5. Webhook URL: {webhook_url}"
            ],
            "code_snippet": f'''# Telegram Bot Integration for Agent {agent_id}
# Using python-telegram-bot

from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

# Bot token
BOT_TOKEN = "your_bot_token_here"

# Command handlers
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "Hello! I'm your AI assistant. How can I help you today?"
    )

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # Forward to your API
    user_message = update.message.text
    
    # Call your API
    import requests
    response = requests.post(
        "{webhook_url}",
        json={{
            "message": user_message,
            "chat_id": update.effective_chat.id
        }}
    )
    
    # Send response back
    await update.message.reply_text(response.json()["response"])

# Setup bot
application = Application.builder().token(BOT_TOKEN).build()

# Add handlers
application.add_handler(CommandHandler("start", start))
application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

# Run bot
application.run_polling()
''',
            "webhook_url": webhook_url,
            "api_endpoint": f"/api/agents/{agent_id}/webhook/telegram",
            "requirements": [
                "Telegram Bot Token (from @BotFather)",
                "Webhook URL configured"
            ]
        }


def create_telegram_agent(
    bot_token: str = None,
    groq_api_key: str = None
) -> TelegramAgent:
    """Factory function to create Telegram agent."""
    bot_token = bot_token or os.getenv("TELEGRAM_BOT_TOKEN")
    groq_api_key = groq_api_key or os.getenv("GROQ_API_KEY")
    
    if not bot_token:
        raise ValueError("Telegram bot token not configured")
    
    return TelegramAgent(bot_token, groq_api_key)
