from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn

app = FastAPI(title="Org Memory API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Request Models ───────────────────────────

class IngestRequest(BaseModel):
    source: str        # "slack" | "gmail" | "document"
    content: str
    metadata: Optional[dict] = {}

class QueryRequest(BaseModel):
    question: str

# ─── Routes ───────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "running"}

# Ingest data into memory
@app.post("/ingest")
async def ingest(req: IngestRequest):
    try:
        from ingestion.pipeline import run_ingestion
        result = run_ingestion(
            source=req.source,
            content=req.content,
            metadata=req.metadata
        )
        return {"status": "success", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Query the agent
@app.post("/query")
async def query(req: QueryRequest):
    try:
        from agent import run_agent
        result = run_agent(req.question)
        return {
            "question": req.question,
            "answer": result["answer"],
            "sources": result["sources"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Bulk ingest mock data for demo
@app.post("/ingest/mock")
async def ingest_mock():
    try:
        from ingestion.mock_data import load_mock_data
        load_mock_data()
        return {"status": "mock data loaded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)