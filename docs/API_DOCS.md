# API Documentation

Complete API reference for the AI Agent Platform.

## Base URL
```
http://localhost:8000/api
```

## Authentication

Most endpoints require authentication via Bearer token.

### Get Token
```bash
POST /auth/login
Content-Type: application/x-www-form-urlencoded

username=your_username&password=your_password
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

### Use Token
```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## Endpoints

### Health Check
```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "services": {
    "database": true,
    "rag": true
  }
}
```

---

## Authentication

### Register
```bash
POST /auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123",
  "full_name": "John Doe"
}
```

Response:
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "full_name": "John Doe",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00"
}
```

### Login
```bash
POST /auth/login
Content-Type: application/x-www-form-urlencoded

username=johndoe&password=securepassword123
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

### Get Current User
```bash
GET /auth/me
Authorization: Bearer <token>
```

Response:
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "full_name": "John Doe",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00"
}
```

---

## Agents

### List Agents
```bash
GET /agents
Authorization: Bearer <token>
```

Response:
```json
[
  {
    "id": 1,
    "name": "Customer Support Bot",
    "agent_type": "chatbot",
    "description": "Handles customer inquiries",
    "status": "active",
    "is_trained": true,
    "training_status": "completed",
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00"
  }
]
```

### Create Agent
```bash
POST /agents
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Customer Support Bot",
  "agent_type": "chatbot",
  "description": "Handles customer inquiries",
  "config": {
    "system_prompt": "You are a helpful customer support assistant.",
    "welcome_message": "Hello! How can I help you today?",
    "widget_color": "#4F46E5",
    "temperature": 0.7
  }
}
```

Agent Types: `whatsapp`, `telegram`, `instagram`, `gmail`, `chatbot`

Response:
```json
{
  "id": 1,
  "user_id": 1,
  "name": "Customer Support Bot",
  "agent_type": "chatbot",
  "description": "Handles customer inquiries",
  "status": "inactive",
  "is_trained": false,
  "training_status": "pending",
  "collection_name": "agent_1_abc123",
  "webhook_url": "http://localhost:8000/api/agents/1/webhook/chatbot",
  "api_endpoint": "http://localhost:8000/api/agents/1/chat",
  "created_at": "2024-01-01T00:00:00"
}
```

### Get Agent
```bash
GET /agents/{id}
Authorization: Bearer <token>
```

### Update Agent
```bash
PUT /agents/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description",
  "status": "active"
}
```

### Delete Agent
```bash
DELETE /agents/{id}
Authorization: Bearer <token>
```

---

## Documents

### List Documents
```bash
GET /agents/{agent_id}/documents
Authorization: Bearer <token>
```

### Upload Document (File)
```bash
POST /agents/{agent_id}/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <file>
```

### Upload Document (URL)
```bash
POST /agents/{agent_id}/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

url: https://example.com/page
```

### Upload Document (Text)
```bash
POST /agents/{agent_id}/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

text: Your text content here
```

### Delete Document
```bash
DELETE /documents/{document_id}
Authorization: Bearer <token>
```

---

## Training

### Train Agent
```bash
POST /agents/{agent_id}/train
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "message": "Agent trained successfully",
  "agent_id": 1,
  "documents_processed": 5,
  "chunks_created": 42
}
```

### Get Training Status
```bash
GET /agents/{agent_id}/training-status
Authorization: Bearer <token>
```

Response:
```json
{
  "agent_id": 1,
  "status": "completed",
  "message": "Training is completed"
}
```

---

## Chat

### Send Message
```bash
POST /chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Hello, how are you?",
  "agent_id": 1,
  "session_id": "session_123",
  "conversation_id": 1
}
```

Response:
```json
{
  "response": "Hello! I'm doing well, thank you for asking. How can I help you today?",
  "conversation_id": 1,
  "message_id": 5,
  "sources": [
    {
      "content": "...",
      "metadata": {"document_id": 1}
    }
  ]
}
```

---

## Integration

### Get Integration Code
```bash
GET /agents/{agent_id}/integration/snippet
Authorization: Bearer <token>
```

Response (WhatsApp example):
```json
{
  "type": "whatsapp",
  "setup_steps": [
    "1. Create a Meta Developer account...",
    "2. Add WhatsApp product and copy credentials..."
  ],
  "code_snippet": "# Python code...",
  "webhook_url": "http://localhost:8000/api/agents/1/webhook/whatsapp",
  "api_endpoint": "/api/agents/1/webhook/whatsapp",
  "requirements": [
    "Meta Business App",
    "WhatsApp Access Token",
    "WhatsApp Phone Number ID",
    "Verify Token"
  ]
}
```

### Get Widget JavaScript (Chatbot only)
```bash
GET /agents/{agent_id}/widget.js
```

Returns JavaScript code for embedding the chatbot widget.

---

## Webhooks

### WhatsApp Webhook Verification (Meta)
```bash
GET /agents/{agent_id}/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=xxx&hub.challenge=xxx
```

Returns the `hub.challenge` value on successful verification.

### WhatsApp Webhook Events (Meta)
```bash
POST /agents/{agent_id}/webhook/whatsapp
Content-Type: application/json

{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "changes": [
        {
          "field": "messages",
          "value": {
            "contacts": [
              {
                "profile": {"name": "John"},
                "wa_id": "923001234567"
              }
            ],
            "messages": [
              {
                "from": "923001234567",
                "id": "wamid.XXX",
                "type": "text",
                "text": {"body": "Hello"}
              }
            ]
          }
        }
      ]
    }
  ]
}
```

Returns JSON status.

### Telegram Webhook
```bash
POST /agents/{agent_id}/webhook/telegram
Content-Type: application/json

{
  "update_id": 123456789,
  "message": {
    "message_id": 1,
    "from": {"id": 123456, "username": "user"},
    "chat": {"id": 123456},
    "text": "Hello"
  }
}
```

### Instagram Webhook Verification
```bash
GET /agents/{agent_id}/webhook/instagram?hub.mode=subscribe&hub.verify_token=xxx&hub.challenge=xxx
```

### Instagram Webhook Events
```bash
POST /agents/{agent_id}/webhook/instagram
Content-Type: application/json

{
  "object": "instagram",
  "entry": [{
    "id": "123456",
    "time": 1234567890,
    "messaging": [{
      "sender": {"id": "123"},
      "recipient": {"id": "456"},
      "message": {"text": "Hello"}
    }]
  }]
}
```

---

## Dashboard

### Get Dashboard Data
```bash
GET /dashboard
Authorization: Bearer <token>
```

Response:
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com"
  },
  "agents": [...],
  "stats": {
    "total_agents": 5,
    "active_agents": 3,
    "total_conversations": 42,
    "total_messages": 156,
    "agents_by_type": {
      "chatbot": 2,
      "whatsapp": 1,
      "telegram": 1,
      "gmail": 1
    }
  },
  "recent_conversations": [...]
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid request data"
}
```

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 403 Forbidden
```json
{
  "detail": "Not enough permissions"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## Rate Limits

- Authentication: 10 requests per minute
- API endpoints: 100 requests per minute
- Chat endpoints: 60 requests per minute

---

## SDK Examples

### Python
```python
import requests

class AIAgentClient:
    def __init__(self, base_url, token=None):
        self.base_url = base_url
        self.headers = {}
        if token:
            self.headers['Authorization'] = f'Bearer {token}'
    
    def login(self, username, password):
        response = requests.post(
            f'{self.base_url}/auth/login',
            data={'username': username, 'password': password}
        )
        self.token = response.json()['access_token']
        self.headers['Authorization'] = f'Bearer {self.token}'
        return self.token
    
    def create_agent(self, name, agent_type, **kwargs):
        data = {'name': name, 'agent_type': agent_type, **kwargs}
        response = requests.post(
            f'{self.base_url}/agents',
            headers=self.headers,
            json=data
        )
        return response.json()
    
    def chat(self, agent_id, message):
        response = requests.post(
            f'{self.base_url}/chat',
            headers=self.headers,
            json={'agent_id': agent_id, 'message': message}
        )
        return response.json()

# Usage
client = AIAgentClient('http://localhost:8000/api')
client.login('username', 'password')
agent = client.create_agent('My Bot', 'chatbot')
response = client.chat(agent['id'], 'Hello!')
print(response['response'])
```

### JavaScript
```javascript
class AIAgentClient {
  constructor(baseUrl, token = null) {
    this.baseUrl = baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      this.headers['Authorization'] = `Bearer ${token}`;
    }
  }

  async login(username, password) {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    this.token = data.access_token;
    this.headers['Authorization'] = `Bearer ${this.token}`;
    return this.token;
  }

  async createAgent(name, agentType, config = {}) {
    const response = await fetch(`${this.baseUrl}/agents`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        name,
        agent_type: agentType,
        ...config,
      }),
    });
    return response.json();
  }

  async chat(agentId, message) {
    const response = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        agent_id: agentId,
        message,
      }),
    });
    return response.json();
  }
}

// Usage
const client = new AIAgentClient('http://localhost:8000/api');
await client.login('username', 'password');
const agent = await client.createAgent('My Bot', 'chatbot');
const response = await client.chat(agent.id, 'Hello!');
console.log(response.response);
```
