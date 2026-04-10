from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

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

@app.get("/health")
async def health():
    return {"status": "running"}


@app.post("/ingest/upload")
async def ingest_upload(file: UploadFile = File(...)):
    """Upload a PDF — IngestionAgent extracts and stores decisions."""
    try:
        import fitz
        file_bytes = await file.read()
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        raw_text = "\n".join(page.get_text() for page in doc)

        from agents.ingestion_agent import run_ingestion_agent
        result = run_ingestion_agent(content=raw_text, source=f"document:{file.filename}")
        return {"status": "success", "result": result}
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
