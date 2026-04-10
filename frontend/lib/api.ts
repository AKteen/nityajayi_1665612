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

export async function getActivityFeed(): Promise<ActivityEvent[]> {
  try {
    const res = await fetch(`${BASE}/activity`);
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

export async function queryKnowledge(question: string, sourceContext?: string): Promise<QueryResponse> {
  // TODO: replace with real API — POST /query
  const res = await fetch(`${BASE}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, source_context: sourceContext }),
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
