import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

function generateInvoiceNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${ts}-${rand}`;
}

function generateCompanyCode() {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CC-${rand}`;
}

// GET /api/invoices
export async function GET(request) {
  const { user, error } = verifyToken(request);
  if (error) return error;

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");

  try {
    const where = {};
    if (clientId) where.clientId = parseInt(clientId);
    if (!isSuperAdmin) where.createdById = user.userId;

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: true,
        broker: true,
        createdBy: { select: { id: true, name: true } },
        record: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const result = invoices.map((inv) => ({
      ...inv,
      broker: isSuperAdmin ? inv.broker : undefined,
      premium: inv.premium.toString(),
      claimPayment: inv.claimPayment.toString(),
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// POST /api/invoices
export async function POST(request) {
  const { user, error } = verifyToken(request);
  if (error) return error;

  try {
    const {
      clientId,
      brokerId,
      checkDate,
      payrollNumber,
      premium,
      claimPayment,
      noOfEmployees,
    } = await request.json();

    if (!clientId) {
      return NextResponse.json(
        { message: "clientId is required" },
        { status: 400 },
      );
    }

    let invoiceNumber, companyCode;
    let unique = false;

    while (!unique) {
      invoiceNumber = generateInvoiceNumber();
      companyCode = generateCompanyCode();
      const [existingInv, existingCC] = await Promise.all([
        prisma.invoice.findUnique({ where: { invoiceNumber } }),
        prisma.invoice.findUnique({ where: { companyCode } }),
      ]);
      if (!existingInv && !existingCC) unique = true;
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        companyCode,
        clientId: parseInt(clientId),
        brokerId: brokerId ? parseInt(brokerId) : null,
        checkDate: checkDate ? new Date(checkDate) : null,
        payrollNumber: payrollNumber || null,
        premium: parseFloat(premium) || 0,
        claimPayment: parseFloat(claimPayment) || 0,
        noOfEmployees: parseInt(noOfEmployees) || 0,
        createdById: user.userId,
      },
      include: { client: true, broker: true },
    });

    return NextResponse.json(
      {
        ...invoice,
        premium: invoice.premium.toString(),
        claimPayment: invoice.claimPayment.toString(),
      },
      { status: 201 },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
