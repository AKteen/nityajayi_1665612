from fastapi import FastAPI, HTTPException, UploadFile, File, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn
from activity_store import activity_store
from db.file_registry import register_file, check_file_exists, list_all_files, get_file_by_source, _compute_hash

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
    source_filter: str = None
    user_id: str = None

class SlackIngestRequest(BaseModel):
    channel_id: str
    limit: int = 100

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/activity")
async def get_activity(limit: int = 50, user_id: Optional[str] = None):
    """Get recent activity events for a specific user."""
    return activity_store.get_events(limit, user_id=user_id)


@app.get("/health")
async def health():
    return {"status": "running"}


@app.get("/files/list")
async def list_files():
    """List all uploaded files from Neo4j registry."""
    try:
        files = list_all_files()
        return {"status": "success", "files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/files/check/{source}")
async def check_file_by_source(source: str):
    """Check if a file exists by source identifier."""
    try:
        file_info = get_file_by_source(source)
        if file_info:
            return {"exists": True, "file": file_info}
        return {"exists": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ingest/upload")
async def ingest_upload(file: UploadFile = File(...), user_id: Optional[str] = Header(None)):
    """Universal upload endpoint - supports PDF, Excel, Images, Audio/Video."""
    try:
        file_bytes = await file.read()
        filename = file.filename or "unknown"
        file_ext = filename.lower().split('.')[-1]

        supported_exts = [
            'pdf', 'xlsx', 'xls',
            'png', 'jpg', 'jpeg', 'gif', 'webp',
            'mp3', 'wav', 'm4a', 'mp4', 'mov', 'avi', 'mkv', 'flac', 'ogg', 'webm'
        ]
        if file_ext not in supported_exts:
            raise ValueError(
                f"Unsupported file type: .{file_ext}. "
                f"Supported: PDF, Excel (.xlsx, .xls), Images (.png, .jpg, .jpeg, .gif, .webp), "
                f"Audio/Video (.mp3, .wav, .m4a, .mp4, .mov, .avi, .mkv, etc.)"
            )

        # Check if file already exists
        file_hash = _compute_hash(file_bytes)
        existing = check_file_exists(file_hash)
        if existing:
            return {
                "status": "already_exists",
                "message": f"File '{existing['filename']}' already uploaded on {existing['uploaded_at']}",
                "file": existing
            }

        # Process new file
        source = f"document:{filename}"
        from ingestion.pipeline import run_ingestion
        result = run_ingestion(file_bytes, filename, source)

        # Register file in Neo4j
        register_file(filename, file_hash, file_ext, source)

        activity_store.add_event(
            "ingest",
            f"File ingested: {filename}",
            f"Processed {len(file_bytes)} bytes",
            source,
            user_id=user_id
        )

        return {"status": "success", "result": result, "source": source}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ingest/audio")
async def ingest_audio(file: UploadFile = File(...)):
    """Upload audio/video — transcribe using Whisper, then extract and store decisions."""
    try:
        file_bytes = await file.read()
        filename = file.filename or "unknown"

        from ingestion.audio import transcribe_audio
        transcript = transcribe_audio(file_bytes, filename)

        from ingestion.pipeline import run_ingestion_from_text
        result = run_ingestion_from_text(transcript, f"audio:{filename}")

        activity_store.add_event(
            "ingest",
            f"Audio ingested: {filename}",
            f"Transcribed and processed {len(transcript)} characters",
            f"audio:{filename}"
        )

        return {"status": "success", "result": result, "transcript": transcript}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ingest/image")
async def ingest_image(file: UploadFile = File(...)):
    """Upload image — OCR using Groq Vision, then extract and store decisions."""
    try:
        file_bytes = await file.read()
        filename = file.filename or "unknown"

        from ingestion.image import extract_text_from_image
        extracted_text = extract_text_from_image(file_bytes, filename)

        from ingestion.pipeline import run_ingestion_from_text
        result = run_ingestion_from_text(extracted_text, f"image:{filename}")

        activity_store.add_event(
            "ingest",
            f"Image ingested: {filename}",
            f"OCR extracted and processed {len(extracted_text)} characters",
            f"image:{filename}"
        )

        return {"status": "success", "result": result, "extracted_text": extracted_text}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ingest/slack")
async def ingest_slack(req: SlackIngestRequest, user_id: Optional[str] = Header(None)):
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
            f"slack:{req.channel_id}",
            user_id=user_id
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
        result = run(req.question, source_filter=req.source_filter)
        
        # Log activity
        agent_type = result["agent_used"].lower()
        activity_store.add_event(
            agent_type,
            f"Query: {req.question[:50]}{'...' if len(req.question) > 50 else ''}",
            f"{result['agent_used']} agent responded with {len(result['answer'])} characters",
            "Neo4j + ChromaDB" if agent_type == "query" else "Neo4j",
            user_id=req.user_id
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
