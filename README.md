# 🤖 AI Agent Platform

A comprehensive multi-agent AI platform that allows users to create, train, and deploy AI agents across multiple channels including WhatsApp, Telegram, Instagram, Gmail, and website chatbots.

![AI Agent Platform](https://img.shields.io/badge/AI%20Agent-Platform-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-009688)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB)
![Python](https://img.shields.io/badge/Python-3.9+-3776AB)

## ✨ Features

### 🤖 Multiple AI Agents
- **WhatsApp Agent** - Connect with customers via WhatsApp using Twilio
- **Telegram Agent** - Build intelligent Telegram bots
- **Instagram Agent** - Automate Instagram DMs and comments
- **Gmail Agent** - Smart email assistant with auto-reply
- **Chatbot Agent** - Embeddable widget for websites

### 📚 RAG (Retrieval Augmented Generation)
- Upload documents (PDF, images, text, URLs)
- Automatic text extraction and processing
- Vector embeddings using ChromaDB
- Context-aware responses using LangChain + Groq

### 🔧 Integration Options
- **Widget Embed** - Copy-paste code for websites
- **Direct API** - REST API for custom integrations
- **Webhook** - Real-time message handling
- **SDK** - Ready-to-use code snippets

### 👥 Multi-User Support
- User authentication with JWT
- Separate agent management per user
- Conversation history tracking
- Dashboard with analytics

## 🚀 Quick Start
Terminal A (Backend)
c:\huzaifa\ai-agent-platform\venv\Scripts\Activate.ps1
cd backend
..\venv\Scripts\python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

Terminal B (Frontend)
cd C:\huzaifa\ai-agent-platform\frontend
npm start
### Prerequisites
- Python 3.9+
- Node.js 16+
- SQLite (included)

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd ai-agent-platform

# Setup Backend
cd backend
python -m venv venv

# Windows
venv\\Scripts\\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure Environment Variables

```bash
# Copy the template
cp ../.env.template .env

# Edit .env with your credentials
# See "Getting API Credentials" section below
```

### 3. Run the Application

```bash
# Terminal 1: Start Backend
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Start Frontend
cd frontend
npm install
npm start
```

### 4. Access the Platform

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 📋 Getting API Credentials

### 🔑 Groq API (Required - Free Tier)
1. Visit [https://console.groq.com/keys](https://console.groq.com/keys)
2. Create a free account
3. Generate an API key
4. Add to `.env`: `GROQ_API_KEY=your_key_here`

### 📱 Twilio (For WhatsApp)
1. Sign up at [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Get a WhatsApp-enabled phone number
3. Find your Account SID and Auth Token in the console
4. Add to `.env`:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=your_whatsapp_number
   ```

### ✈️ Telegram Bot (For Telegram)
1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Start a chat and send `/newbot`
3. Follow instructions to create your bot
4. Copy the bot token
5. Add to `.env`: `TELEGRAM_BOT_TOKEN=your_bot_token`

### 📸 Meta/Instagram (For Instagram)
1. Create a developer account at [https://developers.facebook.com/](https://developers.facebook.com/)
2. Create a new app and add Instagram product
3. Get App ID, App Secret, and Access Token
4. Add Instagram Business Account ID
5. Add to `.env`:
   ```
   META_APP_ID=your_app_id
   META_APP_SECRET=your_app_secret
   META_ACCESS_TOKEN=your_access_token
   INSTAGRAM_BUSINESS_ACCOUNT_ID=your_account_id
   ```

### 📧 Gmail API (For Gmail)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Gmail API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URI: `http://localhost:8000/auth/gmail/callback`
6. Download credentials and add to `.env`:
   ```
   GMAIL_CLIENT_ID=your_client_id
   GMAIL_CLIENT_SECRET=your_client_secret
   ```

## 📁 Project Structure

```
ai-agent-platform/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI application
│   │   ├── config.py         # Configuration settings
│   │   └── auth.py           # Authentication utilities
│   ├── agents/
│   │   ├── whatsapp_agent.py
│   │   ├── telegram_agent.py
│   │   ├── instagram_agent.py
│   │   ├── gmail_agent.py
│   │   └── chatbot_agent.py
│   ├── services/
│   │   ├── rag_service.py    # RAG with LangChain
│   │   └── document_processor.py
│   ├── models/
│   │   ├── database.py       # SQLAlchemy models
│   │   └── schemas.py        # Pydantic schemas
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── context/
│   └── package.json
├── .env.template
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Agents
- `GET /api/agents` - List all agents
- `POST /api/agents` - Create new agent
- `GET /api/agents/{id}` - Get agent details
- `PUT /api/agents/{id}` - Update agent
- `DELETE /api/agents/{id}` - Delete agent

### Documents
- `GET /api/agents/{id}/documents` - List documents
- `POST /api/agents/{id}/documents/upload` - Upload document
- `DELETE /api/documents/{id}` - Delete document

### Training
- `POST /api/agents/{id}/train` - Train agent
- `GET /api/agents/{id}/training-status` - Get training status

### Chat
- `POST /api/chat` - Send message to agent

### Integration
- `GET /api/agents/{id}/integration/{type}` - Get integration code
- `GET /api/agents/{id}/widget.js` - Get widget JavaScript

### Webhooks
- `POST /api/agents/{id}/webhook/whatsapp` - WhatsApp webhook
- `POST /api/agents/{id}/webhook/telegram` - Telegram webhook
- `GET/POST /api/agents/{id}/webhook/instagram` - Instagram webhook

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### API Testing with curl
```bash
# Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test&password=password123"

# Create Agent
curl -X POST http://localhost:8000/api/agents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Agent","agent_type":"chatbot","description":"Test description"}'
```

## 🚀 Deployment

### Using Docker (Coming Soon)
```bash
docker-compose up -d
```

### Manual Deployment
1. Set up a production database (PostgreSQL recommended)
2. Update `DATABASE_URL` in `.env`
3. Set `DEBUG=false`
4. Use a production WSGI server (Gunicorn)
5. Set up Nginx as reverse proxy
6. Use PM2 or systemd for process management

## 📝 Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Database connection string | Yes |
| `GROQ_API_KEY` | Groq LLM API key | Yes |
| `SECRET_KEY` | JWT secret key | Yes |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | For WhatsApp |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | For WhatsApp |
| `TWILIO_PHONE_NUMBER` | Twilio WhatsApp number | For WhatsApp |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | For Telegram |
| `META_ACCESS_TOKEN` | Meta/Instagram access token | For Instagram |
| `GMAIL_CLIENT_ID` | Gmail OAuth client ID | For Gmail |
| `GMAIL_CLIENT_SECRET` | Gmail OAuth client secret | For Gmail |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [LangChain](https://langchain.com/) - RAG framework
- [Groq](https://groq.com/) - Fast LLM inference
- [FastAPI](https://fastapi.tiangolo.com/) - Web framework
- [ChromaDB](https://www.trychroma.com/) - Vector database

## 📞 Support

For support, email huzaifachaduhary@gmail.com.

---

Made with ❤️ by the AI Agent Platform Team
#   A i - a g e n t - p l a t f o r m 
 
 
