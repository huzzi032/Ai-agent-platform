# Vercel Backend Deployment (FastAPI)

This project is configured to deploy the backend from the backend folder.

## 1) Local backend run command

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## 2) Build command (Vercel local build)

```bash
vercel build --cwd backend
```

## 3) Deploy command

Preview deploy:

```bash
vercel --cwd backend
```

Production deploy:

```bash
vercel --prod --cwd backend
```

## 4) Required environment variables in Vercel

Set these from the CLI (repeat for preview/production when prompted):

```bash
vercel env add ENVIRONMENT production
vercel env add DATABASE_URL
vercel env add SECRET_KEY
vercel env add GROQ_API_KEY
vercel env add API_URL
vercel env add APP_URL
vercel env add CORS_ALLOWED_ORIGINS
vercel env add CHROMA_PERSIST_DIRECTORY
```

Recommended values:

- ENVIRONMENT: production
- DATABASE_URL: your managed PostgreSQL URL
- SECRET_KEY: long random string
- API_URL: your Vercel backend URL (for example: https://your-backend.vercel.app)
- APP_URL: your frontend URL
- CORS_ALLOWED_ORIGINS: comma-separated origins, or * if you need open public widget access
- CHROMA_PERSIST_DIRECTORY: /tmp/chroma_db

## 5) Pull Vercel env to local (optional)

```bash
vercel env pull backend/.env
```

## 6) Verify API after deploy

```bash
curl https://your-backend.vercel.app/api/health
```
