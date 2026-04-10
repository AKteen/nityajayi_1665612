"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Loader2, RotateCcw, ChevronDown, ChevronUp,
  Upload, FileText, CheckCircle2, XCircle, X, MessageSquare, Hash,
} from "lucide-react";
import { queryKnowledge, ingestFile, ingestSlack, type QueryResponse } from "@/lib/api";
import SourceCard from "@/components/SourceCard";
import AgentBadge from "@/components/AgentBadge";

const SUGGESTIONS = [
  "Why did we migrate to Postgres?",
  "Who decided to use LangGraph?",
  "What breaks if we remove Redis?",
  "What alternatives were considered for the auth system?",
];

type Tab = "query" | "upload" | "slack";
type IngestState = "idle" | "loading" | "success" | "error";

export default function QueryPage() {
  const [tab, setTab] = useState<Tab>("query");

  // ── shared context banner (persists across tabs) ──────────────
  const [contextLabel, setContextLabel] = useState<string | null>(null);

  // ── Query state ───────────────────────────────────────────────
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [displayedAnswer, setDisplayedAnswer] = useState("");
  const [showSources, setShowSources] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const answerRef = useRef<string>("");

  // ── PDF Upload state ──────────────────────────────────────────
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<IngestState>("idle");
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Slack state ───────────────────────────────────────────────
  const [channelId, setChannelId] = useState("");
  const [msgLimit, setMsgLimit] = useState(100);
  const [slackState, setSlackState] = useState<IngestState>("idle");
  const [slackResult, setSlackResult] = useState<string | null>(null);
  const [slackError, setSlackError] = useState<string | null>(null);

  // Typing animation
  useEffect(() => {
    if (!result) return;
    setDisplayedAnswer("");
    answerRef.current = result.answer;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayedAnswer(answerRef.current.slice(0, i));
      if (i >= answerRef.current.length) clearInterval(interval);
    }, 12);
    return () => clearInterval(interval);
  }, [result]);

  // ── Query handlers ────────────────────────────────────────────
  async function handleSubmit(q?: string) {
    const query = q ?? question;
    if (!query.trim()) return;
    setQuestion(query);
    setLoading(true);
    setQueryError(null);
    setResult(null);
    setDisplayedAnswer("");
    setShowSources(false);
    try {
      const data = await queryKnowledge(query);
      setResult(data);
    } catch (e) {
      setQueryError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // ── PDF handlers ──────────────────────────────────────────────
  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === "application/pdf") setSelectedFile(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setUploadState("loading");
    setUploadError(null);
    setUploadResult(null);
    try {
      const data = await ingestFile(selectedFile);
      setUploadState("success");
      setContextLabel(selectedFile.name);
      setUploadResult(
        typeof data.result === "object"
          ? JSON.stringify(data.result, null, 2)
          : String(data.result)
      );
    } catch (e) {
      setUploadState("error");
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    }
  }

  function resetUpload() {
    setSelectedFile(null);
    setUploadState("idle");
    setUploadResult(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Slack handlers ────────────────────────────────────────────
  async function handleSlackIngest() {
    if (!channelId.trim()) return;
    setSlackState("loading");
    setSlackError(null);
    setSlackResult(null);
    try {
      const data = await ingestSlack(channelId.trim(), msgLimit);
      setSlackState("success");
      setContextLabel(`#${channelId.trim()}`);
      setSlackResult(
        typeof data.result === "object"
          ? JSON.stringify(data.result, null, 2)
          : String(data.result)
      );
    } catch (e) {
      setSlackState("error");
      setSlackError(e instanceof Error ? e.message : "Slack ingest failed");
    }
  }

  function resetSlack() {
    setChannelId("");
    setMsgLimit(100);
    setSlackState("idle");
    setSlackResult(null);
    setSlackError(null);
  }

  // ── Shared ingest result block ────────────────────────────────
  function IngestSuccess({
    label, result: res, onQuery, onReset, resetLabel,
  }: {
    label: string;
    result: string | null;
    onQuery: () => void;
    onReset: () => void;
    resetLabel: string;
  }) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/10 flex items-start gap-3">
          <CheckCircle2 size={16} className="text-green-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-green-400 font-medium">{label}</p>
            <p className="text-xs text-green-400/70 mt-0.5">
              Decisions extracted and stored in Neo4j + ChromaDB
            </p>
          </div>
        </div>

        {res && (
          <div className="glass-card rounded-xl border border-[var(--card-border)] p-4">
            <p className="text-xs text-[var(--muted)] mb-2 font-medium uppercase tracking-wide">
              Ingestion Result
            </p>
            <pre className="text-xs text-[var(--foreground)] font-mono whitespace-pre-wrap leading-relaxed overflow-auto max-h-48">
              {res}
            </pre>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onQuery}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Send size={14} /> Query this now
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2.5 rounded-xl border border-[var(--card-border)] text-[var(--muted)] hover:text-white text-sm transition-colors"
          >
            {resetLabel}
          </button>
        </div>
      </motion.div>
    );
  }

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "query", label: "Query", icon: Send },
    { id: "upload", label: "Upload PDF", icon: Upload },
    { id: "slack", label: "Slack", icon: MessageSquare },
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-white mb-1">Knowledge Engine</h1>
        <p className="text-sm text-[var(--muted)]">
          Ingest from Slack or PDF, then query across your entire organizational memory.
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex gap-1 p-1 rounded-xl glass-card border border-[var(--card-border)] mb-8 w-fit"
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === id
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-[var(--muted)] hover:text-white"
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ── QUERY TAB ──────────────────────────────────────────── */}
        {tab === "query" && (
          <motion.div
            key="query"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Context banner */}
            {contextLabel && (
              <div className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-lg border border-green-500/30 bg-green-500/10 text-green-400 text-xs">
                <CheckCircle2 size={13} />
                <span>
                  Querying with context from{" "}
                  <span className="font-semibold">{contextLabel}</span>
                </span>
                <button
                  onClick={() => setContextLabel(null)}
                  className="ml-auto text-green-400/60 hover:text-green-400"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Search bar */}
            <div className="relative rounded-xl border border-[var(--card-border)] glass-card glow-input transition-all duration-300">
              <input
                ref={inputRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Why did we choose React over Vue?"
                className="w-full bg-transparent px-5 py-4 pr-14 text-white placeholder:text-[var(--muted)] outline-none text-sm"
              />
              <button
                onClick={() => handleSubmit()}
                disabled={loading || !question.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>

            {/* Suggestions */}
            {!result && !loading && (
              <div className="mt-4 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSubmit(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-[var(--card-border)] text-[var(--muted)] hover:text-white hover:border-indigo-500/40 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Error */}
            <AnimatePresence>
              {queryError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm flex items-center justify-between"
                >
                  <span>{queryError}</span>
                  <button onClick={() => setQueryError(null)}>
                    <RotateCcw size={14} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Skeleton */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-8 space-y-3"
                >
                  {[80, 60, 90, 50].map((w, i) => (
                    <div
                      key={i}
                      className="h-3 rounded-full bg-white/5 animate-pulse"
                      style={{ width: `${w}%` }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Result */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-8 space-y-4"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <AgentBadge agent={result.agent_used} />
                    <span className="text-xs text-[var(--muted)]">{result.reasoning}</span>
                    <span className="text-xs text-[var(--muted)] ml-auto">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="glass-card rounded-xl p-6 border border-[var(--card-border)]">
                    <p
                      className={`text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap ${
                        displayedAnswer.length < result.answer.length ? "cursor-blink" : ""
                      }`}
                    >
                      {displayedAnswer}
                    </p>
                  </div>

                  {result.source_trace.length > 0 && (
                    <div>
                      <button
                        onClick={() => setShowSources((v) => !v)}
                        className="flex items-center gap-2 text-xs text-[var(--muted)] hover:text-white transition-colors mb-3"
                      >
                        {showSources ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        {result.source_trace.length} source
                        {result.source_trace.length > 1 ? "s" : ""} used
                      </button>
                      <AnimatePresence>
                        {showSources && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3 overflow-hidden"
                          >
                            {result.source_trace.map((trace, i) => (
                              <SourceCard key={i} trace={trace} />
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  <button
                    onClick={() => { setResult(null); setQuestion(""); inputRef.current?.focus(); }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                  >
                    <RotateCcw size={12} /> Ask another question
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── UPLOAD PDF TAB ─────────────────────────────────────── */}
        {tab === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <p className="text-sm text-[var(--muted)]">
              Upload a PDF — the IngestionAgent extracts decisions, people, and context,
              then stores them in Neo4j + ChromaDB for querying.
            </p>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => uploadState !== "success" && fileInputRef.current?.click()}
              className={`rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer p-10 text-center ${
                dragOver
                  ? "border-indigo-500 bg-indigo-500/10"
                  : selectedFile
                  ? "border-green-500/50 bg-green-500/5"
                  : "border-[var(--card-border)] hover:border-indigo-500/50 hover:bg-white/[0.02]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              {selectedFile ? (
                <div className="flex flex-col items-center gap-3">
                  <FileText size={36} className="text-green-400" />
                  <div>
                    <p className="text-white font-medium text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      {(selectedFile.size / 1024).toFixed(1)} KB · PDF
                    </p>
                  </div>
                  {uploadState !== "success" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); resetUpload(); }}
                      className="text-xs text-[var(--muted)] hover:text-red-400 transition-colors flex items-center gap-1"
                    >
                      <X size={12} /> Remove
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload size={36} className="text-[var(--muted)]" />
                  <div>
                    <p className="text-white text-sm font-medium">Drop your PDF here</p>
                    <p className="text-xs text-[var(--muted)] mt-1">or click to browse · PDF only</p>
                  </div>
                </div>
              )}
            </div>

            {/* Ingest button */}
            {selectedFile && uploadState === "idle" && (
              <button
                onClick={handleUpload}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 glow-indigo"
              >
                <Upload size={16} /> Ingest PDF
              </button>
            )}

            {/* Progress */}
            {uploadState === "loading" && (
              <div className="space-y-3">
                <div className="w-full py-3 rounded-xl bg-indigo-600/50 text-white text-sm font-medium flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Ingesting document…
                </div>
                <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full bg-indigo-500 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "90%" }}
                    transition={{ duration: 8, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {uploadState === "error" && uploadError && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex items-start gap-3"
              >
                <XCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-400 font-medium">Ingestion failed</p>
                  <p className="text-xs text-red-400/70 mt-1">{uploadError}</p>
                </div>
                <button onClick={resetUpload} className="text-red-400/60 hover:text-red-400">
                  <RotateCcw size={14} />
                </button>
              </motion.div>
            )}

            {/* Success */}
            {uploadState === "success" && (
              <IngestSuccess
                label="Document ingested successfully"
                result={uploadResult}
                onQuery={() => setTab("query")}
                onReset={resetUpload}
                resetLabel="Upload another"
              />
            )}
          </motion.div>
        )}

        {/* ── SLACK TAB ──────────────────────────────────────────── */}
        {tab === "slack" && (
          <motion.div
            key="slack"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <p className="text-sm text-[var(--muted)]">
              Fetch messages from a Slack channel — the IngestionAgent extracts decisions
              and stores them in Neo4j + ChromaDB.
            </p>

            {/* Form card */}
            <div className="glass-card rounded-xl border border-[var(--card-border)] p-6 space-y-5">

              {/* Channel ID */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
                  Channel ID
                </label>
                <div className="relative">
                  <Hash
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                  />
                  <input
                    value={channelId}
                    onChange={(e) => setChannelId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSlackIngest()}
                    placeholder="C0123456789"
                    disabled={slackState === "loading" || slackState === "success"}
                    className="w-full bg-transparent border border-[var(--card-border)] rounded-lg pl-8 pr-4 py-2.5 text-white placeholder:text-[var(--muted)] outline-none text-sm focus:border-indigo-500/60 transition-colors disabled:opacity-50"
                  />
                </div>
                <p className="text-xs text-[var(--muted)]">
                  Find it in Slack: right-click channel → View channel details → Channel ID at the bottom.
                </p>
              </div>

              {/* Message limit */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
                    Message Limit
                  </label>
                  <span className="text-xs font-mono text-indigo-400">{msgLimit}</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={500}
                  step={10}
                  value={msgLimit}
                  onChange={(e) => setMsgLimit(Number(e.target.value))}
                  disabled={slackState === "loading" || slackState === "success"}
                  className="w-full accent-indigo-500 disabled:opacity-50"
                />
                <div className="flex justify-between text-xs text-[var(--muted)]">
                  <span>10</span>
                  <span>500</span>
                </div>
              </div>

              {/* Ingest button */}
              {slackState !== "success" && (
                <button
                  onClick={handleSlackIngest}
                  disabled={!channelId.trim() || slackState === "loading"}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 glow-indigo"
                >
                  {slackState === "loading" ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Fetching & ingesting…
                    </>
                  ) : (
                    <>
                      <MessageSquare size={16} />
                      Ingest Channel
                    </>
                  )}
                </button>
              )}

              {/* Progress bar */}
              {slackState === "loading" && (
                <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full bg-indigo-500 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "85%" }}
                    transition={{ duration: 10, ease: "easeOut" }}
                  />
                </div>
              )}
            </div>

            {/* Error */}
            {slackState === "error" && slackError && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex items-start gap-3"
              >
                <XCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-400 font-medium">Slack ingest failed</p>
                  <p className="text-xs text-red-400/70 mt-1">{slackError}</p>
                </div>
                <button onClick={resetSlack} className="text-red-400/60 hover:text-red-400">
                  <RotateCcw size={14} />
                </button>
              </motion.div>
            )}

            {/* Success */}
            {slackState === "success" && (
              <IngestSuccess
                label={`#${channelId} ingested successfully`}
                result={slackResult}
                onQuery={() => setTab("query")}
                onReset={resetSlack}
                resetLabel="Ingest another"
              />
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
