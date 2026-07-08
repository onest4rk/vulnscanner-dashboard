"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Login failed");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent pointer-events-none" />
      <div className="w-full max-w-md relative">
        <div className="p-8 bg-navy-800 rounded-2xl border border-navy-500/30 shadow-2xl shadow-black/30">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-accent to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent/20">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">VulnScanner</h1>
            <p className="text-slate-400 mt-2 text-sm">Sign in to your security dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-navy-900/50 border border-navy-500/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 text-slate-100 placeholder-slate-500 transition-all duration-150"
                placeholder="admin@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-navy-900/50 border border-navy-500/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 text-slate-100 placeholder-slate-500 transition-all duration-150"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-accent to-blue-600 hover:from-blue-600 hover:to-accent disabled:opacity-50 rounded-lg font-medium text-sm text-white shadow-lg shadow-accent/20 transition-all duration-150"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-slate-600 text-xs mt-6">
            Default: admin@example.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
}
