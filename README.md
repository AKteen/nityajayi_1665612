# Sunhacks

Full-stack agentic AI application.

| Layer | Tech |
|-------|------|
| Frontend | Next.js |
| Backend | FastAPI + LangGraph |
| Database | Supabase |

## Project Structure

```
sunhacks/
├── frontend/   → Next.js app
└── bakend/     → FastAPI + LangGraph + Supabase
```

## Quick Start

### 1. Backend
```bash
cd bakend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # fill in your Supabase credentials
uvicorn app.main:app --reload
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Copy `bakend/.env.example` to `bakend/.env` and fill in:

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```
