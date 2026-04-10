const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface SourceTrace {
  tool: string;
  args: Record<string, string>;
  result_preview: string;
}

export interface QueryResponse {
  question: string;
  agent_used: "QUERY" | "IMPACT";
  answer: string;
  reasoning: string;
  source_trace: SourceTrace[];
  timestamp: string;
}

export interface IngestSlackResponse {
  status: string;
  result: Record<string, unknown>;
}

export interface ActivityEvent {
  id: string;
  type: "slack" | "gmail" | "query" | "impact" | "ingest";
  title: string;
  description: string;
  timestamp: string;
  source?: string;
}

// TODO: replace with real API when activity/history endpoint is added
export async function getActivityFeed(): Promise<ActivityEvent[]> {
  return [
    {
      id: "1",
      type: "query",
      title: "Query: Why did we migrate to Postgres?",
      description: "QUERY agent used search_decisions + search_raw_memory",
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      source: "Neo4j + ChromaDB",
    },
    {
      id: "2",
      type: "slack",
      title: "Slack ingestion: #engineering",
      description: "Extracted 3 decisions from 47 messages",
      timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      source: "slack:C0123456",
    },
    {
      id: "3",
      type: "impact",
      title: "Impact: What breaks if we remove Redis?",
      description: "IMPACT agent found 5 related decisions, risk: High",
      timestamp: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
      source: "Neo4j",
    },
    {
      id: "4",
      type: "ingest",
      title: "Document ingested: architecture-v2.pdf",
      description: "Ingestion agent stored 7 decisions to Neo4j + ChromaDB",
      timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      source: "document:architecture-v2.pdf",
    },
    {
      id: "5",
      type: "query",
      title: "Query: Who decided to use LangGraph?",
      description: "QUERY agent found 2 matching decisions",
      timestamp: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
      source: "Neo4j",
    },
    {
      id: "6",
      type: "slack",
      title: "Slack ingestion: #product",
      description: "Extracted 1 decision from 23 messages",
      timestamp: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
      source: "slack:C0789012",
    },
  ];
}

export async function queryKnowledge(question: string): Promise<QueryResponse> {
  // TODO: replace with real API — POST /query
  const res = await fetch(`${BASE}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Query failed");
  }
  return res.json();
}

export async function ingestSlack(
  channel_id: string,
  limit = 100
): Promise<IngestSlackResponse> {
  // TODO: replace with real API — POST /ingest/slack
  const res = await fetch(`${BASE}/ingest/slack`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel_id, limit }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Slack ingest failed");
  }
  return res.json();
}

export async function ingestFile(file: File): Promise<IngestSlackResponse> {
  // TODO: replace with real API — POST /ingest/upload
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/ingest/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "File ingest failed");
  }
  return res.json();
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/health`);
    const data = await res.json();
    return data.status === "running";
  } catch {
    return false;
  }
}
