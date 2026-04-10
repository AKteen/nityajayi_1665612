from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from activity_store import activity_store

app = FastAPI(title="Org Memory API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Models ───────────────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    question: str

class SlackIngestRequest(BaseModel):
    channel_id: str
    limit: int = 100

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/activity")
async def get_activity(limit: int = 50):
    """Get recent activity events."""
    return activity_store.get_events(limit)


@app.get("/health")
async def health():
    return {"status": "running"}


@app.post("/ingest/upload")
async def ingest_upload(file: UploadFile = File(...)):
    """Upload a PDF or Excel file — IngestionAgent extracts and stores decisions."""
    try:
        file_bytes = await file.read()
        filename = file.filename or "unknown"
        file_ext = filename.lower().split('.')[-1]
        
        # Validate file type
        if file_ext not in ['pdf', 'xlsx', 'xls']:
            raise ValueError(f"Unsupported file type. Please upload PDF or Excel files (.pdf, .xlsx, .xls)")
        
        # Extract text based on file type
        if file_ext in ['xlsx', 'xls']:
            from ingestion.excel import extract_text_from_excel
            raw_text = extract_text_from_excel(file_bytes, filename)
        else:  # pdf
            import fitz
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            raw_text = "\n".join(page.get_text() for page in doc)

        from agents.ingestion_agent import run_ingestion_agent
        result = run_ingestion_agent(content=raw_text, source=f"document:{filename}")
        
        # Log activity
        activity_store.add_event(
            "ingest",
            f"Document ingested: {filename}",
            f"Ingestion agent processed {len(raw_text)} characters",
            f"document:{filename}"
        )
        
        return {"status": "success", "result": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ingest/audio")
async def ingest_audio(file: UploadFile = File(...)):
    """Upload audio/video — transcribe to text, then IngestionAgent extracts and stores decisions."""
    try:
        file_bytes = await file.read()
        
        from ingestion.audio import transcribe_audio
        raw_text = transcribe_audio(file_bytes, file.filename)
        
        from agents.ingestion_agent import run_ingestion_agent
        result = run_ingestion_agent(content=raw_text, source=f"audio:{file.filename}")
        
        # Log activity
        activity_store.add_event(
            "ingest",
            f"Audio ingested: {file.filename}",
            f"Transcribed and processed {len(raw_text)} characters",
            f"audio:{file.filename}"
        )
        
        return {"status": "success", "result": result, "transcript": raw_text}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ingest/slack")
async def ingest_slack(req: SlackIngestRequest):
    """Fetch Slack messages — IngestionAgent extracts and stores decisions."""
    try:
        from ingestion.slack import fetch_slack_text
        raw_text = fetch_slack_text(req.channel_id, req.limit)

        from agents.ingestion_agent import run_ingestion_agent
        result = run_ingestion_agent(content=raw_text, source=f"slack:{req.channel_id}")
        
        # Log activity
        activity_store.add_event(
            "slack",
            f"Slack ingestion: #{req.channel_id}",
            f"Processed {req.limit} messages from channel",
            f"slack:{req.channel_id}"
        )
        
        return {"status": "success", "result": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


from datetime import datetime, timezone

@app.post("/query")
async def query(req: QueryRequest):
    """Ask anything — router decides which agent handles it."""
    try:
        from agents.router import run
        result = run(req.question)
        
        # Log activity
        agent_type = result["agent_used"].lower()
        activity_store.add_event(
            agent_type,
            f"Query: {req.question[:50]}{'...' if len(req.question) > 50 else ''}",
            f"{result['agent_used']} agent responded with {len(result['answer'])} characters",
            "Neo4j + ChromaDB" if agent_type == "query" else "Neo4j"
        )
        
        return {
            "question": req.question,
            "agent_used": result["agent_used"],
            "answer": result["answer"],
            "reasoning": result["reasoning"],
            "source_trace": result["source_trace"],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
