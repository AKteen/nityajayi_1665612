"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MessageSquare, Mail, GitBranch, Brain, ArrowRight, Zap } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Slack Memory",
    description: "Ingest channel conversations and extract structured decisions, people, and context automatically.",
    color: "text-red-400",
    border: "hover:border-red-500/40",
    glow: "hover:shadow-red-500/10",
  },
  {
    icon: Mail,
    title: "Gmail Context",
    description: "Connect email threads to decisions. Surface who said what and when across your organization.",
    color: "text-blue-400",
    border: "hover:border-blue-500/40",
    glow: "hover:shadow-blue-500/10",
  },
  {
    icon: GitBranch,
    title: "Knowledge Graph",
    description: "Neo4j-powered decision graph. Understand relationships, dependencies, and impact chains.",
    color: "text-green-400",
    border: "hover:border-green-500/40",
    glow: "hover:shadow-green-500/10",
  },
  {
    icon: Brain,
    title: "AI Reasoning",
    description: "LangGraph agents route queries to the right tool — QUERY for history, IMPACT for what-if analysis.",
    color: "text-indigo-400",
    border: "hover:border-indigo-500/40",
    glow: "hover:shadow-indigo-500/10",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-20"
      >
        {/* Animated gradient orb */}
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-32 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, #6366f130 0%, #818cf810 40%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        <div className="relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs mb-6"
          >
            <Zap size={11} />
            Powered by LangGraph + Groq llama-3.3-70b
          </motion.div>

          <h1 className="text-5xl font-bold tracking-tight text-white mb-4 leading-tight">
            Organizational Memory
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              & Reasoning Engine
            </span>
          </h1>

          <p className="text-[var(--muted)] text-lg max-w-2xl mx-auto mb-8">
            Query your company&apos;s institutional knowledge. Understand why decisions were made,
            who was involved, and what breaks if things change.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/query"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors glow-indigo"
            >
              Start Querying
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/activity"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-[var(--card-border)] hover:border-indigo-500/40 text-[var(--muted)] hover:text-white text-sm font-medium transition-colors"
            >
              View Activity
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Feature Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {features.map(({ icon: Icon, title, description, color, border, glow }) => (
          <motion.div
            key={title}
            variants={item}
            className={`glass-card rounded-xl p-6 border border-[var(--card-border)] ${border} hover:shadow-lg ${glow} transition-all duration-300 cursor-default`}
          >
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-white/5 shrink-0">
                <Icon size={20} className={color} />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">{title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="mt-16 grid grid-cols-3 gap-4 text-center"
      >
        {[
          { label: "Data Sources", value: "4" },
          { label: "Agent Types", value: "2" },
          { label: "LLM", value: "Llama 3.3" },
        ].map(({ label, value }) => (
          <div key={label} className="glass-card rounded-xl p-5 border border-[var(--card-border)]">
            <div className="text-2xl font-bold text-white mb-1">{value}</div>
            <div className="text-xs text-[var(--muted)]">{label}</div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
