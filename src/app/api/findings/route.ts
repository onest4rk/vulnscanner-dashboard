import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, canViewReports, canManageTargets } from "@/lib/auth";
import { updateFindingSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!canViewReports(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const severity = searchParams.get("severity");
  const status = searchParams.get("status");
  const scanRunId = searchParams.get("scanRunId");

  const where: Record<string, unknown> = {};
  if (severity) where.severity = severity;
  if (status) where.status = status;
  if (scanRunId) where.scanRunId = scanRunId;

  const findings = await prisma.finding.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      scanRun: {
        include: {
          job: {
            include: { target: true },
          },
        },
      },
    },
  });

  const data = findings.map((f) => ({
    id: f.id,
    title: f.title,
    description: f.description,
    severity: f.severity,
    cvss: f.cvss,
    status: f.status,
    remediation: f.remediation,
    pluginId: f.pluginId,
    pluginName: f.pluginName,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
    scanRunId: f.scanRunId,
    targetName: f.scanRun.job.target.name,
    targetId: f.scanRun.job.target.id,
  }));

  return NextResponse.json({ findings: data });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!canManageTargets(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const body = await request.json();
    const data = updateFindingSchema.parse(body);

    const finding = await prisma.finding.update({
      where: { id },
      data: {
        status: data.status,
        ...(data.remediation !== undefined ? { remediation: data.remediation } : {}),
      },
    });

    await createAuditLog({
      userId: session!.id,
      action: "UPDATE_FINDING",
      entity: "Finding",
      entityId: id,
      details: `Updated finding ${finding.title} to status ${data.status}`,
    });

    return NextResponse.json({ finding });
  } catch (err: unknown) {
    if (err instanceof Error && "issues" in err) {
      return NextResponse.json(
        { error: "Validation error", details: err },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update finding" },
      { status: 500 }
    );
  }
}
