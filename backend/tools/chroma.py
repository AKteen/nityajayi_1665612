from langchain.tools import tool
from db.chroma import chroma_search


@tool
def search_raw_memory(query: str) -> str:
    """Search raw document and chat content semantically.
    Use to find context, evidence, and details that may not be captured as structured decisions."""
    docs = chroma_search(query, k=4)
    if not docs:
        return "No relevant content found in raw memory."
    return "\n---\n".join(
        f"Source: {d['metadata'].get('source', 'unknown')}\n"
        f"Content: {d['page_content']}"
        for d in docs
    )
