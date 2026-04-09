from langchain.tools import tool
from db.neo import neo_search, neo_decision_chain


@tool
def search_relationship_graph(entity: str) -> str:
    """Search for decisions and reasoning related to a person, topic or keyword in Neo4j."""
    records = neo_search(entity)
    if not records:
        return f"No relationships found for: {entity}"
    return "\n---\n".join(
        f"Person: {r['person']}\nDecision: {r['action']}\n"
        f"Reason: {r['reason']}\nImpact: {r['impact']}\n"
        f"Source: {r['source']}\nTimestamp: {r['timestamp']}"
        for r in records
    )


@tool
def get_decision_chain(topic: str) -> str:
    """Get full decision history for a specific topic."""
    records = neo_decision_chain(topic)
    if not records:
        return f"No decision chain found for: {topic}"
    return "\n".join(
        f"→ [{r['timestamp']}] {r['person']} decided: {r['action']}\n"
        f"  Because: {r['reason']}  |  From: {r['source']}"
        for r in records
    )
