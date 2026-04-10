import { Zap, Search } from "lucide-react";

export default function AgentBadge({ agent }: { agent: "QUERY" | "IMPACT" }) {
  const isImpact = agent === "IMPACT";
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${
        isImpact ? "badge-impact" : "badge-query"
      }`}
    >
      {isImpact ? <Zap size={11} /> : <Search size={11} />}
      {isImpact ? "Impact Agent" : "Query Agent"}
    </span>
  );
}
