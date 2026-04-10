import { Database, Search, GitBranch } from "lucide-react";
import type { SourceTrace } from "@/lib/api";

const toolMeta: Record<string, { label: string; badgeClass: string; icon: React.ElementType }> = {
  search_decisions: { label: "Neo4j", badgeClass: "badge-neo4j", icon: GitBranch },
  search_raw_memory: { label: "ChromaDB", badgeClass: "badge-chroma", icon: Database },
  find_related_decisions: { label: "Neo4j Graph", badgeClass: "badge-neo4j", icon: GitBranch },
  find_decisions_by_person: { label: "Neo4j", badgeClass: "badge-neo4j", icon: GitBranch },
};

export default function SourceCard({ trace }: { trace: SourceTrace }) {
  const meta = toolMeta[trace.tool] ?? { label: trace.tool, badgeClass: "badge-chroma", icon: Search };
  const Icon = meta.icon;

  return (
    <div className="glass-card rounded-lg p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-[var(--muted)]" />
        <span className={`text-xs px-2 py-0.5 rounded-full border ${meta.badgeClass}`}>
          {meta.label}
        </span>
        <span className="text-xs text-[var(--muted)] font-mono">{trace.tool}</span>
      </div>
      {trace.args && Object.keys(trace.args).length > 0 && (
        <p className="text-xs text-[var(--muted)]">
          Query: <span className="text-[var(--foreground)]">{Object.values(trace.args)[0] as string}</span>
        </p>
      )}
      {trace.result_preview && (
        <p className="text-xs text-[var(--muted)] line-clamp-3 font-mono leading-relaxed">
          {trace.result_preview}
        </p>
      )}
    </div>
  );
}
