import json
import logging
from langchain.tools import tool
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from core.config import settings
from db.neo import neo_store

logger = logging.getLogger(__name__)

_llm = ChatGroq(api_key=settings.groq_api_key, model_name="llama-3.3-70b-versatile", temperature=0)

_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an organizational memory extractor.
Extract ALL decisions from the content. Return a JSON array with fields:
- decision, reason, impact, alternatives (list), people (list), timestamp, topic
Return ONLY valid JSON array. No markdown."""),
    ("human", "Content:\n{content}"),
])

_chain = _PROMPT | _llm


@tool
def extract_and_store(content: str, source: str) -> str:
    """Extract decisions from raw text using LLM and store them into Neo4j graph memory."""
    # Always store raw text in Chroma first
    from db.chroma import chroma_store
    chroma_store(content=content, source=source, metadata={"status": "processing"})
    logger.info(f"[INGEST TOOL] Stored raw text in Chroma: {source}")
    
    # Try to extract and store decisions
    try:
        response = _chain.invoke({"content": content})
        raw = response.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]

        items = json.loads(raw)
        if not isinstance(items, list):
            items = [items]

        stored = []
        neo4j_errors = []
        
        for item in items:
            try:
                decision_id = neo_store(
                    subject=item.get("topic", "general"),
                    action=item.get("decision", ""),
                    reason=item.get("reason", ""),
                    source=source,
                    people=item.get("people") or [],
                    impact=item.get("impact", ""),
                    alternatives=item.get("alternatives") or [],
                    timestamp=str(item.get("timestamp") or ""),
                )
                item["decision_id"] = decision_id
                stored.append(item)
                logger.info(f"[INGEST TOOL] Stored: '{item.get('decision', '')[:60]}'")
            except Exception as e:
                logger.error(f"[INGEST TOOL] Neo4j error for item: {e}")
                neo4j_errors.append(str(e))
                item["decision_id"] = "neo4j_error"
                stored.append(item)

        result = {"ingested": len(stored), "items": stored}
        if neo4j_errors:
            result["neo4j_errors"] = neo4j_errors
            result["note"] = "Some decisions failed to store in Neo4j but raw content is in ChromaDB"
        
        return json.dumps(result)
        
    except Exception as e:
        logger.error(f"[INGEST TOOL] Extraction failed: {e}")
        return json.dumps({
            "ingested": 0,
            "error": str(e),
            "note": "Raw content stored in ChromaDB, but decision extraction failed"
        })


@tool
def validate_content(content: str) -> str:
    """Check if the content contains any decisions or organizational information worth storing."""
    if len(content.strip()) < 50:
        return "SKIP: content too short"
    keywords = ["decided", "decision", "chose", "selected", "agreed", "approved",
                 "rejected", "hired", "fired", "migrated", "switched", "adopted", "freeze"]
    found = [k for k in keywords if k.lower() in content.lower()]
    if not found:
        return "SKIP: no decision keywords found"
    return f"PROCESS: found decision signals: {', '.join(found)}"
