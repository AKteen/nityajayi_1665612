# Backend — FastAPI + LangGraph + Supabase

## Stack

- **FastAPI** — REST API
- **LangGraph** — agentic AI workflows
- **LangChain** — LLM tooling
- **Supabase** — database & auth

## Structure

```
bakend/
├── app/
│   ├── api/routes/       → API route handlers
│   ├── core/config.py    → app settings (pydantic-settings)
│   └── main.py           → FastAPI entry point
├── agents/
│   ├── graph.py          → LangGraph state graph
│   └── nodes.py          → agent state & nodes
├── db/
│   └── supabase_client.py
├── services/             → business logic
├── .env.example
└── requirements.txt
```

## Setup

### 1. Create virtual environment

```bash
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS/Linux
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

### 4. Run the server

```bash
uvicorn app.main:app --reload
```

API available at `http://localhost:8000`  
Docs at `http://localhost:8000/docs`

## Adding a New Route

1. Create `app/api/routes/your_route.py`
2. Define an `APIRouter` and add it to `app/api/routes/__init__.py`
