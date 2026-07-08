import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, canViewReports } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!canViewReports(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reports = await prisma.reportSnapshot.findMany({
    where: { userId: session!.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      format: true,
      createdAt: true,
      data: true,
    },
  });

  return NextResponse.json({ reports });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!canViewReports(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name } = await request.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const findingStats = await prisma.finding.findMany({
      include: {
        scanRun: {
          include: {
            job: { include: { target: true } },
          },
        },
      },
    });

    const totalFindings = findingStats.length;
    const severityCounts: Record<string, number> = {};
    const statusCounts: Record<string, number> = {};
    for (const f of findingStats) {
      severityCounts[f.severity] = (severityCounts[f.severity] || 0) + 1;
      statusCounts[f.status] = (statusCounts[f.status] || 0) + 1;
    }

    const targetFindings = findingStats.reduce<
      Record<string, { target: string; count: number }>
    >((acc, f) => {
      const targetName = f.scanRun.job.target.name;
      if (!acc[targetName]) {
        acc[targetName] = { target: targetName, count: 0 };
      }
      acc[targetName].count++;
      return acc;
    }, {});

    const reportData = {
      generatedAt: new Date().toISOString(),
      generatedBy: session!.name,
      summary: {
        totalFindings,
        severityCounts,
        statusCounts,
      },
      findings: findingStats.map((f) => ({
        title: f.title,
        severity: f.severity,
        cvss: f.cvss,
        status: f.status,
        target: f.scanRun.job.target.name,
        createdAt: f.createdAt.toISOString(),
      })),
      targetBreakdown: Object.values(targetFindings),
    };

    const report = await prisma.reportSnapshot.create({
      data: {
        name,
        data: JSON.stringify(reportData),
        format: "json",
        userId: session!.id,
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!canViewReports(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const report = await prisma.reportSnapshot.findFirst({
      where: { id, userId: session!.id },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    await prisma.reportSnapshot.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete report" },
      { status: 500 }
    );
  }
}
