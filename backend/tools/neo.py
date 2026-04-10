from langchain.tools import tool
from db.neo import neo_search


@tool
def search_decisions(query: str) -> str:
    """Search organizational memory for decisions, reasons, people and alternatives related to a topic or question."""
    records = neo_search(query)
    if not records:
        return f"No decisions found for: {query}"
    output = []
    for r in records:
        output.append(
            f"Decision: {r['decision']}\n"
            f"Topic: {r['topic']}\n"
            f"Reasons: {', '.join(r['reasons']) if r['reasons'] else 'N/A'}\n"
            f"People: {', '.join(r['people']) if r['people'] else 'N/A'}\n"
            f"Alternatives: {', '.join(r['alternatives']) if r['alternatives'] else 'N/A'}\n"
            f"Impact: {r['impact']}\n"
            f"Source: {r['source']} | Timestamp: {r['timestamp']}\n"
            f"ID: {r['id']}"
        )
    return "\n---\n".join(output)
