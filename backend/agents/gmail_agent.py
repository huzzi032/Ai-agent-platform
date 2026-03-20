"""Gmail Agent using Gmail API."""
import os
import base64
import logging
from typing import Dict, Any, Optional, List
from email.mime.text import MIMEText
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow

from services.rag_service import get_rag_service
from models.database import SessionLocal, Conversation, Message

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GmailAgent:
    """Gmail Agent for handling emails via Gmail API."""
    
    SCOPES = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/gmail.labels'
    ]
    
    def __init__(
        self, 
        client_id: str, 
        client_secret: str,
        redirect_uri: str,
        groq_api_key: str
    ):
        """Initialize Gmail agent."""
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
        self.groq_api_key = groq_api_key
        self.rag_service = get_rag_service(groq_api_key)
        self.service = None
        
        logger.info("Gmail Agent initialized")
    
    def get_auth_url(self, state: str = None) -> str:
        """Get OAuth authorization URL."""
        try:
            flow = Flow.from_client_config(
                {
                    "web": {
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "redirect_uris": [self.redirect_uri]
                    }
                },
                scopes=self.SCOPES,
                redirect_uri=self.redirect_uri,
                state=state
            )
            
            auth_url, _ = flow.authorization_url(
                prompt='consent',
                access_type='offline',
                include_granted_scopes='true'
            )
            
            return auth_url
            
        except Exception as e:
            logger.error(f"Error generating auth URL: {e}")
            raise
    
    def exchange_code(self, code: str, state: str = None) -> Dict[str, Any]:
        """Exchange authorization code for tokens."""
        try:
            flow = Flow.from_client_config(
                {
                    "web": {
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "redirect_uris": [self.redirect_uri]
                    }
                },
                scopes=self.SCOPES,
                redirect_uri=self.redirect_uri,
                state=state
            )
            
            flow.fetch_token(code=code)
            credentials = flow.credentials
            
            return {
                "success": True,
                "token": credentials.token,
                "refresh_token": credentials.refresh_token,
                "token_uri": credentials.token_uri,
                "client_id": credentials.client_id,
                "client_secret": credentials.client_secret,
                "scopes": credentials.scopes
            }
            
        except Exception as e:
            logger.error(f"Error exchanging code: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def set_credentials(self, credentials_dict: Dict[str, Any]):
        """Set credentials from stored tokens."""
        try:
            credentials = Credentials(
                token=credentials_dict.get("token"),
                refresh_token=credentials_dict.get("refresh_token"),
                token_uri=credentials_dict.get("token_uri"),
                client_id=credentials_dict.get("client_id"),
                client_secret=credentials_dict.get("client_secret"),
                scopes=credentials_dict.get("scopes")
            )
            
            # Refresh if expired
            if credentials.expired and credentials.refresh_token:
                credentials.refresh(Request())
            
            self.service = build('gmail', 'v1', credentials=credentials)
            logger.info("Gmail credentials set successfully")
            
        except Exception as e:
            logger.error(f"Error setting credentials: {e}")
            raise
    
    def send_email(
        self, 
        to: str, 
        subject: str, 
        body: str,
        cc: List[str] = None,
        bcc: List[str] = None
    ) -> Dict[str, Any]:
        """Send an email via Gmail API."""
        try:
            if not self.service:
                raise ValueError("Gmail credentials not set")
            
            # Create message
            message = MIMEText(body, 'html' if '<' in body else 'plain')
            message['to'] = to
            message['subject'] = subject
            
            if cc:
                message['cc'] = ', '.join(cc)
            if bcc:
                message['bcc'] = ', '.join(bcc)
            
            # Encode and send
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
            
            sent_message = self.service.users().messages().send(
                userId='me',
                body={'raw': raw_message}
            ).execute()
            
            logger.info(f"Email sent: {sent_message['id']}")
            
            return {
                "success": True,
                "message_id": sent_message['id'],
                "thread_id": sent_message.get('threadId')
            }
            
        except Exception as e:
            logger.error(f"Error sending email: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_emails(
        self, 
        query: str = None, 
        max_results: int = 10,
        label_ids: List[str] = None
    ) -> List[Dict[str, Any]]:
        """Get emails from Gmail."""
        try:
            if not self.service:
                raise ValueError("Gmail credentials not set")
            
            # Search for messages
            result = self.service.users().messages().list(
                userId='me',
                q=query,
                maxResults=max_results,
                labelIds=label_ids
            ).execute()
            
            messages = result.get('messages', [])
            
            # Get full message details
            emails = []
            for msg in messages:
                message = self.service.users().messages().get(
                    userId='me',
                    id=msg['id'],
                    format='full'
                ).execute()
                
                # Parse headers
                headers = message.get('payload', {}).get('headers', [])
                email_data = {
                    'id': message['id'],
                    'threadId': message.get('threadId'),
                    'labelIds': message.get('labelIds', []),
                    'snippet': message.get('snippet'),
                    'historyId': message.get('historyId'),
                    'internalDate': message.get('internalDate')
                }
                
                for header in headers:
                    name = header.get('name', '').lower()
                    if name == 'from':
                        email_data['from'] = header.get('value')
                    elif name == 'to':
                        email_data['to'] = header.get('value')
                    elif name == 'subject':
                        email_data['subject'] = header.get('value')
                    elif name == 'date':
                        email_data['date'] = header.get('value')
                
                # Get body
                parts = message.get('payload', {}).get('parts', [])
                if parts:
                    for part in parts:
                        if part.get('mimeType') == 'text/plain':
                            body_data = part.get('body', {}).get('data', '')
                            if body_data:
                                email_data['body'] = base64.urlsafe_b64decode(
                                    body_data
                                ).decode('utf-8')
                                break
                
                emails.append(email_data)
            
            return emails
            
        except Exception as e:
            logger.error(f"Error getting emails: {e}")
            return []
    
    async def handle_incoming_email(
        self,
        email_data: Dict[str, Any],
        agent_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle incoming email and generate response."""
        try:
            from_email = email_data.get('from')
            subject = email_data.get('subject', '')
            body = email_data.get('body', '')
            message_id = email_data.get('id')
            
            logger.info(f"Processing email from {from_email}: {subject}")
            
            # Get agent settings
            collection_name = agent_config.get("collection_name")
            system_prompt = agent_config.get(
                "system_prompt",
                "You are a helpful email assistant. Respond professionally and concisely."
            )
            auto_reply = agent_config.get("auto_reply", True)
            
            # Get or create conversation
            db = SessionLocal()
            try:
                conversation = db.query(Conversation).filter(
                    Conversation.agent_id == agent_config["agent_id"],
                    Conversation.external_id == from_email,
                    Conversation.platform == "gmail"
                ).first()
                
                if not conversation:
                    conversation = Conversation(
                        agent_id=agent_config["agent_id"],
                        external_id=from_email,
                        platform="gmail",
                        title=f"Email: {from_email}",
                        extra_data={"email": from_email}
                    )
                    db.add(conversation)
                    db.commit()
                    db.refresh(conversation)
                
                # Save user message (incoming email)
                user_message = Message(
                    conversation_id=conversation.id,
                    role="user",
                    content=f"Subject: {subject}\\n\\n{body}",
                    message_type="email",
                    extra_data={
                        "message_id": message_id,
                        "subject": subject,
                        "from": from_email
                    }
                )
                db.add(user_message)
                
                # Get chat history
                chat_history = []
                for msg in conversation.messages[-5:]:
                    chat_history.append({
                        "role": msg.role,
                        "content": msg.content
                    })
                
                # Generate response using RAG
                query = f"Subject: {subject}\\nBody: {body[:500]}"
                
                if collection_name:
                    result = self.rag_service.query(
                        collection_name=collection_name,
                        query=query,
                        system_prompt=system_prompt,
                        chat_history=chat_history
                    )
                    response_text = result["response"]
                else:
                    response_text = (
                        "Thank you for your email. I'm currently setting up my knowledge base "
                        "and will respond more comprehensively soon."
                    )
                
                # Save assistant message
                assistant_message = Message(
                    conversation_id=conversation.id,
                    role="assistant",
                    content=response_text,
                    message_type="email",
                    rag_context={"sources": result.get("sources", [])} if collection_name else None
                )
                db.add(assistant_message)
                db.commit()
                
                # Send auto-reply if enabled
                if auto_reply:
                    reply_subject = f"Re: {subject}" if not subject.startswith("Re:") else subject
                    self.send_email(from_email, reply_subject, response_text)
                
                return {
                    "success": True,
                    "response": response_text,
                    "auto_sent": auto_reply
                }
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error handling incoming email: {e}")
            return {"success": False, "error": str(e)}
    
    def get_integration_snippet(self, agent_id: int, webhook_url: str) -> Dict[str, Any]:
        """Get integration code snippet for Gmail."""
        return {
            "type": "gmail",
            "setup_steps": [
                "1. Create a Google Cloud project at https://console.cloud.google.com/",
                "2. Enable Gmail API in your project",
                "3. Create OAuth 2.0 credentials (Web application)",
                "4. Add authorized redirect URI:",
                f"   {self.redirect_uri}",
                "5. Download client credentials and add to .env file",
                "6. Complete OAuth flow to authorize email access",
                "7. Configure auto-reply settings in agent config"
            ],
            "code_snippet": f'''# Gmail Integration for Agent {agent_id}
# Using Gmail API

from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from email.mime.text import MIMEText
import base64

# Load credentials
credentials = Credentials(
    token="your_access_token",
    refresh_token="your_refresh_token",
    token_uri="https://oauth2.googleapis.com/token",
    client_id="your_client_id",
    client_secret="your_client_secret"
)

# Build service
service = build('gmail', 'v1', credentials=credentials)

# Send email
def send_email(to, subject, body):
    message = MIMEText(body)
    message['to'] = to
    message['subject'] = subject
    
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
    
    sent = service.users().messages().send(
        userId='me',
        body={{'raw': raw}}
    ).execute()
    
    return sent

# Get emails
def get_emails(query="is:unread", max_results=10):
    results = service.users().messages().list(
        userId='me',
        q=query,
        maxResults=max_results
    ).execute()
    
    messages = results.get('messages', [])
    return messages

# Example usage
result = send_email(
    "recipient@example.com",
    "Hello from AI Agent",
    "This is an automated response."
)
print(f"Sent: {{result['id']}}")
''',
            "webhook_url": webhook_url,
            "api_endpoint": f"/api/agents/{agent_id}/webhook/gmail",
            "requirements": [
                "Google Cloud Project",
                "Gmail API enabled",
                "OAuth 2.0 credentials",
                "Authorized domain for OAuth"
            ],
            "oauth_flow": {
                "auth_url": self.get_auth_url(),
                "redirect_uri": self.redirect_uri
            }
        }


def create_gmail_agent(
    client_id: str = None,
    client_secret: str = None,
    redirect_uri: str = None,
    groq_api_key: str = None
) -> GmailAgent:
    """Factory function to create Gmail agent."""
    client_id = client_id or os.getenv("GMAIL_CLIENT_ID")
    client_secret = client_secret or os.getenv("GMAIL_CLIENT_SECRET")
    redirect_uri = redirect_uri or os.getenv("GMAIL_REDIRECT_URI", "http://localhost:8000/auth/gmail/callback")
    groq_api_key = groq_api_key or os.getenv("GROQ_API_KEY")
    
    if not all([client_id, client_secret]):
        raise ValueError("Gmail credentials not configured")
    
    return GmailAgent(client_id, client_secret, redirect_uri, groq_api_key)
