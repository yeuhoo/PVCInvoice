import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/deduction-report/reports/[id]
export async function GET(request, { params }) {
  const { user, error } = verifyToken(request);
  if (error) return error;

  const roleError = requireRole(user, "SUPER_ADMIN", "ADMIN");
  if (roleError) return roleError;

  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId);
    const report = await prisma.deductionReport.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        updatedBy: { select: { id: true, name: true } },
        rows: { orderBy: { rowIndex: "asc" } },
      },
    });

    if (!report) {
      return NextResponse.json({ message: "Report not found" }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (err) {
    console.error("GET /api/deduction-report/reports/[id] error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// PUT /api/deduction-report/reports/[id]
export async function PUT(request, { params }) {
  const { user, error } = verifyToken(request);
  if (error) return error;

  const roleError = requireRole(user, "SUPER_ADMIN", "ADMIN");
  if (roleError) return roleError;

  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId);
    const body = await request.json();
    const { rows, title } = body;

    const existing = await prisma.deductionReport.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "Report not found" }, { status: 404 });
    }
    if (existing.status === "SUBMITTED") {
      return NextResponse.json(
        { message: "Submitted reports cannot be edited" },
        { status: 403 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.deductionReportRow.deleteMany({ where: { reportId: id } });

      const newRows =
        rows?.map((r, i) => ({
          reportId: id,
          rowIndex: i,
          employeeNum:    String(r[0] ?? ""),
          dedCode:        String(r[1] ?? ""),
          startDate:      String(r[2] ?? ""),
          endDate:        String(r[3] ?? ""),
          rate:           String(r[4] ?? ""),
          amount:         String(r[5] ?? ""),
          payeeReference: String(r[6] ?? ""),
          goalAmount:     String(r[7] ?? ""),
        })) ?? [];

      if (newRows.length) {
        await tx.deductionReportRow.createMany({ data: newRows });
      }

      return tx.deductionReport.update({
        where: { id },
        data: {
          title: title !== undefined ? title : existing.title,
          updatedById: user.userId,
        },
        include: {
          client: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          updatedBy: { select: { id: true, name: true } },
          rows: { orderBy: { rowIndex: "asc" } },
        },
      });
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT /api/deduction-report/reports/[id] error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// PATCH /api/deduction-report/reports/[id]
export async function PATCH(request, { params }) {
  const { user, error } = verifyToken(request);
  if (error) return error;

  const roleError = requireRole(user, "SUPER_ADMIN", "ADMIN");
  if (roleError) return roleError;

  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId);
    const body = await request.json();
    const { status, title } = body;

    const existing = await prisma.deductionReport.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "Report not found" }, { status: 404 });
    }

    const updateData = { updatedById: user.userId };
    if (status) updateData.status = status;
    if (title !== undefined) updateData.title = title;

    const updated = await prisma.deductionReport.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        updatedBy: { select: { id: true, name: true } },
        _count: { select: { rows: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/deduction-report/reports/[id] error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// DELETE /api/deduction-report/reports/[id]
export async function DELETE(request, { params }) {
  const { user, error } = verifyToken(request);
  if (error) return error;

  const roleError = requireRole(user, "SUPER_ADMIN");
  if (roleError) return roleError;

  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId);

    const existing = await prisma.deductionReport.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "Report not found" }, { status: 404 });
    }

    await prisma.deductionReport.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE /api/deduction-report/reports/[id] error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
