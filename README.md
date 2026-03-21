AI Agent Platform

A scalable, production-ready Multi-Agent AI Platform built with FastAPI (backend) and React (frontend), enabling users to create, train, and deploy AI agents across multiple channels.

Features
Core Modules
Multi-Channel AI Agents
WhatsApp Agent (Twilio integration)
Telegram Bot Agent
Instagram Automation (DMs & comments)
Gmail AI Assistant (auto-reply & smart inbox)
Website Chatbot (embeddable widget)
RAG (Retrieval Augmented Generation)
Upload PDFs, images, text, URLs
Automatic parsing & chunking
Vector storage using ChromaDB
Context-aware responses (LangChain + Groq)
Integration System
Widget embed (copy-paste JS)
REST API for custom apps
Webhook-based real-time processing
SDK-ready integration support
User & Agent Management
JWT authentication
Multi-user agent isolation
Conversation history tracking
Dashboard analytics
Tech Stack
Backend
Framework: FastAPI
Database: SQLite (Dev) / PostgreSQL (Prod)
ORM: SQLAlchemy
Authentication: JWT (python-jose)
AI: Groq API + LangChain
Vector DB: ChromaDB
Frontend
Framework: React + TypeScript
Build Tool: Vite / CRA
Styling: Tailwind CSS
State Management: React Query
UI: Custom components
Project Structure
ai-agent-platform/
├── backend/
│   ├── app/
│   │   ├── main.py          # Entry point
│   │   ├── config.py        # Settings
│   │   └── auth.py          # Auth logic
│   ├── agents/              # Channel agents
│   ├── services/            # RAG & processing
│   ├── models/              # DB models
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
Setup Instructions
Prerequisites
Python 3.9+
Node.js 16+
npm or yarn
Backend Setup
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
Run Backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

Backend:

http://localhost:8000

Docs:

http://localhost:8000/docs
Frontend Setup
cd frontend
npm install
npm start

Frontend:

http://localhost:3000
API Endpoints
Authentication
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
Agents
GET /api/agents
POST /api/agents
GET /api/agents/{id}
PUT /api/agents/{id}
DELETE /api/agents/{id}
Documents (RAG)
GET /api/agents/{id}/documents
POST /api/agents/{id}/documents/upload
DELETE /api/documents/{id}
Training
POST /api/agents/{id}/train
GET /api/agents/{id}/training-status
Chat
POST /api/chat
Integrations
GET /api/agents/{id}/integration/{type}
GET /api/agents/{id}/widget.js
Webhooks
POST /api/agents/{id}/webhook/whatsapp
POST /api/agents/{id}/webhook/telegram
GET/POST /api/agents/{id}/webhook/instagram
Environment Variables
Backend (.env)
DATABASE_URL=sqlite:///./app.db
SECRET_KEY=your-secret-key
GROQ_API_KEY=your-groq-key

# WhatsApp
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Telegram
TELEGRAM_BOT_TOKEN=

# Instagram
META_ACCESS_TOKEN=

# Gmail
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
API Credentials Setup
Groq (Required)
Create key from console
Add to .env
Twilio (WhatsApp)
Get SID + Token
Enable WhatsApp number
Telegram
Create bot via BotFather
Add token
Instagram (Meta)
Create app on Meta Developer
Add access token
Gmail API
Enable Gmail API
Setup OAuth credentials
Testing
Backend Tests
pytest
Sample API (curl)
# Login
curl -X POST http://localhost:8000/api/auth/login \
-H "Content-Type: application/x-www-form-urlencoded" \
-d "username=test&password=password123"
Deployment
Production Steps
Switch to PostgreSQL
Set DEBUG=false
Use Gunicorn
Add Nginx
Process manager (PM2/systemd)
License

MIT License

Contributing
Fork repo
Create branch
Commit changes
Open PR
Support

Email: huzaifachaduhary@gmail.com

Windows Run Commands
Backend
cd C:\huzaifa\ai-agent-platform\backend
..\venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
Frontend
cd C:\huzaifa\ai-agent-platform\frontend
npm start
