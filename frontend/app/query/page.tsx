"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Loader2, RotateCcw, ChevronDown, ChevronUp,
  Upload, FileText, CheckCircle2, XCircle, X, MessageSquare, Hash, Mic, FileSpreadsheet, Image as ImageIcon,
} from "lucide-react";
import { queryKnowledge, ingestFile, ingestSlack, ingestAudio, ingestExcel, ingestImage, type QueryResponse } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import SourceCard from "@/components/SourceCard";
import AgentBadge from "@/components/AgentBadge";

const SUGGESTIONS = [
  "Why did we migrate to Postgres?",
  "Who decided to use LangGraph?",
  "What breaks if we remove Redis?",
  "What alternatives were considered for the auth system?",
];

type Tab = "query" | "upload" | "excel" | "audio" | "image" | "slack";
type IngestState = "idle" | "loading" | "success" | "error";

export default function QueryPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("query");

  // ── shared context banner (persists across tabs) ──────────────
  const [contextLabel, setContextLabel] = useState<string | null>(null);
  const [sourceContext, setSourceContext] = useState<string | null>(null);

  // Load context from URL params on mount
  useEffect(() => {
    const source = searchParams.get("source");
    const filename = searchParams.get("filename");
    if (source && filename) {
      setSourceContext(source);
      const icon = source.startsWith("document:") ? "📄" : 
                   source.startsWith("audio:") ? "🎵" :
                   source.startsWith("image:") ? "🖼️" : "📁";
      setContextLabel(`${icon} ${filename}`);
    }
  }, [searchParams]);

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

  // ── Excel Upload state ────────────────────────────────────────
  const [excelDragOver, setExcelDragOver] = useState(false);
  const [selectedExcel, setSelectedExcel] = useState<File | null>(null);
  const [excelState, setExcelState] = useState<IngestState>("idle");
  const [excelResult, setExcelResult] = useState<string | null>(null);
  const [excelError, setExcelError] = useState<string | null>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  // ── Audio state ───────────────────────────────────────────────
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioState, setAudioState] = useState<IngestState>("idle");
  const [audioResult, setAudioResult] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // ── Image state ───────────────────────────────────────────────
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageState, setImageState] = useState<IngestState>("idle");
  const [imageResult, setImageResult] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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
      const data = await queryKnowledge(query, sourceContext || undefined, user?.id);
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
      const data = await ingestFile(selectedFile, user?.id);
      setUploadState("success");
      setContextLabel(`📄 ${selectedFile.name}`);
      setSourceContext(`document:${selectedFile.name}`);
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
    setSourceContext(null);
    setContextLabel(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Excel handlers ────────────────────────────────────────────
  function handleExcelDrop(e: React.DragEvent) {
    e.preventDefault();
    setExcelDragOver(false);
    const file = e.dataTransfer.files[0];
    const ext = file?.name.toLowerCase().split('.').pop();
    if (ext === 'xlsx' || ext === 'xls') setSelectedExcel(file);
  }

  function handleExcelSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setSelectedExcel(file);
  }

  async function handleExcelUpload() {
    if (!selectedExcel) return;
    setExcelState("loading");
    setExcelError(null);
    setExcelResult(null);
    try {
      const data = await ingestExcel(selectedExcel);
      setExcelState("success");
      setContextLabel(`📊 ${selectedExcel.name}`);
      setSourceContext(`document:${selectedExcel.name}`);
      setExcelResult(
        typeof data.result === "object"
          ? JSON.stringify(data.result, null, 2)
          : String(data.result)
      );
    } catch (e) {
      setExcelState("error");
      setExcelError(e instanceof Error ? e.message : "Excel upload failed");
    }
  }

  function resetExcel() {
    setSelectedExcel(null);
    setExcelState("idle");
    setExcelResult(null);
    setExcelError(null);
    setSourceContext(null);
    setContextLabel(null);
    if (excelInputRef.current) excelInputRef.current.value = "";
  }

  // ── Slack handlers ────────────────────────────────────────────
  async function handleSlackIngest() {
    if (!channelId.trim()) return;
    setSlackState("loading");
    setSlackError(null);
    setSlackResult(null);
    try {
      const data = await ingestSlack(channelId.trim(), msgLimit, user?.id);
      setSlackState("success");
      setContextLabel(`💬 #${channelId.trim()}`);
      setSourceContext(`slack:${channelId.trim()}`);
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
    setSourceContext(null);
    setContextLabel(null);
  }

  // ── Audio handlers ────────────────────────────────────────────
  function handleAudioSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setAudioFile(file);
  }

  async function handleAudioUpload() {
    if (!audioFile) return;
    setAudioState("loading");
    setAudioError(null);
    setAudioResult(null);
    setTranscript(null);
    try {
      const data = await ingestAudio(audioFile);
      setAudioState("success");
      setContextLabel(`🎵 ${audioFile.name}`);
      setSourceContext(`audio:${audioFile.name}`);
      setTranscript(data.transcript || null);
      setAudioResult(
        typeof data.result === "object"
          ? JSON.stringify(data.result, null, 2)
          : String(data.result)
      );
    } catch (e) {
      setAudioState("error");
      setAudioError(e instanceof Error ? e.message : "Audio ingest failed");
    }
  }

  function resetAudio() {
    setAudioFile(null);
    setAudioState("idle");
    setAudioResult(null);
    setAudioError(null);
    setTranscript(null);
    setSourceContext(null);
    setContextLabel(null);
    if (audioInputRef.current) audioInputRef.current.value = "";
  }

  // ── Image handlers ────────────────────────────────────────────
  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setImageFile(file);
  }

  async function handleImageUpload() {
    if (!imageFile) return;
    setImageState("loading");
    setImageError(null);
    setImageResult(null);
    setExtractedText(null);
    try {
      const data = await ingestImage(imageFile);
      setImageState("success");
      setContextLabel(`🖼️ ${imageFile.name}`);
      setSourceContext(`image:${imageFile.name}`);
      setExtractedText(data.extracted_text || null);
      setImageResult(
        typeof data.result === "object"
          ? JSON.stringify(data.result, null, 2)
          : String(data.result)
      );
    } catch (e) {
      setImageState("error");
      setImageError(e instanceof Error ? e.message : "Image ingest failed");
    }
  }

  function resetImage() {
    setImageFile(null);
    setImageState("idle");
    setImageResult(null);
    setImageError(null);
    setExtractedText(null);
    setSourceContext(null);
    setContextLabel(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
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
            <p className="text-xs text-gray-600 mb-2 font-medium uppercase tracking-wide">
              Ingestion Result
            </p>
            <pre className="text-xs text-gray-900 font-mono whitespace-pre-wrap leading-relaxed overflow-auto max-h-48">
              {res}
            </pre>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onQuery}
            className="flex-1 py-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white text-base font-bold transition-colors flex items-center justify-center gap-2 shadow-lg border border-blue-500"
          >
            <Send size={18} /> Query this now
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2.5 rounded-xl border border-[var(--card-border)] text-gray-600 hover:text-gray-900 text-sm transition-colors"
          >
            {resetLabel}
          </button>
        </div>
      </motion.div>
    );
  }

  function switchTab(id: Tab) {
    // Only clear context when switching TO an ingest tab (not when going to query)
    if (id !== "query") {
      setSourceContext(null);
      setContextLabel(null);
    }
    setTab(id);
  }

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "query", label: "Query", icon: Send },
    { id: "upload", label: "Upload PDF", icon: Upload },
    { id: "excel", label: "Upload Excel", icon: FileSpreadsheet },
    { id: "audio", label: "Audio/Video", icon: Mic },
    { id: "image", label: "Image OCR", icon: ImageIcon },
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
        <h1 className="text-3xl font-black text-gray-900 mb-2">Knowledge Engine</h1>
        <p className="text-base text-gray-700">
          Ingest from Slack, PDF, Excel, Audio/Video, or Images, then query across your entire organizational memory.
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 p-1.5 rounded-2xl glass-card border-2 border-[var(--card-border)] mb-8 w-fit shadow-lg"
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <motion.button
            key={id}
            onClick={() => switchTab(id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all duration-200 border ${
              tab === id
                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-xl border-blue-500"
                : "text-gray-700 hover:text-gray-900 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 border-gray-200"
            }`}
          >
            <motion.div
              animate={tab === id ? { rotate: 360 } : {}}
              transition={{ duration: 0.5 }}
            >
              <Icon size={16} />
            </motion.div>
            {label}
          </motion.button>
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
                  Querying ONLY from{" "}
                  <span className="font-semibold">{contextLabel}</span>
                </span>
                <button
                  onClick={() => { setContextLabel(null); setSourceContext(null); }}
                  className="ml-auto text-green-400/60 hover:text-green-400"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Search bar */}
            <motion.div 
              className="flex items-center gap-3 rounded-2xl border-2 border-[var(--card-border)] glass-card glow-input transition-all duration-300 shadow-lg px-4 py-3"
              whileHover={{ scale: 1.02 }}
            >
              <input
                ref={inputRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Why did we choose React over Vue?"
                className="flex-1 bg-transparent text-gray-900 placeholder:text-gray-500 outline-none text-base font-medium"
              />
              <motion.button
                onClick={() => handleSubmit()}
                disabled={loading || !question.trim()}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="shrink-0 p-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white shadow-lg border border-blue-500"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </motion.button>
            </motion.div>

            {/* Suggestions */}
            {!result && !loading && (
              <motion.div 
                className="mt-4 flex flex-wrap gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={s}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSubmit(s)}
                    className="text-sm px-4 py-2 rounded-full border border-gray-200 text-gray-700 hover:text-blue-600 hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all font-medium shadow-sm"
                  >
                    {s}
                  </motion.button>
                ))}
              </motion.div>
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
                    <span className="text-xs text-gray-600">{result.reasoning}</span>
                    <span className="text-xs text-gray-600 ml-auto">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="glass-card rounded-2xl p-8 border-2 border-[var(--card-border)] shadow-lg">
                    <p
                      className={`text-base text-gray-900 leading-relaxed whitespace-pre-wrap font-medium ${
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
                        className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 transition-colors mb-3"
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
                    className="text-xs text-blue-600 hover:text-blue-500 transition-colors flex items-center gap-1"
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
            <p className="text-sm text-gray-600">
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
                  ? "border-blue-500 bg-blue-50"
                  : selectedFile
                  ? "border-green-500/50 bg-green-50"
                  : "border-gray-200 hover:border-blue-400 hover:bg-blue-50/30"
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
                    <p className="text-gray-900 font-medium text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {(selectedFile.size / 1024).toFixed(1)} KB · PDF
                    </p>
                  </div>
                  {uploadState !== "success" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); resetUpload(); }}
                      className="text-xs text-gray-600 hover:text-red-500 transition-colors flex items-center gap-1"
                    >
                      <X size={12} /> Remove
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload size={36} className="text-gray-500" />
                  <div>
                    <p className="text-gray-900 text-sm font-medium">Drop your PDF here</p>
                    <p className="text-xs text-gray-600 mt-1">or click to browse · PDF only</p>
                  </div>
                </div>
              )}
            </div>

            {/* Ingest button */}
            {selectedFile && uploadState === "idle" && (
              <button
                onClick={handleUpload}
                className="w-full py-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white text-base font-bold transition-all flex items-center justify-center gap-3 shadow-xl border border-blue-500"
              >
                <Upload size={20} /> Ingest PDF
              </button>
            )}

            {/* Progress */}
            {uploadState === "loading" && (
              <div className="space-y-3">
                <div className="w-full py-3 rounded-xl bg-blue-500/50 text-white text-sm font-medium flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Ingesting document…
                </div>
                <div className="w-full h-1 rounded-full bg-blue-100 overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-500 rounded-full"
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
                onQuery={() => switchTab("query")}
                onReset={resetUpload}
                resetLabel="Upload another"
              />
            )}
          </motion.div>
        )}

        {/* ── UPLOAD EXCEL TAB ────────────────────────────────────── */}
        {tab === "excel" && (
          <motion.div
            key="excel"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <p className="text-sm text-gray-600">
              Upload an Excel file — the IngestionAgent extracts decisions, people, and context,
              then stores them in Neo4j + ChromaDB for querying.
            </p>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setExcelDragOver(true); }}
              onDragLeave={() => setExcelDragOver(false)}
              onDrop={handleExcelDrop}
              onClick={() => excelState !== "success" && excelInputRef.current?.click()}
              className={`rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer p-10 text-center ${
                excelDragOver
                  ? "border-blue-500 bg-blue-50"
                  : selectedExcel
                  ? "border-green-500/50 bg-green-50"
                  : "border-gray-200 hover:border-blue-400 hover:bg-blue-50/30"
              }`}
            >
              <input
                ref={excelInputRef}
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={handleExcelSelect}
                className="hidden"
              />
              {selectedExcel ? (
                <div className="flex flex-col items-center gap-3">
                  <FileSpreadsheet size={36} className="text-green-400" />
                  <div>
                    <p className="text-gray-900 font-medium text-sm">{selectedExcel.name}</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {(selectedExcel.size / 1024).toFixed(1)} KB · Excel
                    </p>
                  </div>
                  {excelState !== "success" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); resetExcel(); }}
                      className="text-xs text-gray-600 hover:text-red-500 transition-colors flex items-center gap-1"
                    >
                      <X size={12} /> Remove
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <FileSpreadsheet size={36} className="text-gray-500" />
                  <div>
                    <p className="text-gray-900 text-sm font-medium">Drop your Excel file here</p>
                    <p className="text-xs text-gray-600 mt-1">or click to browse · .xlsx or .xls</p>
                  </div>
                </div>
              )}
            </div>

            {/* Ingest button */}
            {selectedExcel && excelState === "idle" && (
              <button
                onClick={handleExcelUpload}
                className="w-full py-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white text-base font-bold transition-all flex items-center justify-center gap-3 shadow-xl border border-blue-500"
              >
                <FileSpreadsheet size={20} /> Ingest Excel
              </button>
            )}

            {/* Progress */}
            {excelState === "loading" && (
              <div className="space-y-3">
                <div className="w-full py-3 rounded-xl bg-blue-500/50 text-white text-sm font-medium flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Ingesting Excel…
                </div>
                <div className="w-full h-1 rounded-full bg-blue-100 overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-500 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "90%" }}
                    transition={{ duration: 8, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {excelState === "error" && excelError && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex items-start gap-3"
              >
                <XCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-400 font-medium">Excel ingestion failed</p>
                  <p className="text-xs text-red-400/70 mt-1">{excelError}</p>
                </div>
                <button onClick={resetExcel} className="text-red-400/60 hover:text-red-400">
                  <RotateCcw size={14} />
                </button>
              </motion.div>
            )}

            {/* Success */}
            {excelState === "success" && (
              <IngestSuccess
                label="Excel ingested successfully"
                result={excelResult}
                onQuery={() => switchTab("query")}
                onReset={resetExcel}
                resetLabel="Upload another"
              />
            )}
          </motion.div>
        )}

        {/* ── AUDIO TAB ──────────────────────────────────────────── */}
        {tab === "audio" && (
          <motion.div
            key="audio"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <p className="text-sm text-gray-600">
              Upload audio or video — we'll transcribe it using Whisper, then extract decisions
              and store them in Neo4j + ChromaDB.
            </p>

            <div
              onClick={() => audioState !== "success" && audioInputRef.current?.click()}
              className={`rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer p-10 text-center ${
                audioFile
                  ? "border-green-500/50 bg-green-50"
                  : "border-gray-200 hover:border-blue-400 hover:bg-blue-50/30"
              }`}
            >
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*,video/*,.mp3,.wav,.m4a,.mp4,.mov,.avi,.mkv"
                onChange={handleAudioSelect}
                className="hidden"
              />
              {audioFile ? (
                <div className="flex flex-col items-center gap-3">
                  <Mic size={36} className="text-green-400" />
                  <div>
                    <p className="text-gray-900 font-medium text-sm">{audioFile.name}</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  {audioState !== "success" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); resetAudio(); }}
                      className="text-xs text-gray-600 hover:text-red-500 transition-colors flex items-center gap-1"
                    >
                      <X size={12} /> Remove
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Mic size={36} className="text-gray-500" />
                  <div>
                    <p className="text-gray-900 text-sm font-medium">Drop audio/video here</p>
                    <p className="text-xs text-gray-600 mt-1">
                      or click to browse · MP3, WAV, MP4, MOV, etc.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {audioFile && audioState === "idle" && (
              <button
                onClick={handleAudioUpload}
                className="w-full py-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white text-base font-bold transition-all flex items-center justify-center gap-3 shadow-xl border border-blue-500"
              >
                <Mic size={20} /> Transcribe & Ingest
              </button>
            )}

            {audioState === "loading" && (
              <div className="space-y-3">
                <div className="w-full py-3 rounded-xl bg-blue-500/50 text-white text-sm font-medium flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Transcribing audio…
                </div>
                <div className="w-full h-1 rounded-full bg-blue-100 overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-500 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "90%" }}
                    transition={{ duration: 15, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}

            {audioState === "error" && audioError && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex items-start gap-3"
              >
                <XCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-400 font-medium">Transcription failed</p>
                  <p className="text-xs text-red-400/70 mt-1">{audioError}</p>
                </div>
                <button onClick={resetAudio} className="text-red-400/60 hover:text-red-400">
                  <RotateCcw size={14} />
                </button>
              </motion.div>
            )}

            {audioState === "success" && (
              <IngestSuccess
                label="Audio transcribed & ingested"
                result={audioResult}
                onQuery={() => switchTab("query")}
                onReset={resetAudio}
                resetLabel="Upload another"
              />
            )}
          </motion.div>
        )}

        {/* ── IMAGE TAB ──────────────────────────────────────────── */}
        {tab === "image" && (
          <motion.div
            key="image"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <p className="text-sm text-gray-600">
              Upload an image — we'll extract text using Groq Vision OCR, then extract decisions
              and store them in Neo4j + ChromaDB.
            </p>

            <div
              onClick={() => imageState !== "success" && imageInputRef.current?.click()}
              className={`rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer p-10 text-center ${
                imageFile
                  ? "border-green-500/50 bg-green-50"
                  : "border-[var(--card-border)] hover:border-orange-400 hover:bg-orange-50/30"
              }`}
            >
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*,.png,.jpg,.jpeg,.gif,.webp"
                onChange={handleImageSelect}
                className="hidden"
              />
              {imageFile ? (
                <div className="flex flex-col items-center gap-3">
                  <ImageIcon size={36} className="text-green-400" />
                  <div>
                    <p className="text-gray-900 font-medium text-sm">{imageFile.name}</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {(imageFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  {imageState !== "success" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); resetImage(); }}
                      className="text-xs text-gray-600 hover:text-red-500 transition-colors flex items-center gap-1"
                    >
                      <X size={12} /> Remove
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <ImageIcon size={36} className="text-gray-500" />
                  <div>
                    <p className="text-gray-900 text-sm font-medium">Drop image here</p>
                    <p className="text-xs text-gray-600 mt-1">
                      or click to browse · PNG, JPG, JPEG, GIF, WebP
                    </p>
                  </div>
                </div>
              )}
            </div>

            {imageFile && imageState === "idle" && (
              <button
                onClick={handleImageUpload}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white text-base font-bold transition-all flex items-center justify-center gap-3 sunrise-glow shadow-xl"
              >
                <ImageIcon size={20} /> Extract Text & Ingest
              </button>
            )}

            {imageState === "loading" && (
              <div className="space-y-3">
                <div className="w-full py-3 rounded-xl bg-orange-500/50 text-white text-sm font-medium flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Extracting text from image…
                </div>
                <div className="w-full h-1 rounded-full bg-orange-100 overflow-hidden">
                  <motion.div
                    className="h-full bg-orange-500 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "90%" }}
                    transition={{ duration: 10, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}

            {imageState === "error" && imageError && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex items-start gap-3"
              >
                <XCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-400 font-medium">OCR extraction failed</p>
                  <p className="text-xs text-red-400/70 mt-1">{imageError}</p>
                </div>
                <button onClick={resetImage} className="text-red-400/60 hover:text-red-400">
                  <RotateCcw size={14} />
                </button>
              </motion.div>
            )}

            {imageState === "success" && (
              <IngestSuccess
                label="Image OCR & ingested"
                result={imageResult}
                onQuery={() => switchTab("query")}
                onReset={resetImage}
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
            <p className="text-sm text-gray-600">
              Fetch messages from a Slack channel — the IngestionAgent extracts decisions
              and stores them in Neo4j + ChromaDB.
            </p>

            {/* Form card */}
            <div className="glass-card rounded-xl border border-[var(--card-border)] p-6 space-y-5">

              {/* Channel ID */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Channel ID
                </label>
                <div className="relative">
                  <Hash
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                  <input
                    value={channelId}
                    onChange={(e) => setChannelId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSlackIngest()}
                    placeholder="C0123456789"
                    disabled={slackState === "loading" || slackState === "success"}
                    className="w-full bg-transparent border border-gray-200 rounded-lg pl-8 pr-4 py-2.5 text-gray-900 placeholder:text-gray-500 outline-none text-sm focus:border-blue-500 transition-colors disabled:opacity-50"
                  />
                </div>
                <p className="text-xs text-gray-600">
                  Find it in Slack: right-click channel → View channel details → Channel ID at the bottom.
                </p>
              </div>

              {/* Message limit */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Message Limit
                  </label>
                  <span className="text-xs font-mono text-blue-600">{msgLimit}</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={500}
                  step={10}
                  value={msgLimit}
                  onChange={(e) => setMsgLimit(Number(e.target.value))}
                  disabled={slackState === "loading" || slackState === "success"}
                  className="w-full accent-blue-500 disabled:opacity-50"
                />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>10</span>
                  <span>500</span>
                </div>
              </div>

              {/* Ingest button */}
              {slackState !== "success" && (
                <button
                  onClick={handleSlackIngest}
                  disabled={!channelId.trim() || slackState === "loading"}
                  className="w-full py-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-base font-bold transition-colors flex items-center justify-center gap-3 shadow-xl border border-blue-500"
                >
                  {slackState === "loading" ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Fetching & ingesting…
                    </>
                  ) : (
                    <>
                      <MessageSquare size={20} />
                      Ingest Channel
                    </>
                  )}
                </button>
              )}

              {/* Progress bar */}
              {slackState === "loading" && (
                <div className="w-full h-1 rounded-full bg-blue-100 overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-500 rounded-full"
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
                onQuery={() => switchTab("query")}
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
