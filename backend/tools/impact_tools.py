from langchain.tools import tool
from db.neo import neo_impact_search, neo_search as _neo_search


@tool
def find_related_decisions(topic: str) -> str:
    """Find all decisions related to a topic, system, or person. Use to understand what is connected before simulating impact."""
    records = neo_impact_search(topic)
    if not records:
        return f"No related decisions found for: {topic}"
    output = []
    for r in records:
        output.append(
            f"Decision: {r['decision']}\n"
            f"Topic: {r['topic']}\n"
            f"Reasons: {', '.join(r['reasons']) if r['reasons'] else 'N/A'}\n"
            f"People: {', '.join(r['people']) if r['people'] else 'N/A'}\n"
            f"Alternatives considered: {', '.join(r['alternatives']) if r['alternatives'] else 'N/A'}\n"
            f"Known impact: {r['impact']}\n"
            f"Source: {r['source']}"
        )
    return "\n---\n".join(output)


@tool
def find_decisions_by_person(person_name: str) -> str:
    """Find all decisions made by or involving a specific person."""
    records = _neo_search(person_name)
    if not records:
        return f"No decisions found involving: {person_name}"
    output = []
    for r in records:
        output.append(
            f"Decision: {r['decision']}\n"
            f"People involved: {', '.join(r['people']) if r['people'] else 'N/A'}\n"
            f"Reason: {', '.join(r['reasons']) if r['reasons'] else 'N/A'}\n"
            f"Impact: {r['impact']}"
        )
    return "\n---\n".join(output)
