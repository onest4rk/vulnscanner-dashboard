"use client";

import { useState, useEffect } from "react";

interface Target {
  id: string;
  name: string;
  target: string;
}

interface ScanRun {
  id: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  duration: number | null;
  createdAt: string;
}

interface ScanJob {
  id: string;
  targetId: string;
  targetName: string;
  target: string;
  cronExpr: string;
  scheduled: boolean;
  status: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
  lastRun: ScanRun | null;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    RUNNING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    COMPLETED: "bg-green-500/10 text-green-400 border-green-500/20",
    FAILED: "bg-red-500/10 text-red-400 border-red-500/20",
    CANCELLED: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };

  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        styles[status] || "bg-slate-500/10 text-slate-400"
      }`}
    >
      {status}
    </span>
  );
}

export default function ScansPage() {
  const [scans, setScans] = useState<ScanJob[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    targetId: "",
    cronExpr: "",
    scheduled: false,
    priority: 0,
  });
  const [runningId, setRunningId] = useState<string | null>(null);

  async function loadScans() {
    setLoading(true);
    const res = await fetch("/api/scans");
    if (res.ok) {
      const data = await res.json();
      setScans(data.scans);
    }
    setLoading(false);
  }

  async function loadTargets() {
    const res = await fetch("/api/targets");
    if (res.ok) {
      const data = await res.json();
      setTargets(data.targets);
    }
  }

  useEffect(() => {
    loadScans();
    loadTargets();
  }, []);

  function resetForm() {
    setForm({ targetId: "", cronExpr: "", scheduled: false, priority: 0 });
    setShowForm(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      resetForm();
      loadScans();
    }
  }

  async function handleRunNow(jobId: string) {
    setRunningId(jobId);
    const res = await fetch(`/api/scans/run?jobId=${jobId}`, { method: "POST" });
    if (res.ok) loadScans();
    setRunningId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Scan Jobs</h1>
          <p className="text-slate-400 mt-1">Manage vulnerability scan jobs</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-accent hover:bg-accent-hover rounded-lg text-sm font-medium transition-colors"
        >
          New Scan
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-navy-800 rounded-xl border border-navy-500/30 p-6 space-y-4"
        >
          <h3 className="font-semibold">New Scan Job</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Target</label>
              <select
                value={form.targetId}
                onChange={(e) => setForm({ ...form, targetId: e.target.value })}
                className="w-full px-3 py-2 bg-navy-700/50 border border-navy-500/40 rounded-lg text-slate-100"
                required
              >
                <option value="">Select target...</option>
                {targets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.target})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Cron Expression
              </label>
              <input
                value={form.cronExpr}
                onChange={(e) => setForm({ ...form, cronExpr: e.target.value })}
                className="w-full px-3 py-2 bg-navy-700/50 border border-navy-500/40 rounded-lg text-slate-100"
                placeholder="0 0 * * *"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.scheduled}
                  onChange={(e) =>
                    setForm({ ...form, scheduled: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-navy-500/40 bg-navy-700/50 accent-accent"
                />
                Scheduled
              </label>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Priority (0-10)
              </label>
              <input
                type="number"
                min={0}
                max={10}
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 bg-navy-700/50 border border-navy-500/40 rounded-lg text-slate-100"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-accent hover:bg-accent-hover rounded-lg text-sm font-medium transition-colors"
            >
              Create
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-navy-700/50 hover:bg-navy-600/50 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : scans.length === 0 ? (
        <div className="text-center py-12 bg-navy-800 rounded-xl border border-navy-500/30">
          <p className="text-slate-400">No scan jobs configured</p>
          <p className="text-slate-600 text-sm mt-1">
            Create a scan job to start vulnerability scanning
          </p>
        </div>
      ) : (
        <div className="bg-navy-800 rounded-xl border border-navy-500/30 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-500/30 text-left text-sm text-slate-400">
                <th className="p-4 font-medium">Target</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Scheduled</th>
                <th className="p-4 font-medium">Priority</th>
                <th className="p-4 font-medium">Last Run</th>
                <th className="p-4 font-medium">Created</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-navy-500/30/50 hover:bg-navy-700/50/30"
                >
                  <td className="p-4">
                    <div className="font-medium">{s.targetName}</div>
                    <div className="text-xs text-slate-500 font-mono">
                      {s.target}
                    </div>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="p-4 text-sm text-slate-400">
                    {s.scheduled ? (
                      <span className="text-green-400">
                        {s.cronExpr || "Yes"}
                      </span>
                    ) : (
                      <span className="text-slate-500">Manual</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-slate-400">{s.priority}</td>
                  <td className="p-4 text-sm">
                    {s.lastRun ? (
                      <div>
                        <StatusBadge status={s.lastRun.status} />
                        {s.lastRun.duration && (
                          <span className="ml-2 text-slate-500">
                            {s.lastRun.duration}s
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-500">Never</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-slate-400">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleRunNow(s.id)}
                      disabled={runningId === s.id}
                      className="text-xs px-3 py-1 bg-accent/10 text-accent hover:bg-accent/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {runningId === s.id ? "Running..." : "Run Now"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
