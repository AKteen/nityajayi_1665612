"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MessageSquare, Mail, GitBranch, Brain, ArrowRight, Zap } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Slack Memory",
    description: "Ingest channel conversations and extract structured decisions, people, and context automatically.",
    color: "text-orange-600",
    border: "hover:border-orange-400",
    glow: "hover:shadow-orange-400/20",
  },
  {
    icon: Mail,
    title: "Gmail Context",
    description: "Connect email threads to decisions. Surface who said what and when across your organization.",
    color: "text-blue-600",
    border: "hover:border-blue-400",
    glow: "hover:shadow-blue-400/20",
  },
  {
    icon: GitBranch,
    title: "Knowledge Graph",
    description: "Neo4j-powered decision graph. Understand relationships, dependencies, and impact chains.",
    color: "text-green-600",
    border: "hover:border-green-400",
    glow: "hover:shadow-green-400/20",
  },
  {
    icon: Brain,
    title: "AI Reasoning",
    description: "LangGraph agents route queries to the right tool — QUERY for history, IMPACT for what-if analysis.",
    color: "text-purple-600",
    border: "hover:border-purple-400",
    glow: "hover:shadow-purple-400/20",
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
          animate={{ 
            scale: [1, 1.3, 1], 
            opacity: [0.3, 0.6, 0.3],
            rotate: [0, 360]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-32 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, #FFD4B060 0%, #FF9A5640 20%, #FFB88C30 40%, #FFA50020 60%, transparent 80%)",
            filter: "blur(80px)",
          }}
        />
        
        {/* Additional floating orbs */}
        <motion.div
          animate={{ 
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-20 top-40 w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, #A8DAFF40 0%, #6B9BD130 50%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        <div className="relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.08, rotate: [0, -2, 2, 0] }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-orange-400 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 text-xs mb-6 cursor-default shadow-lg"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Zap size={11} />
            </motion.div>
            Powered by LangGraph + Groq llama-3.3-70b
          </motion.div>

          <motion.h1 
            className="text-5xl font-bold tracking-tight text-gray-900 mb-4 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.span
              whileHover={{ scale: 1.05, display: "inline-block" }}
              className="inline-block"
            >
              Organizational Memory
            </motion.span>
            <br />
            <motion.span 
              className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 bg-clip-text text-transparent"
              animate={{ 
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 5, repeat: Infinity }}
              style={{ backgroundSize: "200% 200%" }}
              whileHover={{ scale: 1.05, display: "inline-block" }}
            >
              & Reasoning Engine
            </motion.span>
          </motion.h1>

          <motion.p 
            className="text-gray-700 text-lg max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02, color: "#2D2416" }}
          >
            Query your company&apos;s institutional knowledge. Understand why decisions were made,
            who was involved, and what breaks if things change.
          </motion.p>

          <motion.div 
            className="flex items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/query"
                className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 hover:from-orange-400 hover:via-amber-400 hover:to-orange-300 text-white text-base font-bold transition-all sunrise-glow group relative overflow-hidden shadow-2xl"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6 }}
                />
                <span className="relative z-10">Start Querying</span>
                <motion.div
                  className="relative z-10"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </motion.div>
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/activity"
                className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl border-3 border-orange-400 hover:border-orange-500 bg-white/90 hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 text-gray-800 hover:text-orange-700 text-base font-bold transition-all relative overflow-hidden group shadow-xl"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-orange-400/0 via-orange-400/20 to-orange-400/0"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.8 }}
                />
                <span className="relative z-10">View Activity</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Feature Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {features.map(({ icon: Icon, title, description, color, border, glow }, index) => (
          <motion.div
            key={title}
            variants={item}
            whileHover={{ scale: 1.06, y: -10, rotateY: 3 }}
            whileTap={{ scale: 0.98 }}
            className={`glass-card rounded-2xl p-8 border-2 border-[var(--card-border)] ${border} hover:shadow-2xl ${glow} transition-all duration-300 cursor-pointer group relative overflow-hidden`}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Animated background gradient on hover */}
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${color.includes('orange') ? 'rgba(255, 154, 86, 0.15)' : color.includes('blue') ? 'rgba(107, 155, 209, 0.15)' : color.includes('green') ? 'rgba(72, 187, 120, 0.15)' : 'rgba(167, 139, 250, 0.15)'}, transparent 70%)`,
              }}
            />
            
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />

            <div className="flex items-start gap-4 relative z-10">
              <motion.div 
                className={`p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 shrink-0 group-hover:from-orange-100 group-hover:to-amber-100 transition-all border-2 border-transparent group-hover:${border} shadow-md`}
                whileHover={{ rotate: [0, -20, 20, -20, 0], scale: 1.15 }}
                transition={{ duration: 0.6 }}
              >
                <Icon size={28} className={`${color} group-hover:drop-shadow-[0_0_12px_currentColor]`} />
              </motion.div>
              <div>
                <motion.h3 
                  className="font-semibold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors text-base"
                  whileHover={{ x: 5 }}
                >
                  {title}
                </motion.h3>
                <motion.p 
                  className="text-sm text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors"
                  initial={{ opacity: 0.8 }}
                  whileHover={{ opacity: 1 }}
                >
                  {description}
                </motion.p>
              </div>
            </div>

            {/* Corner accent */}
            <motion.div
              className={`absolute top-0 right-0 w-20 h-20 ${color} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-500`}
            />
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
          { label: "Data Sources", value: "4", color: "from-green-400 to-emerald-500" },
          { label: "Agent Types", value: "2", color: "from-orange-400 to-amber-500" },
          { label: "LLM", value: "Llama 3.3", color: "from-blue-400 to-cyan-500" },
        ].map(({ label, value, color }, i) => (
          <motion.div 
            key={label} 
            className="glass-card rounded-2xl p-8 border-2 border-[var(--card-border)] hover:border-orange-400 transition-all duration-300 cursor-pointer group relative overflow-hidden shadow-lg"
            whileHover={{ scale: 1.1, y: -10, rotateZ: [0, -2, 2, 0] }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + i * 0.1 }}
          >
            {/* Animated gradient background */}
            <motion.div
              className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
            />
            
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.6 }}
            />

            <motion.div 
              className={`text-4xl font-black bg-gradient-to-br ${color} bg-clip-text text-transparent mb-3 relative z-10`}
              whileHover={{ scale: 1.2, rotate: [0, -8, 8, 0] }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              {value}
            </motion.div>
            <motion.div 
              className="text-xs text-gray-600 group-hover:text-orange-600 transition-colors uppercase tracking-wider font-medium relative z-10"
              whileHover={{ y: -2 }}
            >
              {label}
            </motion.div>

            {/* Corner glow */}
            <motion.div
              className={`absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr ${color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
