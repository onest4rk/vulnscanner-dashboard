"use client";

import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Stats {
  totalTargets: number;
  totalHosts: number;
  totalPorts: number;
  criticalFindings: number;
  scansToday: number;
}

interface SeverityItem {
  severity: string;
  count: number;
}

interface RecentScan {
  id: string;
  target: string;
  status: string;
  createdAt: string;
  duration: number | null;
}

const chartDefaults = {
  color: "#94a3b8",
  grid: { color: "rgba(51, 65, 85, 0.4)" },
};

export function DashboardClient({
  stats,
  severityData,
  recentScans,
}: {
  stats: Stats;
  severityData: SeverityItem[];
  recentScans: RecentScan[];
}) {
  const severityChart = {
    labels: severityData.map((s) => s.severity),
    datasets: [
      {
        label: "Findings",
        data: severityData.map((s) => s.count),
        backgroundColor: [
          "#ef4444",
          "#f97316",
          "#eab308",
          "#22c55e",
          "#64748b",
        ],
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  };

  const trendChart = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "Scans",
        data: [4, 7, 5, 9],
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.08)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#3b82f6",
        pointBorderColor: "#1e293b",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const portServiceChart = {
    labels: ["HTTP", "HTTPS", "SSH", "MySQL", "Other"],
    datasets: [
      {
        label: "Ports",
        data: [23, 18, 12, 8, 27],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(99, 102, 241, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(234, 179, 8, 0.8)",
          "rgba(100, 116, 139, 0.8)",
        ],
        borderWidth: 0,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { color: "#94a3b8", padding: 16, usePointStyle: true, pointStyle: "circle" as const },
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-slate-400 mt-1 text-sm">Security posture overview</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-navy-700/50 px-3 py-1.5 rounded-lg border border-navy-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          All systems operational
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Targets" value={stats.totalTargets} color="blue" />
        <StatCard label="Hosts Up" value={stats.totalHosts} color="green" />
        <StatCard label="Open Ports" value={stats.totalPorts} color="yellow" />
        <StatCard label="Critical Findings" value={stats.criticalFindings} color="red" />
        <StatCard label="Scans Today" value={stats.scansToday} color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-navy-800 rounded-xl border border-navy-500/30 p-6 shadow-card">
          <h3 className="text-base font-semibold text-slate-100 mb-4">Findings by Severity</h3>
          <div className="h-64">
            <Doughnut data={severityChart} options={chartOptions} />
          </div>
        </div>

        <div className="bg-navy-800 rounded-xl border border-navy-500/30 p-6 shadow-card">
          <h3 className="text-base font-semibold text-slate-100 mb-4">Scan Trend</h3>
          <div className="h-64">
            <Line
              data={trendChart}
              options={{
                ...chartOptions,
                scales: {
                  x: {
                    ticks: { color: chartDefaults.color },
                    grid: { color: chartDefaults.grid.color },
                    border: { color: "rgba(51, 65, 85, 0.3)" },
                  },
                  y: {
                    ticks: { color: chartDefaults.color },
                    grid: { color: chartDefaults.grid.color },
                    border: { color: "rgba(51, 65, 85, 0.3)" },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="bg-navy-800 rounded-xl border border-navy-500/30 p-6 shadow-card">
          <h3 className="text-base font-semibold text-slate-100 mb-4">Open Ports by Service</h3>
          <div className="h-64">
            <Bar
              data={portServiceChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: "y" as const,
                scales: {
                  x: {
                    ticks: { color: chartDefaults.color },
                    grid: { color: chartDefaults.grid.color },
                    border: { color: "rgba(51, 65, 85, 0.3)" },
                  },
                  y: {
                    ticks: { color: chartDefaults.color },
                    grid: { display: false },
                    border: { color: "rgba(51, 65, 85, 0.3)" },
                  },
                },
                plugins: { legend: { display: false } },
              }}
            />
          </div>
        </div>

        <div className="bg-navy-800 rounded-xl border border-navy-500/30 p-6 shadow-card">
          <h3 className="text-base font-semibold text-slate-100 mb-4">Recent Scans</h3>
          <div className="space-y-1">
            {recentScans.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No scans recorded yet</p>
            ) : (
              recentScans.map((scan) => (
                <div
                  key={scan.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-navy-600/30 transition-colors -mx-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      scan.status === "COMPLETED" ? "bg-green-500" :
                      scan.status === "RUNNING" ? "bg-blue-500 animate-pulse" :
                      scan.status === "FAILED" ? "bg-red-500" :
                      "bg-slate-500"
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-slate-200">{scan.target}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(scan.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={scan.status} />
                    {scan.duration && (
                      <span className="text-xs text-slate-500 font-mono">{scan.duration}s</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "blue" | "green" | "yellow" | "red" | "indigo";
}) {
  const colors = {
    blue: "from-blue-500/10 to-blue-600/5 border-blue-500/20",
    green: "from-green-500/10 to-green-600/5 border-green-500/20",
    yellow: "from-yellow-500/10 to-yellow-600/5 border-yellow-500/20",
    red: "from-red-500/10 to-red-600/5 border-red-500/20",
    indigo: "from-indigo-500/10 to-indigo-600/5 border-indigo-500/20",
  };

  const textColors = {
    blue: "text-blue-400",
    green: "text-green-400",
    yellow: "text-yellow-400",
    red: "text-red-400",
    indigo: "text-indigo-400",
  };

  return (
    <div className={`rounded-xl border bg-gradient-to-br ${colors[color]} p-4 shadow-card transition-all duration-150 hover:shadow-card-hover`}>
      <p className={`text-3xl font-bold tracking-tight ${textColors[color]}`}>{value}</p>
      <p className="text-sm text-slate-400 mt-1.5">{label}</p>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    RUNNING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    COMPLETED: "bg-green-500/10 text-green-400 border-green-500/20",
    FAILED: "bg-red-500/10 text-red-400 border-red-500/20",
    CANCELLED: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };

  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
        styles[status] || "bg-slate-500/10 text-slate-400 border-slate-500/20"
      }`}
    >
      {status}
    </span>
  );
}
