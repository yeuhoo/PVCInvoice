import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// GET /api/invoice-records
export async function GET(request) {
  const { user, error } = verifyToken(request);
  if (error) return error;

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const invoiceId = searchParams.get("invoiceId");

  try {
    const where = {};
    if (status) where.status = status;
    if (invoiceId) where.invoiceId = parseInt(invoiceId);

    const records = await prisma.invoiceRecord.findMany({
      where,
      include: {
        invoice: {
          include: {
            client: true,
            broker: true,
          },
        },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = records.map((rec) => ({
      ...rec,
      invoice: {
        ...rec.invoice,
        broker: isSuperAdmin ? rec.invoice.broker : undefined,
        premium: rec.invoice.premium.toString(),
        claimPayment: rec.invoice.claimPayment.toString(),
      },
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// POST /api/invoice-records
export async function POST(request) {
  const { user, error } = verifyToken(request);
  if (error) return error;

  try {
    const { invoiceId, status, remarks } = await request.json();

    if (!invoiceId) {
      return NextResponse.json(
        { message: "invoiceId is required" },
        { status: 400 },
      );
    }

    const existing = await prisma.invoiceRecord.findUnique({
      where: { invoiceId: parseInt(invoiceId) },
    });
    if (existing) {
      return NextResponse.json(
        { message: "A record already exists for this invoice" },
        { status: 409 },
      );
    }

    const record = await prisma.invoiceRecord.create({
      data: {
        invoiceId: parseInt(invoiceId),
        status: status || "OPEN",
        remarks: remarks || null,
        createdById: user.userId,
        updatedById: user.userId,
      },
      include: {
        invoice: { include: { client: true } },
        createdBy: { select: { id: true, name: true } },
        updatedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      {
        ...record,
        invoice: {
          ...record.invoice,
          premium: record.invoice.premium.toString(),
          claimPayment: record.invoice.claimPayment.toString(),
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
