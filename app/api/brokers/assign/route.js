import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, requireRole } from "@/lib/auth";

// PATCH - Assign broker to admin (super admin only)
export async function PATCH(request) {
  try {
    const { user, error } = verifyToken(request);
    if (error) return error;

    const roleError = requireRole(user, "SUPER_ADMIN");
    if (roleError) return roleError;

    const { brokerId, adminId } = await request.json();

    if (!brokerId) {
      return NextResponse.json(
        { message: "Broker ID is required" },
        { status: 400 },
      );
    }

    // Update broker with admin assignment (null to unassign)
    const updatedBroker = await prisma.broker.update({
      where: { id: parseInt(brokerId) },
      data: {
        managedByAdminId: adminId ? parseInt(adminId) : null,
      },
      include: {
        managedByAdmin: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedBroker);
  } catch (err) {
    console.error("Error assigning broker:", err);
    return NextResponse.json(
      { message: "Failed to assign broker" },
      { status: 500 },
    );
  }
}
