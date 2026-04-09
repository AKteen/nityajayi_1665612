import chromadb
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction

_client = chromadb.PersistentClient(path="./chroma_db")
_ef = DefaultEmbeddingFunction()
_collection = _client.get_or_create_collection(
    name="org_memory",
    embedding_function=_ef,
)


def chroma_store(content: str, source: str, metadata: dict = None) -> str:
    import uuid
    _collection.add(
        documents=[content],
        metadatas=[{"source": source, **(metadata or {})}],
        ids=[str(uuid.uuid4())],
    )
    return f"Stored in Chroma from source: {source}"


def chroma_search(query: str, k: int = 4) -> list:
    results = _collection.query(query_texts=[query], n_results=k)
    docs = []
    for i, doc in enumerate(results["documents"][0]):
        meta = results["metadatas"][0][i] if results["metadatas"] else {}
        docs.append({"page_content": doc, "metadata": meta})
    return docs
