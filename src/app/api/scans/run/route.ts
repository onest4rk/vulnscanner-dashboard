import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, canTriggerScans } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!canTriggerScans(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    const job = await prisma.scanJob.findUnique({
      where: { id: jobId },
      include: { target: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Scan job not found" }, { status: 404 });
    }

    const run = await prisma.scanRun.create({
      data: {
        jobId: job.id,
        status: "PENDING",
      },
    });

    await prisma.scanJob.update({
      where: { id: job.id },
      data: { status: "PENDING" },
    });

    await createAuditLog({
      userId: session!.id,
      action: "TRIGGER_SCAN",
      entity: "ScanRun",
      entityId: run.id,
      details: `Triggered scan run for target ${job.target.name}`,
    });

    return NextResponse.json({ run }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to trigger scan" },
      { status: 500 }
    );
  }
}
