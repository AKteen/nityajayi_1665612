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
    for item in items:
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

    # store raw text in Chroma
    from db.chroma import chroma_store
    chroma_store(content=content, source=source, metadata={"decision_count": len(stored)})
    logger.info(f"[INGEST TOOL] Stored raw text in Chroma: {source}")

    return json.dumps({"ingested": len(stored), "items": stored})


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
