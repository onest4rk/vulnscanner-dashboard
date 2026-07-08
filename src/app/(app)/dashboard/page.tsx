import { DashboardClient } from "./client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [
    totalTargets,
    totalHosts,
    totalPorts,
    criticalFindings,
    scansToday,
    severityCounts,
    recentScans,
  ] = await Promise.all([
    prisma.scanTarget.count({ where: { deletedAt: null, enabled: true } }),
    prisma.hostResult.count(),
    prisma.portResult.count(),
    prisma.finding.count({ where: { severity: "CRITICAL", status: "OPEN" } }),
    prisma.scanRun.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.finding.groupBy({
      by: ["severity"],
      _count: true,
    }),
    prisma.scanRun.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        job: {
          include: { target: true },
        },
      },
    }),
  ]);

  const severityData = (severityCounts as Array<{ severity: string; _count: number }>).map((s) => ({
    severity: s.severity,
    count: s._count,
  }));

  const recentData = recentScans.map((r) => ({
    id: r.id,
    target: r.job.target.name,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    duration: r.duration,
  }));

  return (
    <DashboardClient
      stats={{
        totalTargets,
        totalHosts,
        totalPorts,
        criticalFindings,
        scansToday,
      }}
      severityData={severityData}
      recentScans={recentData}
    />
  );
}
