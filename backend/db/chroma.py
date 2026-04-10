import uuid
import chromadb
from langchain_cohere import CohereEmbeddings
from core.config import settings

_embeddings = CohereEmbeddings(
    cohere_api_key=settings.cohere_api_key,
    model="embed-english-light-v3.0",
)

_client = chromadb.CloudClient(
    api_key=settings.chroma_api_key,
    tenant=settings.chroma_tenant,
    database=settings.chroma_database,
)

_collection = _client.get_or_create_collection(name="notes")


def chroma_store(content: str, source: str, metadata: dict = None) -> str:
    embedding = _embeddings.embed_documents([content])[0]
    _collection.add(
        documents=[content],
        embeddings=[embedding],
        metadatas=[{"source": source, **(metadata or {})}],
        ids=[str(uuid.uuid4())],
    )
    return f"Stored in Chroma Cloud: {source}"


def chroma_search(query: str, k: int = 4) -> list:
    embedding = _embeddings.embed_query(query)
    results = _collection.query(query_embeddings=[embedding], n_results=k)
    docs = []
    for i, doc in enumerate(results["documents"][0]):
        meta = results["metadatas"][0][i] if results["metadatas"] else {}
        docs.append({"page_content": doc, "metadata": meta})
    return docs
