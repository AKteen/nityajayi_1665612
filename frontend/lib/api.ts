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
  suggested_questions?: string[];
}

export interface ActivityEvent {
  id: string;
  type: "slack" | "gmail" | "query" | "impact" | "ingest";
  title: string;
  description: string;
  timestamp: string;
  source?: string;
}

export interface FileMetadata {
  filename: string;
  hash: string;
  type: string;
  source: string;
  uploaded_at: string;
}

export async function getActivityFeed(userId?: string): Promise<ActivityEvent[]> {
  try {
    const url = userId ? `${BASE}/activity?user_id=${encodeURIComponent(userId)}` : `${BASE}/activity`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      console.error('Activity API error:', res.status, res.statusText);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to fetch activity:', error);
    return [];
  }
}

export async function queryKnowledge(question: string, sourceFilter?: string, userId?: string): Promise<QueryResponse> {
  const res = await fetch(`${BASE}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, source_filter: sourceFilter, user_id: userId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Query failed");
  }
  return res.json();
}

export async function ingestSlack(
  channel_id: string,
  limit = 100,
  userId?: string
): Promise<IngestSlackResponse> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (userId) headers['user-id'] = userId;
  
  const res = await fetch(`${BASE}/ingest/slack`, {
    method: "POST",
    headers,
    body: JSON.stringify({ channel_id, limit }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Slack ingest failed");
  }
  return res.json();
}

export async function ingestFile(file: File, userId?: string): Promise<IngestSlackResponse> {
  const form = new FormData();
  form.append("file", file);
  const headers: HeadersInit = {};
  if (userId) headers['user-id'] = userId;
  
  const res = await fetch(`${BASE}/ingest/upload`, {
    method: "POST",
    headers,
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "File ingest failed");
  }
  return res.json();
}

export async function ingestExcel(file: File): Promise<IngestSlackResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/ingest/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Excel ingest failed");
  }
  return res.json();
}

export async function ingestAudio(file: File): Promise<IngestSlackResponse & { transcript?: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/ingest/audio`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Audio ingest failed");
  }
  return res.json();
}

export async function ingestImage(file: File): Promise<IngestSlackResponse & { extracted_text?: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/ingest/image`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Image ingest failed");
  }
  return res.json();
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/health`, {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === "running" || data.status === "healthy";
  } catch (error) {
    console.error("Health check failed:", error);
    return false;
  }
}

export async function listFiles(): Promise<FileMetadata[]> {
  try {
    console.log('Fetching files from:', `${BASE}/files/list`);
    const res = await fetch(`${BASE}/files/list`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    console.log('Response status:', res.status);
    if (!res.ok) {
      console.error('Failed to fetch files:', res.status, res.statusText);
      return [];
    }
    const data = await res.json();
    console.log('Files data received:', data);
    return data.files || [];
  } catch (error) {
    console.error("Failed to list files:", error);
    return [];
  }
}

export interface GraphNode {
  id: string;
  label: string;
  type: "Decision" | "Person" | "Reason" | "Alternative";
  source?: string;
  subject?: string;
  impact?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: "MADE_BY" | "BASED_ON" | "ALTERNATIVE";
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export async function getGraphData(): Promise<GraphData> {
  const res = await fetch(`${BASE}/graph/data`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch graph data");
  return res.json();
}

export async function checkFileBySource(source: string): Promise<{ exists: boolean; file?: FileMetadata }> {
  try {
    const res = await fetch(`${BASE}/files/check/${encodeURIComponent(source)}`);
    if (!res.ok) return { exists: false };
    return res.json();
  } catch (error) {
    console.error("Failed to check file:", error);
    return { exists: false };
  }
}
