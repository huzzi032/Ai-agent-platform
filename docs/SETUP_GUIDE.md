# Setup Guide - AI Agent Platform

This guide will walk you through setting up the AI Agent Platform step by step.

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Running the Application](#running-the-application)
5. [Troubleshooting](#troubleshooting)

## System Requirements

### Minimum Requirements
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space
- **Python**: 3.9 or higher
- **Node.js**: 16.x or higher
- **npm**: 8.x or higher

### Verify Installations
```bash
# Check Python
python --version
# or
python3 --version

# Check Node.js
node --version

# Check npm
npm --version
```

## Installation

### Step 1: Download the Project

```bash
# If using git
git clone <repository-url>
cd ai-agent-platform

# Or extract the zip file
cd ai-agent-platform
```

### Step 2: Setup Backend

#### Windows
```cmd
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

#### macOS/Linux
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Step 3: Setup Frontend

```bash
cd frontend
npm install
```

## Configuration

### Step 1: Copy Environment Template

```bash
# From project root
cp .env.template backend/.env
```

### Step 2: Generate Secret Key

Generate a secure random key for JWT:

```bash
# Using OpenSSL (recommended)
openssl rand -hex 32

# Or use Python
python -c "import secrets; print(secrets.token_hex(32))"
```

Copy the generated key and add it to your `.env` file:
```
SECRET_KEY=your_generated_key_here
```

### Step 3: Get Groq API Key (REQUIRED)

1. Go to [https://console.groq.com/keys](https://console.groq.com/keys)
2. Sign up for a free account
3. Click "Create API Key"
4. Copy the key and add to `.env`:
   ```
   GROQ_API_KEY=gsk_your_api_key_here
   ```

### Step 4: Configure Platform-Specific APIs (Optional)

#### For WhatsApp Agent

1. **Create Meta Developer Account**
   - Go to [https://developers.facebook.com/](https://developers.facebook.com/)
   - Log in with your Facebook account

2. **Create a Business App**
   - Click "Create App"
   - Choose app type: **Business**

3. **Add WhatsApp Product**
   - In app dashboard, click "Add Product"
   - Select **WhatsApp**

4. **Get Credentials from API Setup**
   - Access Token (temporary for dev, permanent via System User for production)
   - Phone Number ID

5. **Configure Webhook**
   - Callback URL: `https://your-domain.com/api/agents/{agent_id}/webhook/whatsapp`
   - Verify Token: any secure custom string
   - Subscribe to field: `messages`

6. **Add to `.env`**:
   ```
   WHATSAPP_ACCESS_TOKEN=your_access_token_here
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
   WHATSAPP_VERIFY_TOKEN=your_custom_verify_token
   ```

#### For Telegram Agent

1. **Create Bot with BotFather**
   - Open Telegram and search for [@BotFather](https://t.me/BotFather)
   - Start chat and send `/newbot`
   - Follow prompts to name your bot
   - Save the bot token provided

2. **Add to `.env`**:
   ```
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxyz
   ```

#### For Instagram Agent

1. **Create Meta Developer Account**
   - Go to [https://developers.facebook.com/](https://developers.facebook.com/)
   - Sign up and create a developer account

2. **Create App**
   - Click "Create App"
   - Select "Business" type
   - Fill in app details

3. **Add Instagram Product**
   - In app dashboard, click "Add Product"
   - Find "Instagram" and click "Set Up"

4. **Get Credentials**
   - App ID: In Settings → Basic
   - App Secret: In Settings → Basic (click "Show")
   - Access Token: Generate in Instagram Basic Display

5. **Add to `.env`**:
   ```
   META_APP_ID=your_app_id
   META_APP_SECRET=your_app_secret
   META_ACCESS_TOKEN=your_access_token
   INSTAGRAM_BUSINESS_ACCOUNT_ID=your_account_id
   ```

#### For Gmail Agent

1. **Create Google Cloud Project**
   - Go to [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Create a new project

2. **Enable Gmail API**
   - Go to "APIs & Services" → "Library"
   - Search for "Gmail API" and enable it

3. **Create OAuth Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Select "Web application"
   - Add authorized redirect URI: `http://localhost:8000/auth/gmail/callback`
   - Click "Create"

4. **Download Credentials**
   - Click the download icon next to your OAuth client
   - Save the JSON file
   - Extract `client_id` and `client_secret`

5. **Add to `.env`**:
   ```
   GMAIL_CLIENT_ID=your_client_id.apps.googleusercontent.com
   GMAIL_CLIENT_SECRET=your_client_secret
   ```

### Step 5: Final Configuration Check

Your `.env` file should look like this:

```env
# Required
DATABASE_URL=sqlite:///./ai_agent_platform.db
GROQ_API_KEY=gsk_your_groq_api_key
SECRET_KEY=your_generated_secret_key

# Optional - Only if using specific agents
WHATSAPP_ACCESS_TOKEN=EAAGxxxxxxxxxx
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token

TELEGRAM_BOT_TOKEN=123456789:ABCdef...

META_APP_ID=123456789
META_APP_SECRET=xxxxxxxxxx
META_ACCESS_TOKEN=xxxxxxxxxx
INSTAGRAM_BUSINESS_ACCOUNT_ID=123456789

GMAIL_CLIENT_ID=xxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=xxxxxxxxxx
```

## Running the Application

### Method 1: Using Terminal (Recommended for Development)

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Method 2: Using Start Script

Create a `start.sh` script:

```bash
#!/bin/bash

# Start Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start Frontend
cd ../frontend
npm start &
FRONTEND_PID=$!

# Trap Ctrl+C to kill both processes
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT

wait
```

Make it executable and run:
```bash
chmod +x start.sh
./start.sh
```

### Access the Application

Once running, access the platform at:

- **Web Interface**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **API Base URL**: http://localhost:8000/api

## First Time Setup

### 1. Create an Account
1. Open http://localhost:3000
2. Click "Sign up"
3. Fill in your details
4. Submit the form

### 2. Create Your First Agent
1. Log in with your credentials
2. Click "Create Agent"
3. Select an agent type (e.g., Chatbot)
4. Configure the agent settings
5. Click "Create"

### 3. Upload Training Documents
1. Go to your agent's page
2. Click "Documents"
3. Upload PDFs, text files, or add URLs
4. Wait for processing to complete

### 4. Train the Agent
1. Go to the "Training" tab
2. Click "Start Training"
3. Wait for training to complete

### 5. Integrate
1. Go to the "Integration" tab
2. Copy the widget code or API endpoint
3. Add to your website or application

## Troubleshooting

### Backend Issues

#### "Module not found" errors
```bash
# Make sure virtual environment is activated
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate      # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

#### "Port already in use" error
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9  # Mac/Linux
netstat -ano | findstr :8000   # Windows
```

#### Database errors
```bash
# Delete and recreate database
rm ai_agent_platform.db  # Linux/Mac
del ai_agent_platform.db  # Windows

# Restart the backend
```

### Frontend Issues

#### "npm install" fails
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### "Module not found" errors
```bash
# Clear cache and restart
rm -rf node_modules/.cache
npm start
```

### API Connection Issues

If frontend can't connect to backend:

1. Check backend is running on port 8000
2. Verify `proxy` in `frontend/package.json` is set to `http://localhost:8000`
3. Check firewall settings
4. Try accessing API directly: http://localhost:8000/api/health

### Groq API Issues

#### "Invalid API key"
- Verify your Groq API key is correct
- Check it's added to `.env` file
- Restart the backend after changes

#### "Rate limit exceeded"
- Groq free tier has rate limits
- Wait a few minutes before retrying
- Consider upgrading if needed

## Next Steps

- Read the [API Documentation](API_DOCS.md)
- Check out [Integration Examples](INTEGRATION_EXAMPLES.md)
- Learn about [Advanced Configuration](ADVANCED_CONFIG.md)

## Support

If you encounter issues:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review the logs in terminal
3. Open an issue on GitHub
4. Contact support@aiagentplatform.com
