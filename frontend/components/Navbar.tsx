"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Brain, Activity, Search } from "lucide-react";
import { motion } from "framer-motion";
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
    <nav className="fixed top-0 left-0 right-0 z-50 border-b-2 border-orange-200 glass-card shadow-lg">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 font-bold text-base group">
          <motion.div
            whileHover={{ rotate: 360, scale: 1.3 }}
            transition={{ duration: 0.6 }}
            className="p-2 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 shadow-md"
          >
            <Brain size={22} className="text-orange-600" />
          </motion.div>
          <span className="text-gray-900 group-hover:text-orange-600 transition-colors text-lg">Recall.ai</span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                path === href ? "active bg-gradient-to-r from-orange-100 to-amber-100 text-gray-900 shadow-md" : ""
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3 text-sm bg-white/80 px-4 py-2 rounded-full shadow-md border-2 border-orange-200">
          <motion.span
            animate={healthy ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            className={`w-3 h-3 rounded-full ${
              healthy === null
                ? "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.6)]"
                : healthy
                ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.7)]"
                : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]"
            }`}
          />
          <span className="text-gray-700 font-medium">
            {healthy === null ? "checking…" : healthy ? "API online" : "API offline"}
          </span>
        </div>
      </div>
    </nav>
  );
}
