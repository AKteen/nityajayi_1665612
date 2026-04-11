"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        }
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to authentication service");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20 bg-gradient-to-b from-blue-50 via-white to-cyan-50">
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3], rotate: [0, 180, 360] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(6, 182, 212, 0.1) 30%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-card rounded-3xl p-10 border-2 border-blue-200 shadow-2xl max-w-md w-full relative z-10 bg-white/90 backdrop-blur-md"
      >
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 shadow-lg">
            <img src="/logo2.png" alt="Logo" className="w-10 h-10" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">Create Account</h1>
        <p className="text-center text-gray-600 mb-8">Join and start querying your knowledge</p>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-xl bg-green-50 border-2 border-green-200 text-center"
          >
            <p className="text-green-700 font-medium mb-2">Account created successfully!</p>
            <p className="text-green-600 text-sm">Redirecting to login...</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-blue-200 focus:border-blue-400 focus:outline-none transition-all bg-white/90"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-blue-200 focus:border-blue-400 focus:outline-none transition-all bg-white/90"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-blue-200 focus:border-blue-400 focus:outline-none transition-all bg-white/90"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-red-50 border-2 border-red-200 text-red-700 text-sm"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-bold text-base shadow-xl border-2 border-blue-400 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            >
              {loading ? "Creating account..." : "Sign Up"}
              {!loading && <ArrowRight size={18} />}
            </motion.button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-bold">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
