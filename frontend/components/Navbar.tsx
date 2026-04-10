"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Brain, Activity, Search } from "lucide-react";
import { checkHealth } from "@/lib/api";

export default function Navbar() {
  const path = usePathname();
  const [healthy, setHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    checkHealth().then(setHealthy);
  }, []);

  const links = [
    { href: "/", label: "Home", icon: Brain },
    { href: "/query", label: "Query", icon: Search },
    { href: "/activity", label: "Activity", icon: Activity },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--card-border)] glass-card">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-sm">
          <Brain size={18} className="text-indigo-400" />
          <span className="text-white">OrgMemory</span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                path === href ? "active bg-white/5 text-white" : ""
              }`}
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              healthy === null
                ? "bg-yellow-500"
                : healthy
                ? "bg-green-500"
                : "bg-red-500"
            }`}
          />
          <span className="text-[var(--muted)]">
            {healthy === null ? "checking…" : healthy ? "API online" : "API offline"}
          </span>
        </div>
      </div>
    </nav>
  );
}
