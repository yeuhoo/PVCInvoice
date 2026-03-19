import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

function generateInvoiceNumber() {
  // Generate 9-digit number (100000000 to 999999999)
  return Math.floor(100000000 + Math.random() * 900000000).toString();
}

// GET /api/invoices
export async function GET(request) {
  const { user, error } = verifyToken(request);
  if (error) return error;

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  const limit = parseInt(searchParams.get("limit")) || 100; // Default limit
  const offset = parseInt(searchParams.get("offset")) || 0;

  try {
    const where = {};
    if (clientId) where.clientId = parseInt(clientId);
    if (!isSuperAdmin) where.createdById = user.userId;

    // Optimized: Use select to only fetch needed fields
    const invoices = await prisma.invoice.findMany({
      where,
      select: {
        id: true,
        invoiceNumber: true,
        clientId: true,
        brokerId: true,
        checkDate: true,
        payrollNumber: true,
        premium: true,
        claimPayment: true,
        noOfEmployees: true,
        employeeRate: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        broker: isSuperAdmin
          ? {
              select: {
                id: true,
                name: true,
              },
            }
          : false,
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        record: {
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            remarks: true,
            createdAt: true,
            updatedAt: true,
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
            updatedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const result = invoices.map((inv) => ({
      ...inv,
      broker: isSuperAdmin ? inv.broker : undefined,
      premium: inv.premium.toString(),
      claimPayment: inv.claimPayment.toString(),
      employeeRate: inv.employeeRate.toString(),
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
      employeeRate,
      billingStatus,
      paymentStatus,
      remarks,
    } = await request.json();
    
    console.log("POST /api/invoices - Received data:");
    console.log("  employeeRate:", employeeRate);
    console.log("  typeof employeeRate:", typeof employeeRate);
    console.log("  parseFloat(employeeRate):", parseFloat(employeeRate));
    console.log("  parseFloat(employeeRate) || 7.5:", parseFloat(employeeRate) || 7.5);

    if (!clientId) {
      return NextResponse.json(
        { message: "clientId is required" },
        { status: 400 },
      );
    }

    let invoiceNumber;
    let unique = false;

    while (!unique) {
      invoiceNumber = generateInvoiceNumber();
      const existingInv = await prisma.invoice.findUnique({
        where: { invoiceNumber },
      });
      if (!existingInv) unique = true;
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId: parseInt(clientId),
        brokerId: brokerId ? parseInt(brokerId) : null,
        checkDate: checkDate ? new Date(checkDate) : null,
        payrollNumber: payrollNumber || null,
        premium: parseFloat(premium) || 0,
        claimPayment: parseFloat(claimPayment) || 0,
        noOfEmployees: parseInt(noOfEmployees) || 0,
        employeeRate: parseFloat(employeeRate) || 7.5,
        createdById: user.userId,
      },
      include: { client: true, broker: true },
    });

    // Auto-create an InvoiceRecord for this invoice
    await prisma.invoiceRecord.create({
      data: {
        invoiceId: invoice.id,
        status: billingStatus || "Weekly",
        paymentStatus: paymentStatus || null,
        remarks: remarks || null,
        createdById: user.userId,
        updatedById: user.userId,
      },
    });

    return NextResponse.json(
      {
        ...invoice,
        premium: invoice.premium.toString(),
        claimPayment: invoice.claimPayment.toString(),
        employeeRate: invoice.employeeRate.toString(),
      },
      { status: 201 },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
