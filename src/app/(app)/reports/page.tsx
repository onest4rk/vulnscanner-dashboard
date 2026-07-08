"use client";

import { useState, useEffect } from "react";

interface Report {
  id: string;
  name: string;
  data: string;
  format: string;
  createdAt: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);

  async function loadReports() {
    setLoading(true);
    const res = await fetch("/api/reports");
    if (res.ok) {
      const data = await res.json();
      setReports(data.reports);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadReports();
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setGenerating(true);
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) {
      setName("");
      setShowForm(false);
      loadReports();
    }
    setGenerating(false);
  }

  async function handleExport(report: Report, format: "json" | "csv") {
    setExportingId(report.id);
    const data = JSON.parse(report.data);
    let content: string;
    let mime: string;
    let ext: string;

    if (format === "json") {
      content = JSON.stringify(data, null, 2);
      mime = "application/json";
      ext = "json";
    } else {
      const headers = Object.keys(data.findings?.[0] || data);
      const rows = (data.findings || []).map((row: Record<string, unknown>) =>
        headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")
      );
      content = [headers.join(","), ...rows].join("\n");
      mime = "text/csv";
      ext = "csv";
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.name.replace(/\s+/g, "_")}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    setExportingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this report?")) return;
    const res = await fetch(`/api/reports?id=${id}`, { method: "DELETE" });
    if (res.ok) loadReports();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-slate-400 mt-1">
            Saved report snapshots and exports
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-accent hover:bg-accent-hover rounded-lg text-sm font-medium transition-colors"
        >
          Generate Report
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleGenerate}
          className="bg-navy-800 rounded-xl border border-navy-500/30 p-6 space-y-4"
        >
          <h3 className="font-semibold">Generate New Report</h3>
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Report Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-navy-700/50 border border-navy-500/40 rounded-lg text-slate-100"
              placeholder="e.g. Weekly Security Summary"
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={generating}
              className="px-4 py-2 bg-accent hover:bg-accent-hover rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {generating ? "Generating..." : "Generate"}
            </button>
            <button
              type="button"
              onClick={() => {
                setName("");
                setShowForm(false);
              }}
              className="px-4 py-2 bg-navy-700/50 hover:bg-navy-600/50 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 bg-navy-800 rounded-xl border border-navy-500/30">
          <p className="text-slate-400">No reports saved yet</p>
          <p className="text-slate-600 text-sm mt-1">
            Generate a report to create a snapshot of findings
          </p>
        </div>
      ) : (
        <div className="bg-navy-800 rounded-xl border border-navy-500/30 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-500/30 text-left text-sm text-slate-400">
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Format</th>
                <th className="p-4 font-medium">Created</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-navy-500/30/50 hover:bg-navy-700/50/30"
                >
                  <td className="p-4 font-medium">{r.name}</td>
                  <td className="p-4 text-sm text-slate-400 uppercase">
                    {r.format}
                  </td>
                  <td className="p-4 text-sm text-slate-400">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleExport(r, "json")}
                        disabled={exportingId === r.id}
                        className="text-xs px-3 py-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors disabled:opacity-50"
                      >
                        JSON
                      </button>
                      <button
                        onClick={() => handleExport(r, "csv")}
                        disabled={exportingId === r.id}
                        className="text-xs px-3 py-1 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors disabled:opacity-50"
                      >
                        CSV
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-xs px-3 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
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
