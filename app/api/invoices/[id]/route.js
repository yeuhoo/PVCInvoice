import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// GET /api/invoices/:id
export async function GET(request, { params }) {
  const { user, error } = verifyToken(request);
  if (error) return error;

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const { id } = await params;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(id) },
      include: {
        client: true,
        broker: true,
        createdBy: { select: { id: true, name: true } },
        record: true,
      },
    });

    if (!invoice)
      return NextResponse.json(
        { message: "Invoice not found" },
        { status: 404 },
      );
    if (!isSuperAdmin && invoice.createdById !== user.userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      ...invoice,
      broker: isSuperAdmin ? invoice.broker : undefined,
      premium: invoice.premium.toString(),
      claimPayment: invoice.claimPayment.toString(),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// PATCH /api/invoices/:id
export async function PATCH(request, { params }) {
  const { user, error } = verifyToken(request);
  if (error) return error;

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const { id } = await params;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(id) },
    });
    if (!invoice)
      return NextResponse.json(
        { message: "Invoice not found" },
        { status: 404 },
      );
    if (!isSuperAdmin && invoice.createdById !== user.userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const updateData = {};

    if (body.noOfEmployees !== undefined)
      updateData.noOfEmployees = parseInt(body.noOfEmployees);

    if (isSuperAdmin) {
      if (body.checkDate !== undefined)
        updateData.checkDate = body.checkDate ? new Date(body.checkDate) : null;
      if (body.payrollNumber !== undefined)
        updateData.payrollNumber = body.payrollNumber;
      if (body.premium !== undefined)
        updateData.premium = parseFloat(body.premium);
      if (body.claimPayment !== undefined)
        updateData.claimPayment = parseFloat(body.claimPayment);
      if (body.brokerId !== undefined)
        updateData.brokerId = body.brokerId ? parseInt(body.brokerId) : null;
      if (body.clientId !== undefined)
        updateData.clientId = parseInt(body.clientId);
    }

    const updated = await prisma.invoice.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { client: true, broker: true, record: true },
    });

    return NextResponse.json({
      ...updated,
      premium: updated.premium.toString(),
      claimPayment: updated.claimPayment.toString(),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// DELETE /api/invoices/:id - super admin only
export async function DELETE(request, { params }) {
  const { user, error } = verifyToken(request);
  if (error) return error;

  if (user.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { message: "Only Super Admin can delete invoices" },
      { status: 403 },
    );
  }

  const { id } = await params;

  try {
    await prisma.invoiceRecord.deleteMany({
      where: { invoiceId: parseInt(id) },
    });
    await prisma.invoice.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ message: "Invoice deleted" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
