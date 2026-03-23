import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// GET /api/brokers/managed - Get brokers managed by current admin
export async function GET(request) {
  const { user, error } = verifyToken(request);
  if (error) return error;

  try {
    // Super admin and Admin see all brokers
    if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
      const brokers = await prisma.broker.findMany({
        orderBy: { name: "asc" },
      });
      return NextResponse.json(brokers);
    }

    // Brokers don't need this endpoint
    return NextResponse.json([]);
  } catch (err) {
    console.error("Error fetching managed brokers:", err);
    return NextResponse.json(
      { message: "Failed to fetch brokers" },
      { status: 500 },
    );
  }
}
