import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/deduction-report/reports
// Returns all deduction reports (SUPER_ADMIN + ADMIN only)
export async function GET(request) {
  const { user, error } = verifyToken(request);
  if (error) return error;

  const roleError = requireRole(user, "SUPER_ADMIN", "ADMIN");
  if (roleError) return roleError;

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");

  try {
    const where = {};
    if (clientId) where.clientId = parseInt(clientId);

    const reports = await prisma.deductionReport.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        client: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        updatedBy: { select: { id: true, name: true } },
        _count: { select: { rows: true } },
      },
    });

    return NextResponse.json(reports);
  } catch (err) {
    console.error("GET /api/deduction-report/reports error:", err);
    return NextResponse.json(
      { message: err.message || "Server error" },
      { status: 500 }
    );
  }
}

// POST /api/deduction-report/reports
// Creates a new deduction report (with optional rows)
export async function POST(request) {
  const { user, error } = verifyToken(request);
  if (error) return error;

  const roleError = requireRole(user, "SUPER_ADMIN", "ADMIN");
  if (roleError) return roleError;

  try {
    const body = await request.json();
    const { clientId, template, title, rows } = body;

    if (!clientId || !template) {
      return NextResponse.json(
        { message: "clientId and template are required" },
        { status: 400 }
      );
    }

    const report = await prisma.deductionReport.create({
      data: {
        clientId: parseInt(clientId),
        template,
        title: title || null,
        status: "DRAFT",
        createdById: user.userId,
        updatedById: user.userId,
        rows: rows?.length
          ? {
              create: rows.map((r, i) => ({
                rowIndex: i,
                employeeNum: String(r[0] ?? ""),
                dedCode:     String(r[1] ?? ""),
                startDate:   String(r[2] ?? ""),
                endDate:     String(r[3] ?? ""),
                rate:        String(r[4] ?? ""),
                amount:      String(r[5] ?? ""),
                payeeReference: String(r[6] ?? ""),
                goalAmount:  String(r[7] ?? ""),
              })),
            }
          : undefined,
      },
      include: {
        client: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        rows: { orderBy: { rowIndex: "asc" } },
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (err) {
    console.error("POST /api/deduction-report/reports error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
