"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface HostResult {
  id: string;
  ip: string;
  hostname: string;
  status: string;
  osGuess: string;
  ports: PortResult[];
}

interface PortResult {
  id: string;
  port: number;
  protocol: string;
  state: string;
  service: string;
  banner: string;
  version: string;
}

interface FindingResult {
  id: string;
  title: string;
  description: string;
  severity: string;
  cvss: number | null;
  status: string;
  remediation: string;
}

interface ScanRunDetail {
  id: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  duration: number | null;
  rawOutput: string;
  exitCode: number | null;
  errorLog: string;
  createdAt: string;
  updatedAt: string;
  job: {
    id: string;
    cronExpr: string;
    scheduled: boolean;
    priority: number;
    target: {
      id: string;
      name: string;
      target: string;
      environment: string;
      owner: string;
    };
  };
  hosts: HostResult[];
  findings: FindingResult[];
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-500/10 text-yellow-400",
    RUNNING: "bg-blue-500/10 text-blue-400",
    COMPLETED: "bg-green-500/10 text-green-400",
    FAILED: "bg-red-500/10 text-red-400",
    CANCELLED: "bg-slate-500/10 text-slate-400",
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

export default function ScanDetailPage() {
  const params = useParams();
  const [scan, setScan] = useState<ScanRunDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedHost, setExpandedHost] = useState<string | null>(null);
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "hosts" | "findings" | "raw">("overview");

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/scans?id=${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setScan(data.scan);
      }
      setLoading(false);
    }
    load();
  }, [params.id]);

  if (loading) {
    return <div className="text-center py-12 text-slate-500">Loading scan details...</div>;
  }

  if (!scan) {
    return (
      <div className="text-center py-12 bg-navy-800 rounded-xl border border-navy-500/30">
        <p className="text-slate-400">Scan run not found</p>
      </div>
    );
  }

  const target = scan.job.target;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{target.name}</h1>
        <p className="text-slate-400 mt-1 font-mono text-sm">{target.target}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-navy-800 rounded-xl border border-navy-500/30 p-4">
          <p className="text-sm text-slate-400">Status</p>
          <div className="mt-1">
            <StatusBadge status={scan.status} />
          </div>
        </div>
        <div className="bg-navy-800 rounded-xl border border-navy-500/30 p-4">
          <p className="text-sm text-slate-400">Duration</p>
          <p className="text-xl font-bold text-slate-100">
            {scan.duration ? `${scan.duration}s` : "-"}
          </p>
        </div>
        <div className="bg-navy-800 rounded-xl border border-navy-500/30 p-4">
          <p className="text-sm text-slate-400">Started</p>
          <p className="text-sm text-slate-100">
            {scan.startedAt
              ? new Date(scan.startedAt).toLocaleString()
              : "-"}
          </p>
        </div>
        <div className="bg-navy-800 rounded-xl border border-navy-500/30 p-4">
          <p className="text-sm text-slate-400">Hosts Found</p>
          <p className="text-xl font-bold text-slate-100">{scan.hosts.length}</p>
        </div>
      </div>

      <div className="bg-navy-800 rounded-xl border border-navy-500/30 overflow-hidden">
        <div className="flex border-b border-navy-500/30">
          {(["overview", "hosts", "findings", "raw"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium transition-colors capitalize ${
                tab === t
                  ? "text-accent border-b-2 border-accent"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t === "raw" ? "Raw Output" : t}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === "overview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Environment</p>
                  <p className="text-slate-100">{target.environment}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Owner</p>
                  <p className="text-slate-100">{target.owner || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Cron Expression</p>
                  <p className="text-slate-100 font-mono">
                    {scan.job.cronExpr || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Priority</p>
                  <p className="text-slate-100">{scan.job.priority}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Exit Code</p>
                  <p className="text-slate-100 font-mono">
                    {scan.exitCode !== null ? scan.exitCode : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Created</p>
                  <p className="text-slate-100">
                    {new Date(scan.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {scan.errorLog && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Error Log</p>
                  <pre className="bg-slate-950 rounded-lg p-4 text-sm text-red-400 overflow-x-auto whitespace-pre-wrap font-mono">
                    {scan.errorLog}
                  </pre>
                </div>
              )}
            </div>
          )}

          {tab === "hosts" && (
            <div className="space-y-3">
              {scan.hosts.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No hosts found</p>
              ) : (
                scan.hosts.map((host) => (
                  <div
                    key={host.id}
                    className="border border-navy-500/30 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedHost(
                          expandedHost === host.id ? null : host.id
                        )
                      }
                      className="w-full flex items-center justify-between p-4 hover:bg-navy-700/50/30 transition-colors text-left"
                    >
                      <div>
                        <span className="font-mono font-medium">
                          {host.ip}
                        </span>
                        {host.hostname && (
                          <span className="text-slate-400 text-sm ml-2">
                            ({host.hostname})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {host.osGuess && (
                          <span className="text-xs text-slate-500">
                            {host.osGuess}
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          {host.ports.length} ports
                        </span>
                        <svg
                          className={`w-4 h-4 text-slate-500 transition-transform ${
                            expandedHost === host.id ? "rotate-180" : ""
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
                    {expandedHost === host.id && (
                      <div className="border-t border-navy-500/30 p-4">
                        {host.ports.length === 0 ? (
                          <p className="text-slate-500 text-sm">
                            No open ports
                          </p>
                        ) : (
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-slate-400">
                                <th className="pb-2 font-medium">Port</th>
                                <th className="pb-2 font-medium">Protocol</th>
                                <th className="pb-2 font-medium">State</th>
                                <th className="pb-2 font-medium">Service</th>
                                <th className="pb-2 font-medium">Version</th>
                              </tr>
                            </thead>
                            <tbody>
                              {host.ports.map((p) => (
                                <tr key={p.id} className="border-t border-navy-500/30/50">
                                  <td className="py-2 font-mono">{p.port}</td>
                                  <td className="py-2 text-slate-400">{p.protocol}</td>
                                  <td className="py-2">
                                    <span className="text-green-400">
                                      {p.state}
                                    </span>
                                  </td>
                                  <td className="py-2">{p.service}</td>
                                  <td className="py-2 text-slate-400">{p.version}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "findings" && (
            <div className="space-y-3">
              {scan.findings.length === 0 ? (
                <p className="text-slate-500 text-center py-8">
                  No findings detected
                </p>
              ) : (
                scan.findings.map((f) => (
                  <div
                    key={f.id}
                    className="border border-navy-500/30 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedFinding(
                          expandedFinding === f.id ? null : f.id
                        )
                      }
                      className="w-full flex items-center justify-between p-4 hover:bg-navy-700/50/30 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <SeverityBadge severity={f.severity} />
                        <span className="font-medium">{f.title}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={f.status} />
                        <svg
                          className={`w-4 h-4 text-slate-500 transition-transform ${
                            expandedFinding === f.id ? "rotate-180" : ""
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
                    {expandedFinding === f.id && (
                      <div className="border-t border-navy-500/30 p-4 space-y-3">
                        {f.description && (
                          <div>
                            <p className="text-sm text-slate-400 mb-1">
                              Description
                            </p>
                            <p className="text-sm text-slate-200">
                              {f.description}
                            </p>
                          </div>
                        )}
                        {f.remediation && (
                          <div>
                            <p className="text-sm text-slate-400 mb-1">
                              Remediation
                            </p>
                            <p className="text-sm text-green-300">
                              {f.remediation}
                            </p>
                          </div>
                        )}
                        {f.cvss !== null && (
                          <div>
                            <p className="text-sm text-slate-400 mb-1">CVSS</p>
                            <p className="text-lg font-bold text-slate-100">
                              {f.cvss.toFixed(1)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "raw" && (
            <div>
              <pre className="bg-slate-950 rounded-lg p-4 text-sm text-slate-300 overflow-x-auto whitespace-pre-wrap font-mono max-h-[600px] overflow-y-auto">
                {scan.rawOutput || "No raw output available"}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
