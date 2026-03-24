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
  const isAdmin = user.role === "ADMIN";
  const isBroker = user.role === "BROKER";

  // Brokers should not access invoices API
  if (isBroker) {
    return NextResponse.json({ message: "Access denied" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  const limit = parseInt(searchParams.get("limit")) || 50; // Reduced default limit for faster loading
  const offset = parseInt(searchParams.get("offset")) || 0;

  try {
    const where = {};
    if (clientId) where.clientId = parseInt(clientId);

    // Admin and Super Admin see all invoices, Broker is denied access above

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
        broker: {
          select: {
            id: true,
            name: true,
          },
        },
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
      premium: inv.premium.toString(),
      claimPayment: inv.claimPayment.toString(),
      employeeRate: inv.employeeRate.toString(),
    }));

    // Add cache headers for better performance (cache for 30 seconds)
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
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
