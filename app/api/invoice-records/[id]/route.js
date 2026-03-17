import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// PATCH /api/invoice-records/:id
export async function PATCH(request, { params }) {
  const { user, error } = verifyToken(request);
  if (error) return error;

  const { id } = await params;

  try {
    const record = await prisma.invoiceRecord.findUnique({
      where: { id: parseInt(id) },
    });
    if (!record)
      return NextResponse.json(
        { message: "Record not found" },
        { status: 404 },
      );

    const body = await request.json();
    const updateData = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.remarks !== undefined) updateData.remarks = body.remarks;
    updateData.updatedById = user.userId; // Track who updated

    const updated = await prisma.invoiceRecord.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        invoice: { include: { client: true } },
        createdBy: { select: { id: true, name: true } },
        updatedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      ...updated,
      invoice: {
        ...updated.invoice,
        premium: updated.invoice.premium.toString(),
        claimPayment: updated.invoice.claimPayment.toString(),
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// DELETE /api/invoice-records/:id
export async function DELETE(request, { params }) {
  const { user, error } = verifyToken(request);
  if (error) return error;

  const { id } = await params;

  try {
    const record = await prisma.invoiceRecord.findUnique({
      where: { id: parseInt(id) },
    });
    if (!record)
      return NextResponse.json(
        { message: "Record not found" },
        { status: 404 },
      );

    await prisma.invoiceRecord.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Record deleted successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
