import fitz
import json
import logging
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from core.config import settings

logger = logging.getLogger(__name__)

llm = ChatGroq(
    api_key=settings.groq_api_key,
    model_name="llama-3.3-70b-versatile",
    temperature=0,
)

PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an organizational memory extractor.
Extract ALL decisions, reasoning, and key information from the document.
Return a JSON array. Each item must have exactly these fields:
- decision: what was decided
- reason: why it was decided
- impact: effect on the organization
- alternatives: list of strings (alternatives considered)
- people: list of strings (people involved)
- timestamp: date if mentioned, else null
- topic: high-level domain (e.g. hiring, product, budget, tech)

Return ONLY a valid JSON array. No markdown, no explanation."""),
    ("human", "Document:\n{content}"),
])

chain = PROMPT | llm


def run_ingestion(file_bytes: bytes, filename: str, source: str = "document") -> dict:
    # 1. Extract text via pymupdf
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    raw_text = "\n".join(page.get_text() for page in doc)
    logger.info(f"[EXTRACT] '{filename}' → {len(raw_text)} chars extracted")

    # 2. Groq → structured JSON
    response = chain.invoke({"content": raw_text})
    raw = response.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    items = json.loads(raw)
    if not isinstance(items, list):
        items = [items]
    logger.info(f"[GROQ] Extracted {len(items)} structured items from '{filename}'")

    # 3. Store each item into Neo4j
    from db.neo import neo_store
    for i, item in enumerate(items):
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
        logger.info(f"[NEO4J] ✓ {i+1}/{len(items)}: '{item.get('decision', '')[:60]}'")

    logger.info(f"[DONE] '{filename}' → {len(items)} items stored in Neo4j")
    return {"ingested": len(items), "items": items}
