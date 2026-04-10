"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Search, Zap, FileText, Mail } from "lucide-react";
import { getActivityFeed, type ActivityEvent } from "@/lib/api";

const eventMeta: Record<ActivityEvent["type"], { icon: React.ElementType; badgeClass: string; label: string }> = {
  slack: { icon: MessageSquare, badgeClass: "badge-slack", label: "Slack" },
  gmail: { icon: Mail, badgeClass: "badge-query", label: "Gmail" },
  query: { icon: Search, badgeClass: "badge-query", label: "Query" },
  impact: { icon: Zap, badgeClass: "badge-impact", label: "Impact" },
  ingest: { icon: FileText, badgeClass: "badge-chroma", label: "Ingest" },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export default function ActivityPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    getActivityFeed().then(setEvents);
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10"
      >
        <h1 className="text-2xl font-bold text-white mb-1">Activity Feed</h1>
        <p className="text-sm text-[var(--muted)]">
          Recent ingestions, queries, and AI agent activity.
        </p>
      </motion.div>

      <div className="relative">
        {/* Timeline vertical line */}
        <div className="absolute left-5 top-0 bottom-0 w-px timeline-line" />

        <div className="space-y-1">
          {events.map((event, i) => {
            const meta = eventMeta[event.type];
            const Icon = meta.icon;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="relative flex gap-5 pb-8"
              >
                {/* Icon dot */}
                <div className="relative z-10 shrink-0 w-10 h-10 rounded-full glass-card border border-[var(--card-border)] flex items-center justify-center">
                  <Icon size={15} className="text-[var(--muted)]" />
                </div>

                {/* Content */}
                <div className="flex-1 glass-card rounded-xl p-4 border border-[var(--card-border)] hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${meta.badgeClass}`}>
                        {meta.label}
                      </span>
                      <span className="text-sm font-medium text-white">{event.title}</span>
                    </div>
                    <span className="text-xs text-[var(--muted)] shrink-0">{timeAgo(event.timestamp)}</span>
                  </div>
                  <p className="text-xs text-[var(--muted)]">{event.description}</p>
                  {event.source && (
                    <p className="text-xs text-indigo-400/70 mt-1 font-mono">{event.source}</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {events.length === 0 && (
        <div className="text-center text-[var(--muted)] text-sm py-20">
          No activity yet. Start by querying or ingesting data.
        </div>
      )}
    </div>
  );
}
