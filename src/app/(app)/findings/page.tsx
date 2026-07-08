"use client";

import { useState, useEffect } from "react";

interface Finding {
  id: string;
  title: string;
  description: string;
  severity: string;
  cvss: number | null;
  status: string;
  remediation: string;
  pluginId: string;
  pluginName: string;
  createdAt: string;
  updatedAt: string;
  scanRunId: string;
  targetName: string;
  targetId: string;
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    CRITICAL: "bg-red-500/10 text-red-400",
    HIGH: "bg-orange-500/10 text-orange-400",
    MEDIUM: "bg-yellow-500/10 text-yellow-400",
    LOW: "bg-green-500/10 text-green-400",
    NONE: "bg-slate-500/10 text-slate-400",
  };

  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        styles[severity] || "bg-slate-500/10 text-slate-400"
      }`}
    >
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    OPEN: "bg-red-500/10 text-red-400",
    IN_PROGRESS: "bg-blue-500/10 text-blue-400",
    REMEDIATED: "bg-green-500/10 text-green-400",
    ACCEPTED_RISK: "bg-yellow-500/10 text-yellow-400",
    FALSE_POSITIVE: "bg-slate-500/10 text-slate-400",
  };

  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        styles[status] || "bg-slate-500/10 text-slate-400"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

const STATUS_OPTIONS = [
  "OPEN",
  "IN_PROGRESS",
  "REMEDIATED",
  "ACCEPTED_RISK",
  "FALSE_POSITIVE",
];

const SEVERITIES = ["", "CRITICAL", "HIGH", "MEDIUM", "LOW", "NONE"];

export default function FindingsPage() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadFindings() {
    setLoading(true);
    const params = new URLSearchParams();
    if (severityFilter) params.set("severity", severityFilter);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/findings?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setFindings(data.findings);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadFindings();
  }, [severityFilter, statusFilter]);

  async function handleStatusChange(findingId: string, newStatus: string) {
    setUpdatingId(findingId);
    const res = await fetch(`/api/findings?id=${findingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) loadFindings();
    setUpdatingId(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Findings</h1>
        <p className="text-slate-400 mt-1">
          Vulnerability findings across all targets
        </p>
      </div>

      <div className="flex gap-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Severity</label>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 bg-navy-700/50 border border-navy-500/40 rounded-lg text-slate-100 text-sm"
          >
            <option value="">All</option>
            {SEVERITIES.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-navy-700/50 border border-navy-500/40 rounded-lg text-slate-100 text-sm"
          >
            <option value="">All</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : findings.length === 0 ? (
        <div className="text-center py-12 bg-navy-800 rounded-xl border border-navy-500/30">
          <p className="text-slate-400">No findings match your filters</p>
          <p className="text-slate-600 text-sm mt-1">
            Run a scan to discover vulnerabilities
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {findings.map((f) => (
            <div
              key={f.id}
              className="bg-navy-800 rounded-xl border border-navy-500/30 overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedId(expandedId === f.id ? null : f.id)
                }
                className="w-full flex items-center justify-between p-4 hover:bg-navy-700/50/30 transition-colors text-left"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <SeverityBadge severity={f.severity} />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{f.title}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {f.targetName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={f.status} />
                  <span className="text-xs text-slate-500">
                    {new Date(f.createdAt).toLocaleDateString()}
                  </span>
                  <svg
                    className={`w-4 h-4 text-slate-500 transition-transform ${
                      expandedId === f.id ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>
              {expandedId === f.id && (
                <div className="border-t border-navy-500/30 p-4 space-y-4">
                  {f.description && (
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Description</p>
                      <p className="text-sm text-slate-200">{f.description}</p>
                    </div>
                  )}
                  {f.remediation && (
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Remediation</p>
                      <p className="text-sm text-green-300">{f.remediation}</p>
                    </div>
                  )}
                  {f.cvss !== null && (
                    <div>
                      <p className="text-sm text-slate-400 mb-1">CVSS Score</p>
                      <p className="text-lg font-bold text-slate-100">
                        {f.cvss.toFixed(1)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Status</p>
                    <select
                      value={f.status}
                      onChange={(e) => handleStatusChange(f.id, e.target.value)}
                      disabled={updatingId === f.id}
                      className="px-3 py-1.5 bg-navy-700/50 border border-navy-500/40 rounded-lg text-slate-100 text-sm"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
