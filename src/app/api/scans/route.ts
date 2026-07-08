import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, canTriggerScans, canViewReports } from "@/lib/auth";
import { createScanJobSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  const session = await getSession();
  if (!canViewReports(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobs = await prisma.scanJob.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      target: true,
      scanRuns: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const data = jobs.map((job) => ({
    id: job.id,
    targetId: job.targetId,
    targetName: job.target.name,
    target: job.target.target,
    cronExpr: job.cronExpr,
    scheduled: job.scheduled,
    status: job.status,
    priority: job.priority,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    lastRun: job.scanRuns[0]
      ? {
          id: job.scanRuns[0].id,
          status: job.scanRuns[0].status,
          startedAt: job.scanRuns[0].startedAt?.toISOString() ?? null,
          completedAt: job.scanRuns[0].completedAt?.toISOString() ?? null,
          duration: job.scanRuns[0].duration,
          createdAt: job.scanRuns[0].createdAt.toISOString(),
        }
      : null,
  }));

  return NextResponse.json({ scans: data });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!canTriggerScans(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = createScanJobSchema.parse(body);

    const job = await prisma.scanJob.create({
      data: {
        targetId: data.targetId,
        cronExpr: data.cronExpr,
        scheduled: data.scheduled,
        priority: data.priority,
        scannerId: data.scannerId ?? null,
        userId: session!.id,
      },
      include: { target: true },
    });

    await createAuditLog({
      userId: session!.id,
      action: "CREATE_SCAN_JOB",
      entity: "ScanJob",
      entityId: job.id,
      details: `Created scan job for target ${job.target.name}`,
    });

    return NextResponse.json({ scan: job }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && "issues" in err) {
      return NextResponse.json(
        { error: "Validation error", details: err },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create scan job" },
      { status: 500 }
    );
  }
}
