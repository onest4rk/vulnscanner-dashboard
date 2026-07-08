import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, canManageTargets } from "@/lib/auth";
import { createTargetSchema, updateTargetSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const targets = await prisma.scanTarget.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { group: true },
  });

  return NextResponse.json({ targets });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!canManageTargets(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = createTargetSchema.parse(body);

    const target = await prisma.scanTarget.create({
      data: {
        ...data,
        groupId: data.groupId || null,
        userId: session!.id,
      },
    });

    await createAuditLog({
      userId: session!.id,
      action: "CREATE_TARGET",
      entity: "ScanTarget",
      entityId: target.id,
      details: `Created target ${data.name} (${data.target})`,
    });

    return NextResponse.json({ target }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && "issues" in err) {
      return NextResponse.json(
        { error: "Validation error", details: err },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Failed to create target" }, { status: 500 });
  }
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
    const data = updateTargetSchema.parse(body);

    const target = await prisma.scanTarget.update({
      where: { id },
      data,
    });

    await createAuditLog({
      userId: session!.id,
      action: "UPDATE_TARGET",
      entity: "ScanTarget",
      entityId: id,
      details: `Updated target ${target.name}`,
    });

    return NextResponse.json({ target });
  } catch (err: unknown) {
    if (err instanceof Error && "issues" in err) {
      return NextResponse.json(
        { error: "Validation error", details: err },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Failed to update target" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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

    await prisma.scanTarget.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await createAuditLog({
      userId: session!.id,
      action: "DELETE_TARGET",
      entity: "ScanTarget",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete target" },
      { status: 500 }
    );
  }
}
