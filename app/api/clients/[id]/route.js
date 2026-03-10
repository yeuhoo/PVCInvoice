import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, requireRole } from "@/lib/auth";

// DELETE /api/clients/:id - super admin only
export async function DELETE(request, { params }) {
  const { user, error } = verifyToken(request);
  if (error) return error;
  const roleError = requireRole(user, "SUPER_ADMIN");
  if (roleError) return roleError;

  const { id } = await params;

  try {
    await prisma.client.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ message: "Client deleted" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
