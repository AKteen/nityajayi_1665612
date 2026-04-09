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

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "running"}


@app.post("/ingest/upload")
async def ingest_upload(file: UploadFile = File(...)):
    """Upload a document (PDF, DOCX, TXT) to ingest into org memory."""
    try:
        file_bytes = await file.read()
        from ingestion.pipeline import run_ingestion
        result = run_ingestion(
            file_bytes=file_bytes,
            filename=file.filename,
            source="document",
        )
        return {"status": "success", "result": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/query")
async def query(req: QueryRequest):
    """Ask a question about past decisions and reasoning."""
    try:
        from agent import run_agent
        result = run_agent(req.question)
        return {
            "question": req.question,
            "answer": result["answer"],
            "reasoning": result["reasoning"],
            "source_trace": result["source_trace"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
