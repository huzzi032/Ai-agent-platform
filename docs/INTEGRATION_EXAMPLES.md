# Integration Examples

Real-world examples for integrating AI agents into your applications.

## Table of Contents
- [Website Chatbot Widget](#website-chatbot-widget)
- [WhatsApp Integration](#whatsapp-integration)
- [Telegram Bot](#telegram-bot)
- [Instagram Automation](#instagram-automation)
- [Gmail Auto-Reply](#gmail-auto-reply)
- [REST API Integration](#rest-api-integration)

---

## Website Chatbot Widget

### Basic HTML Integration

Add this code before the closing `</body>` tag:

```html
<!-- AI Chatbot Widget -->
<div id="ai-chatbot-widget"></div>
<script src="http://localhost:8000/api/agents/1/widget.js"></script>
```

### React Integration

```jsx
// ChatbotWidget.jsx
import React, { useEffect } from 'react';

const ChatbotWidget = ({ agentId, apiUrl }) => {
  useEffect(() => {
    // Load widget script
    const script = document.createElement('script');
    script.src = `${apiUrl}/api/agents/${agentId}/widget.js`;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [agentId, apiUrl]);

  return <div id="ai-chatbot-widget" />;
};

export default ChatbotWidget;

// App.jsx
import ChatbotWidget from './ChatbotWidget';

function App() {
  return (
    <div>
      {/* Your app content */}
      <ChatbotWidget 
        agentId={1} 
        apiUrl="http://localhost:8000" 
      />
    </div>
  );
}
```

### Vue.js Integration

```vue
<!-- ChatbotWidget.vue -->
<template>
  <div id="ai-chatbot-widget"></div>
</template>

<script>
export default {
  props: ['agentId', 'apiUrl'],
  mounted() {
    const script = document.createElement('script');
    script.src = `${this.apiUrl}/api/agents/${this.agentId}/widget.js`;
    script.async = true;
    document.body.appendChild(script);
  },
  beforeUnmount() {
    const script = document.querySelector(
      `script[src*="/api/agents/${this.agentId}/widget.js"]`
    );
    if (script) {
      document.body.removeChild(script);
    }
  },
};
</script>
```

### WordPress Integration

Add to your theme's `functions.php`:

```php
function add_ai_chatbot() {
    $agent_id = 1; // Your agent ID
    $api_url = 'http://localhost:8000';
    
    wp_enqueue_script(
        'ai-chatbot-widget',
        $api_url . '/api/agents/' . $agent_id . '/widget.js',
        array(),
        '1.0.0',
        true
    );
}
add_action('wp_footer', 'add_ai_chatbot');
```

---

## WhatsApp Integration

### Using Twilio

```python
# whatsapp_bot.py
from twilio.rest import Client
import requests

# Configuration
TWILIO_ACCOUNT_SID = 'your_account_sid'
TWILIO_AUTH_TOKEN = 'your_auth_token'
TWILIO_PHONE_NUMBER = 'whatsapp:+14155238886'
API_URL = 'http://localhost:8000/api'
AGENT_ID = 1

def send_whatsapp_message(to_number, message):
    """Send WhatsApp message via Twilio"""
    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    
    message = client.messages.create(
        from_=TWILIO_PHONE_NUMBER,
        body=message,
        to=f'whatsapp:{to_number}'
    )
    
    return message.sid

def handle_incoming_message(from_number, body):
    """Handle incoming WhatsApp message"""
    # Forward to AI Agent Platform
    response = requests.post(
        f'{API_URL}/agents/{AGENT_ID}/webhook/whatsapp',
        data={
            'From': f'whatsapp:{from_number}',
            'Body': body
        }
    )
    
    return response.text

# Flask webhook handler
from flask import Flask, request

app = Flask(__name__)

@app.route('/webhook/whatsapp', methods=['POST'])
def webhook():
    from_number = request.form.get('From', '').replace('whatsapp:', '')
    body = request.form.get('Body', '')
    
    # Process with your agent
    response = handle_incoming_message(from_number, body)
    
    return response

if __name__ == '__main__':
    app.run(port=5000)
```

### Webhook Setup

1. Expose your local server:
```bash
# Using ngrok
ngrok http 5000
```

2. Configure webhook in Twilio:
   - Go to Twilio Console → Messaging → Settings → WhatsApp Sandbox Settings
   - Set "When a message comes in" webhook URL
   - URL: `https://your-ngrok-url/webhook/whatsapp`

---

## Telegram Bot

### Python Implementation

```python
# telegram_bot.py
import asyncio
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
import requests

# Configuration
BOT_TOKEN = 'your_bot_token'
API_URL = 'http://localhost:8000/api'
AGENT_ID = 1

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""
    await update.message.reply_text(
        'Hello! I\'m your AI assistant. How can I help you today?'
    )

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle incoming messages"""
    user_message = update.message.text
    chat_id = update.effective_chat.id
    
    # Send to AI Agent Platform
    response = requests.post(
        f'{API_URL}/agents/{AGENT_ID}/webhook/telegram',
        json={
            'update_id': update.update_id,
            'message': {
                'message_id': update.message.message_id,
                'from': {'id': update.message.from_user.id},
                'chat': {'id': chat_id},
                'text': user_message
            }
        }
    )
    
    # Get AI response
    result = response.json()
    
    if result.get('success'):
        # Get conversation and send response
        # This is simplified - you'd typically get the response from your agent
        await update.message.reply_text('Processing your message...')
    else:
        await update.message.reply_text('Sorry, I encountered an error.')

def main():
    # Create application
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Add handlers
    application.add_handler(CommandHandler('start', start))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    # Run bot
    application.run_polling()

if __name__ == '__main__':
    main()
```

### Webhook Mode (Production)

```python
# webhook_server.py
from flask import Flask, request
import requests

app = Flask(__name__)
BOT_TOKEN = 'your_bot_token'
API_URL = 'http://localhost:8000/api'
AGENT_ID = 1
WEBHOOK_URL = 'https://your-domain.com/webhook/telegram'

@app.route('/webhook/telegram', methods=['POST'])
def telegram_webhook():
    data = request.json
    
    # Forward to AI Agent Platform
    response = requests.post(
        f'{API_URL}/agents/{AGENT_ID}/webhook/telegram',
        json=data
    )
    
    return response.json()

# Set webhook
def set_webhook():
    import telegram
    bot = telegram.Bot(token=BOT_TOKEN)
    bot.set_webhook(url=WEBHOOK_URL)

if __name__ == '__main__':
    set_webhook()
    app.run(port=5000)
```

---

## Instagram Automation

### Using Meta Graph API

```python
# instagram_bot.py
import requests

# Configuration
ACCESS_TOKEN = 'your_access_token'
BUSINESS_ACCOUNT_ID = 'your_account_id'
GRAPH_API_BASE = 'https://graph.facebook.com/v18.0'
API_URL = 'http://localhost:8000/api'
AGENT_ID = 1

def send_dm(recipient_id, message):
    """Send direct message"""
    url = f'{GRAPH_API_BASE}/me/messages'
    
    payload = {
        'recipient': {'id': recipient_id},
        'message': {'text': message},
        'access_token': ACCESS_TOKEN
    }
    
    response = requests.post(url, json=payload)
    return response.json()

def reply_to_comment(comment_id, message):
    """Reply to a comment"""
    url = f'{GRAPH_API_BASE}/{comment_id}/replies'
    
    payload = {
        'message': message,
        'access_token': ACCESS_TOKEN
    }
    
    response = requests.post(url, json=payload)
    return response.json()

def get_conversations():
    """Get all conversations"""
    url = f'{GRAPH_API_BASE}/{BUSINESS_ACCOUNT_ID}/conversations'
    
    params = {
        'access_token': ACCESS_TOKEN,
        'fields': 'participants,messages{{message,from,created_time}}'
    }
    
    response = requests.get(url, params=params)
    return response.json()

# Webhook handler
from flask import Flask, request

app = Flask(__name__)

@app.route('/webhook/instagram', methods=['GET'])
def verify_webhook():
    """Verify webhook subscription"""
    mode = request.args.get('hub.mode')
    token = request.args.get('hub.verify_token')
    challenge = request.args.get('hub.challenge')
    
    VERIFY_TOKEN = 'your_verify_token'
    
    if mode == 'subscribe' and token == VERIFY_TOKEN:
        return challenge
    return 'Verification failed', 403

@app.route('/webhook/instagram', methods=['POST'])
def handle_webhook():
    """Handle incoming Instagram events"""
    data = request.json
    
    # Forward to AI Agent Platform
    response = requests.post(
        f'{API_URL}/agents/{AGENT_ID}/webhook/instagram',
        json=data
    )
    
    return response.json()

if __name__ == '__main__':
    app.run(port=5000)
```

---

## Gmail Auto-Reply

### Using Gmail API

```python
# gmail_agent.py
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from email.mime.text import MIMEText
import base64
import requests

# Configuration
API_URL = 'http://localhost:8000/api'
AGENT_ID = 1

def get_gmail_service(credentials_dict):
    """Get Gmail API service"""
    credentials = Credentials(
        token=credentials_dict['token'],
        refresh_token=credentials_dict['refresh_token'],
        token_uri=credentials_dict['token_uri'],
        client_id=credentials_dict['client_id'],
        client_secret=credentials_dict['client_secret']
    )
    
    return build('gmail', 'v1', credentials=credentials)

def send_email(service, to, subject, body):
    """Send email via Gmail API"""
    message = MIMEText(body)
    message['to'] = to
    message['subject'] = subject
    
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
    
    sent = service.users().messages().send(
        userId='me',
        body={'raw': raw}
    ).execute()
    
    return sent

def get_unread_emails(service, max_results=10):
    """Get unread emails"""
    results = service.users().messages().list(
        userId='me',
        q='is:unread',
        maxResults=max_results
    ).execute()
    
    messages = results.get('messages', [])
    
    emails = []
    for msg in messages:
        message = service.users().messages().get(
            userId='me',
            id=msg['id']
        ).execute()
        
        headers = message['payload']['headers']
        email_data = {
            'id': message['id'],
            'snippet': message['snippet']
        }
        
        for header in headers:
            if header['name'] == 'From':
                email_data['from'] = header['value']
            elif header['name'] == 'Subject':
                email_data['subject'] = header['value']
        
        emails.append(email_data)
    
    return emails

def process_email(service, email_data):
    """Process email with AI agent"""
    # Forward to AI Agent Platform
    response = requests.post(
        f'{API_URL}/agents/{AGENT_ID}/webhook/gmail',
        json={
            'message': {
                'data': {
                    'emailAddress': email_data['from'],
                    'historyId': email_data['id']
                }
            }
        }
    )
    
    result = response.json()
    
    if result.get('success') and result.get('auto_sent'):
        print(f"Auto-replied to {email_data['from']}")
    
    return result

# Main loop
def main():
    # Load credentials (you'd typically store these securely)
    credentials_dict = {
        'token': 'your_token',
        'refresh_token': 'your_refresh_token',
        'token_uri': 'https://oauth2.googleapis.com/token',
        'client_id': 'your_client_id',
        'client_secret': 'your_client_secret'
    }
    
    service = get_gmail_service(credentials_dict)
    
    # Process unread emails
    emails = get_unread_emails(service)
    
    for email in emails:
        process_email(service, email)

if __name__ == '__main__':
    main()
```

---

## REST API Integration

### JavaScript/Node.js Client

```javascript
// aiAgentClient.js
const axios = require('axios');

class AIAgentClient {
  constructor(baseUrl, token = null) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  async login(username, password) {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await this.client.post('/auth/login', formData);
    const token = response.data.access_token;
    
    this.client.defaults.headers.Authorization = `Bearer ${token}`;
    return token;
  }

  async createAgent(name, agentType, config = {}) {
    const response = await this.client.post('/agents', {
      name,
      agent_type: agentType,
      ...config,
    });
    return response.data;
  }

  async uploadDocument(agentId, filePath) {
    const FormData = require('form-data');
    const fs = require('fs');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    
    const response = await this.client.post(
      `/agents/${agentId}/documents/upload`,
      formData,
      {
        headers: formData.getHeaders(),
      }
    );
    return response.data;
  }

  async trainAgent(agentId) {
    const response = await this.client.post(`/agents/${agentId}/train`);
    return response.data;
  }

  async chat(agentId, message, sessionId = null) {
    const response = await this.client.post('/chat', {
      agent_id: agentId,
      message,
      session_id: sessionId,
    });
    return response.data;
  }
}

// Usage example
async function main() {
  const client = new AIAgentClient('http://localhost:8000/api');
  
  // Login
  await client.login('username', 'password');
  
  // Create agent
  const agent = await client.createAgent('My Bot', 'chatbot', {
    description: 'A helpful assistant',
    config: {
      system_prompt: 'You are a helpful assistant.',
    },
  });
  
  console.log('Agent created:', agent.id);
  
  // Upload document
  await client.uploadDocument(agent.id, './document.pdf');
  
  // Train agent
  await client.trainAgent(agent.id);
  
  // Chat
  const response = await client.chat(agent.id, 'Hello!');
  console.log('Response:', response.response);
}

main().catch(console.error);
```

### PHP Integration

```php
<?php
// ai_agent_client.php

class AIAgentClient {
    private $baseUrl;
    private $token;
    
    public function __construct($baseUrl, $token = null) {
        $this->baseUrl = $baseUrl;
        $this->token = $token;
    }
    
    private function request($method, $endpoint, $data = null) {
        $ch = curl_init();
        
        $url = $this->baseUrl . $endpoint;
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        
        $headers = ['Content-Type: application/json'];
        if ($this->token) {
            $headers[] = 'Authorization: Bearer ' . $this->token;
        }
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        return json_decode($response, true);
    }
    
    public function login($username, $password) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->baseUrl . '/auth/login');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'username' => $username,
            'password' => $password
        ]));
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        $data = json_decode($response, true);
        $this->token = $data['access_token'];
        return $data;
    }
    
    public function createAgent($name, $agentType, $config = []) {
        return $this->request('POST', '/agents', [
            'name' => $name,
            'agent_type' => $agentType,
            ...$config
        ]);
    }
    
    public function chat($agentId, $message) {
        return $this->request('POST', '/chat', [
            'agent_id' => $agentId,
            'message' => $message
        ]);
    }
}

// Usage
$client = new AIAgentClient('http://localhost:8000/api');
$client->login('username', 'password');
$agent = $client->createAgent('My Bot', 'chatbot');
$response = $client->chat($agent['id'], 'Hello!');
echo $response['response'];
?>
```

---

## Testing Your Integration

### Using curl

```bash
# Test chat endpoint
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "agent_id": 1,
    "message": "Hello!"
  }'
```

### Using Postman

1. Import the API collection
2. Set environment variables:
   - `base_url`: http://localhost:8000/api
   - `token`: Your JWT token
3. Test endpoints

### Webhook Testing with ngrok

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 8000

# Use the HTTPS URL for webhooks
# Example: https://abc123.ngrok.io/api/agents/1/webhook/whatsapp
```
