from langchain.tools import tool
from db.chroma import chroma_search, chroma_store as _chroma_store


@tool
def search_semantic_memory(query: str) -> str:
    """Search ChromaDB for semantically similar company decisions and documents.
    Use when user asks WHAT was decided or any general question."""
    docs = chroma_search(query, k=4)
    if not docs:
        return "No relevant memories found."
    return "\n---\n".join(
        f"Source: {d['metadata'].get('source')}\n"
        f"Decision: {d['metadata'].get('decision', '')}\n"
        f"Content: {d['page_content']}"
        for d in docs
    )


@tool
def store_in_chroma(content: str, source: str, metadata: dict = None) -> str:
    """Store raw document content into ChromaDB vector store."""
    return _chroma_store(content, source, metadata)
