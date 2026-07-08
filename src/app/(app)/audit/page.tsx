"use client";

import { useState, useEffect } from "react";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  ipAddress: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

interface AuditResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

const ACTIONS = [
  "",
  "CREATE_TARGET",
  "UPDATE_TARGET",
  "DELETE_TARGET",
  "CREATE_SCAN_JOB",
  "TRIGGER_SCAN",
  "UPDATE_FINDING",
  "LOGIN",
  "LOGOUT",
];

export default function AuditPage() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  async function loadLogs() {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (actionFilter) params.set("action", actionFilter);

    const res = await fetch(`/api/audit?${params.toString()}`);
    if (res.ok) {
      setData(await res.json());
    }
    setLoading(false);
  }

  useEffect(() => {
    loadLogs();
  }, [page, actionFilter]);

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-slate-400 mt-1">
          Track all actions and changes in the system
        </p>
      </div>

      <div className="flex gap-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Action</label>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-navy-700/50 border border-navy-500/40 rounded-lg text-slate-100 text-sm"
          >
            <option value="">All Actions</option>
            {ACTIONS.filter(Boolean).map((a) => (
              <option key={a} value={a}>
                {a.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : !data || data.logs.length === 0 ? (
        <div className="text-center py-12 bg-navy-800 rounded-xl border border-navy-500/30">
          <p className="text-slate-400">No audit logs found</p>
          <p className="text-slate-600 text-sm mt-1">
            Actions performed in the system will appear here
          </p>
        </div>
      ) : (
        <>
          <div className="bg-navy-800 rounded-xl border border-navy-500/30 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-navy-500/30 text-left text-sm text-slate-400">
                  <th className="p-4 font-medium">User</th>
                  <th className="p-4 font-medium">Action</th>
                  <th className="p-4 font-medium">Entity</th>
                  <th className="p-4 font-medium">Details</th>
                  <th className="p-4 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {data.logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-navy-500/30/50 hover:bg-navy-700/50/30"
                  >
                    <td className="p-4">
                      <div className="font-medium text-sm">
                        {log.user.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {log.user.email}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-500/10 text-indigo-400">
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-400">
                      {log.entity}
                      {log.entityId && (
                        <div className="text-xs font-mono text-slate-600 truncate max-w-[120px]">
                          {log.entityId}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-sm text-slate-300 max-w-xs truncate">
                      {log.details || "-"}
                    </td>
                    <td className="p-4 text-sm text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Page {data.page} of {totalPages} ({data.total} total)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 bg-navy-700/50 hover:bg-navy-600/50 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 bg-navy-700/50 hover:bg-navy-600/50 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
