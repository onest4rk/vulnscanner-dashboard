"use client";

import { useState, useEffect } from "react";

interface Target {
  id: string;
  name: string;
  target: string;
  environment: string;
  owner: string;
  tags: string;
  notes: string;
  scanFrequency: string;
  enabled: boolean;
}

export default function TargetsPage() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Target | null>(null);
  const [form, setForm] = useState({
    name: "",
    target: "",
    environment: "DEV",
    owner: "",
    tags: "",
    notes: "",
    scanFrequency: "",
  });

  async function loadTargets() {
    setLoading(true);
    const res = await fetch("/api/targets");
    if (res.ok) {
      const data = await res.json();
      setTargets(data.targets);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadTargets();
  }, []);

  function resetForm() {
    setForm({
      name: "",
      target: "",
      environment: "DEV",
      owner: "",
      tags: "",
      notes: "",
      scanFrequency: "",
    });
    setEditing(null);
    setShowForm(false);
  }

  function editTarget(t: Target) {
    setForm({
      name: t.name,
      target: t.target,
      environment: t.environment,
      owner: t.owner,
      tags: t.tags,
      notes: t.notes,
      scanFrequency: t.scanFrequency,
    });
    setEditing(t);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editing ? `/api/targets?id=${editing.id}` : "/api/targets";
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      resetForm();
      loadTargets();
    }
  }

  async function deleteTarget(id: string) {
    if (!confirm("Delete this target?")) return;
    const res = await fetch(`/api/targets?id=${id}`, { method: "DELETE" });
    if (res.ok) loadTargets();
  }

  async function toggleTarget(id: string, enabled: boolean) {
    await fetch(`/api/targets?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    });
    loadTargets();
  }

  const envColors: Record<string, string> = {
    DEV: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    STAGING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    PRODUCTION: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Scan Targets</h1>
          <p className="text-slate-400 mt-1 text-sm">Manage targets for vulnerability scanning</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-all duration-150 shadow-lg shadow-accent/20"
        >
          Add Target
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-navy-800 rounded-xl border border-navy-500/30 p-6 space-y-4 shadow-card"
        >
          <h3 className="font-semibold text-slate-100">
            {editing ? "Edit Target" : "New Target"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-navy-900/50 border border-navy-500/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 text-slate-100 placeholder-slate-500 transition-all duration-150"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Target (IP, hostname, or CIDR)</label>
              <input
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-navy-900/50 border border-navy-500/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 text-slate-100 placeholder-slate-500 transition-all duration-150"
                placeholder="192.168.1.0/24"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Environment</label>
              <select
                value={form.environment}
                onChange={(e) => setForm({ ...form, environment: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-navy-900/50 border border-navy-500/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 text-slate-100 transition-all duration-150"
              >
                <option value="DEV">Development</option>
                <option value="STAGING">Staging</option>
                <option value="PRODUCTION">Production</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Owner</label>
              <input
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-navy-900/50 border border-navy-500/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 text-slate-100 placeholder-slate-500 transition-all duration-150"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Tags</label>
              <input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-navy-900/50 border border-navy-500/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 text-slate-100 placeholder-slate-500 transition-all duration-150"
                placeholder="comma, separated"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Scan Frequency</label>
              <input
                value={form.scanFrequency}
                onChange={(e) => setForm({ ...form, scanFrequency: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-navy-900/50 border border-navy-500/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 text-slate-100 placeholder-slate-500 transition-all duration-150"
                placeholder="0 0 * * *"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-navy-900/50 border border-navy-500/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 text-slate-100 placeholder-slate-500 transition-all duration-150"
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-all duration-150 shadow-lg shadow-accent/15"
            >
              {editing ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-navy-600/50 hover:bg-navy-600 text-slate-300 rounded-lg text-sm transition-all duration-150 border border-navy-500/20"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : targets.length === 0 ? (
        <div className="text-center py-12 bg-navy-800 rounded-xl border border-navy-500/30 shadow-card">
          <p className="text-slate-400">No targets configured</p>
          <p className="text-slate-600 text-sm mt-1">Click &quot;Add Target&quot; to get started</p>
        </div>
      ) : (
        <div className="bg-navy-800 rounded-xl border border-navy-500/30 overflow-hidden shadow-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-500/20 text-left text-xs text-slate-500 uppercase tracking-wider">
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Target</th>
                <th className="p-4 font-medium">Environment</th>
                <th className="p-4 font-medium">Owner</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {targets.map((t) => (
                <tr key={t.id} className="border-b border-navy-500/10 hover:bg-navy-600/20 transition-colors">
                  <td className="p-4 font-medium text-slate-200">{t.name}</td>
                  <td className="p-4 text-sm text-slate-400 font-mono">{t.target}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${envColors[t.environment] || ""}`}>
                      {t.environment}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-400">{t.owner}</td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleTarget(t.id, t.enabled)}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                        t.enabled
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                      }`}
                    >
                      {t.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => editTarget(t)}
                        className="text-xs text-accent hover:text-blue-400 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTarget(t.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
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
