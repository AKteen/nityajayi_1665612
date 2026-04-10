from typing import Optional
from langchain.tools import tool
from db.chroma import chroma_search


@tool
def search_raw_memory(query: str, source_filter: Optional[str] = None) -> str:
    """Search raw document and chat content semantically.
    Use to find context, evidence, and details that may not be captured as structured decisions.
    Pass source_filter to restrict results to a specific ingested file or channel."""
    docs = chroma_search(query, k=3, source_filter=source_filter)
    if not docs:
        return "No relevant content found in raw memory."
    
    results = []
    for d in docs:
        content = d['page_content']
        # Limit content to 300 characters to avoid overwhelming the response
        if len(content) > 300:
            content = content[:300] + "..."
        results.append(
            f"Source: {d['metadata'].get('source', 'unknown')}\n"
            f"Content: {content}"
        )
    return "\n---\n".join(results)
