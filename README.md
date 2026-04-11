<img width="50" height="50" alt="logoread" src="https://github.com/user-attachments/assets/75a53991-e249-49a9-9fee-10d1b2901965" /><img width="100" height="100" alt="textlogo" src="https://github.com/user-attachments/assets/5976bade-b317-4f26-bee8-1df49e8dbf00" />


# 🧠 Recall.AI: Organizational Memory & Reasoning Engine


![flow-diagram](https://github.com/user-attachments/assets/2cded349-b7ec-4b6a-b68f-473c9cf6e94a)

**Ask your company's knowledge base anything. Understand decisions, track who made them, and predict what breaks if things change.**

Built at **Sunhacks 2026** — An AI-powered system that turns your documents and Slack conversations into a searchable knowledge graph.

An AI-powered knowledge base that ingests PDFs, Excel files, images, audio/video, and Slack conversations, automatically extracts decisions and reasoning, stores them in a knowledge graph, and lets you query everything in plain English. Ask questions like "Why did we switch to Postgres?" or "What breaks if we remove this feature?" and get intelligent answers with sources. Built with Next.js, FastAPI, Neo4j, ChromaDB, and Llama 3.3 70B via Groq. Features include multi-format upload, smart search with two specialized agents (Query for history, Impact for what-if analysis), visual knowledge graph, and automatic duplicate detection.



---

## 🎯 What Does It Do?

This system helps you:

1. **Upload Knowledge** — Drop in PDFs, Excel files, images, audio/video, or connect Slack channels
2. **Extract Decisions** — AI automatically finds decisions, reasons, people involved, and alternatives
3. **Ask Questions** — Query in plain English: "Why did we switch to Postgres?" or "What breaks if we remove this feature?"
4. **Get Smart Answers** — Powered by Llama 3.3 70B, with sources and reasoning included

---

## 🏗️ How It Works

```
┌─────────────────────────────────────────┐
│         Next.js Web Interface           │
│   Upload Files · Ask Questions · View   │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│          FastAPI Backend                │
│                                         │
│  Router Agent → Query or Impact Agent   │
│  Ingestion Agent → Extract Decisions    │
└──────────┬──────────────┬───────────────┘
           │              │
    ┌──────▼──────┐  ┌───▼────────┐
    │   Neo4j     │  │  ChromaDB  │
    │ (Graph DB)  │  │ (Vectors)  │
    └─────────────┘  └────────────┘
```

**Two Types of Queries:**

- **QUERY Agent** — Answers "What happened?", "Who decided?", "When was this?"
- **IMPACT Agent** — Answers "What if we change X?", "What breaks?", "What's the risk?"

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** — React framework
- **Tailwind CSS** — Styling
- **Framer Motion** — Animations
- **Lucide React** — Icons

### Backend
- **FastAPI** — Python web framework
- **LangGraph + LangChain** — AI agent orchestration
- **Groq** — LLM API (Llama 3.3 70B)

### Databases
- **Neo4j AuraDB** — Stores decisions as a knowledge graph
- **ChromaDB** — Stores document embeddings for semantic search
- **Supabase** — Stores activities

### Integrations
- **Slack SDK** — Pull channel history
- **PyMuPDF** — Parse PDFs
- **OpenPyXL** — Parse Excel files
- **Groq Vision** — OCR for images
- **Groq Whisper** — Transcribe audio/video

---

## 📁 Project Structure

```
sunhacks/
│
├── backend/                    # Python FastAPI server
│   ├── agents/                 # AI agents
│   │   ├── router.py           # Routes to Query or Impact agent
│   │   ├── query_agent.py      # Answers history questions
│   │   ├── impact_agent.py     # Answers what-if questions
│   │   └── ingestion_agent.py  # Extracts decisions from content
│   │
│   ├── ingestion/              # File processors
│   │   ├── pipeline.py         # PDF/Excel processing
│   │   ├── slack.py            # Slack message fetching
│   │   ├── audio.py            # Audio transcription
│   │   ├── image.py            # Image OCR
│   │   └── excel.py            # Excel parsing
│   │
│   ├── tools/                  # Agent tools
│   │   ├── neo.py              # Neo4j search tool
│   │   ├── chroma.py           # ChromaDB search tool
│   │   └── impact_tools.py     # Impact analysis tools
│   │
│   ├── db/                     # Database clients
│   │   ├── neo.py              # Neo4j driver
│   │   ├── chroma.py           # ChromaDB client
│   │   └── file_registry.py    # Track uploaded files
│   │
│   ├── core/
│   │   └── config.py           # Environment config
│   │
│   ├── main.py                 # FastAPI routes
│   └── requirements.txt        # Python dependencies
│
└── frontend/                   # Next.js web app
    ├── app/
    │   ├── page.tsx            # Home page
    │   ├── query/page.tsx      # Main query interface
    │   ├── activity/page.tsx   # Activity timeline
    │   └── graph/page.tsx      # Knowledge graph visualization
    │
    ├── components/
    │   ├── Navbar.tsx          # Navigation bar
    │   ├── AgentBadge.tsx      # Shows which agent answered
    │   ├── SourceCard.tsx      # Displays sources
    │   └── FileSelector.tsx    # File upload dialog
    │
    ├── lib/
    │   └── api.ts              # Backend API calls
    │
    └── package.json            # Node dependencies
```

---

## 🚀 Getting Started

### Prerequisites

Before you start, make sure you have:

- **Python 3.10+** installed
- **Node.js 18+** installed
- **Neo4j AuraDB** account (free tier works)
- **Groq API key** (free at [groq.com](https://groq.com))
- **Slack Bot Token** (optional, only for Slack ingestion)

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/sunhacks.git
cd sunhacks
```

---

### Step 2: Set Up the Backend

#### Install Python Dependencies

```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

#### Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `backend/.env` with your credentials:

```env
# Groq API (get from https://console.groq.com)
GROQ_API_KEY=your_groq_api_key_here

# Neo4j AuraDB (get from https://neo4j.com/cloud/aura/)
NEO4J_URI=neo4j+s://xxxxxxxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password_here

# ChromaDB (local by default, or use cloud)
CHROMA_TENANT=default_tenant
CHROMA_API_KEY=your_chroma_key
CHROMA_DATABASE=notes

# Slack (optional - only if you want Slack ingestion)
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
```

#### Start the Backend Server

```bash
uvicorn main:app --reload
```

The API will be running at:
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

### Step 3: Set Up the Frontend

Open a new terminal window:

```bash
cd frontend
npm install
```

The frontend is already configured for local development. If needed, create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### Start the Frontend

```bash
npm run dev
```

The web app will be running at:
- **App**: http://localhost:3000

---

## 🎮 How to Use

### 1. Upload Documents

Go to http://localhost:3000/query and click the **Upload** tab.

**Supported file types:**
- PDFs
- Excel files (.xlsx, .xls)
- Images (.png, .jpg, .jpeg, .gif, .webp)
- Audio/Video (.mp3, .wav, .mp4, .mov, etc.)

The system will:
1. Check if the file was already uploaded (duplicate detection)
2. Extract text/content
3. Use AI to find decisions, people, reasons, and alternatives
4. Store everything in Neo4j and ChromaDB

### 2. Connect Slack

Click the **Slack** tab, enter a channel ID and message limit, then click **Ingest**.

The system will:
1. Fetch messages from the channel
2. Extract decisions from conversations
3. Store them in the knowledge graph

### 3. Ask Questions

Go to the **Query** tab and type your question:

**Example Questions:**

- "Why did we switch to Postgres?"
- "Who decided to migrate to microservices?"
- "What was the reasoning behind the redesign?"
- "What breaks if we remove the authentication service?"
- "What's the risk of changing the database schema?"

The system will:
1. Route your question to the right agent (Query or Impact)
2. Search Neo4j and ChromaDB
3. Generate an answer with sources and reasoning

### 4. View the Knowledge Graph

Go to http://localhost:3000/graph to see a visual representation of all decisions, people, and relationships.

### 5. Check Activity

Go to http://localhost:3000/activity to see a timeline of recent uploads and queries.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Check if API is running |
| `POST` | `/query` | Ask a question |
| `POST` | `/ingest/upload` | Upload a file |
| `POST` | `/ingest/slack` | Ingest Slack channel |
| `GET` | `/files/list` | List all uploaded files |
| `GET` | `/files/check/{source}` | Check if file exists |
| `GET` | `/graph/data` | Get graph data for visualization |
| `GET` | `/activity` | Get recent activity events |

### Example: Query Request

```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Why did we switch to Postgres?",
    "source_filter": null
  }'
```

### Example: Query Response

```json
{
  "question": "Why did we switch to Postgres?",
  "agent_used": "QUERY",
  "answer": "The team switched to Postgres in Q3 2023 because...",
  "reasoning": "Used search_decisions and search_raw_memory tools",
  "source_trace": [
    {
      "tool": "search_decisions",
      "args": {"query": "Postgres migration"},
      "result_preview": "Decision: Migrate from MySQL to Postgres..."
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🤖 How Agent Routing Works

Every question goes through the **Router Agent** first:

```
User Question
     │
     ▼
Router Agent (Llama 3.3 70B)
     │
     ├─→ QUERY Agent
     │   • "What happened?"
     │   • "Who decided?"
     │   • "When was this?"
     │   • Tools: search_decisions, search_raw_memory
     │
     └─→ IMPACT Agent
         • "What if we change X?"
         • "What breaks?"
         • "What's the risk?"
         • Tools: find_related_decisions, find_decisions_by_person
```

---

## 🔑 Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | ✅ Yes | Your Groq API key for LLM access |
| `NEO4J_URI` | ✅ Yes | Neo4j connection URI |
| `NEO4J_USERNAME` | ✅ Yes | Neo4j username (usually "neo4j") |
| `NEO4J_PASSWORD` | ✅ Yes | Neo4j password |
| `CHROMA_TENANT` | ✅ Yes | ChromaDB tenant ID |
| `CHROMA_API_KEY` | ✅ Yes | ChromaDB API key |
| `CHROMA_DATABASE` | ✅ Yes | ChromaDB database name |
| `SLACK_BOT_TOKEN` | ⚠️ Optional | Only needed for Slack ingestion |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API URL |

---

## 🐛 Troubleshooting

### Backend won't start

**Error: "Module not found"**
```bash
# Make sure virtual environment is activated
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

**Error: "Connection refused" to Neo4j**
- Check your `NEO4J_URI`, `NEO4J_USERNAME`, and `NEO4J_PASSWORD`
- Make sure your Neo4j AuraDB instance is running
- Test connection at https://console.neo4j.io

**Error: "Invalid API key" for Groq**
- Get a new API key from https://console.groq.com
- Make sure there are no extra spaces in your `.env` file

### Frontend won't start

**Error: "Cannot connect to backend"**
- Make sure the backend is running at http://localhost:8000
- Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local`

**Error: "Module not found"**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### File upload fails

**Error: "Unsupported file type"**
- Check the supported file types list
- Make sure the file extension is correct

**Error: "File already exists"**
- The system detected a duplicate file
- This is normal behavior to prevent re-processing

---

## 📊 Features

✅ **Multi-format ingestion** — PDF, Excel, images, audio, video, Slack  
✅ **Duplicate detection** — Never process the same file twice  
✅ **Smart routing** — Automatically picks the right agent  
✅ **Source tracking** — Every answer includes sources  
✅ **Knowledge graph** — Visual representation of decisions  
✅ **Activity timeline** — Track all uploads and queries  
✅ **Impact analysis** — Predict what breaks if things change  

---

## 🎨 Pages

| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Landing page with features |
| Knowledge Engine | `/query` | Main interface for queries and uploads |
| Graph View | `/graph` | Visual knowledge graph |
| Activity | `/activity` | Timeline of recent events |

---

## 📝 Example Use Cases

### Use Case 1: Onboarding New Team Members

**Question:** "Why did we choose React over Vue?"

**Answer:** The system searches the knowledge graph and finds the decision, who made it, when, and the reasoning behind it.

### Use Case 2: Impact Analysis

**Question:** "What breaks if we remove the authentication service?"

**Answer:** The Impact Agent finds all related decisions and systems that depend on authentication.

### Use Case 3: Historical Context

**Question:** "Who decided to migrate to AWS?"

**Answer:** The Query Agent finds the person, date, and reasons for the migration.

---
