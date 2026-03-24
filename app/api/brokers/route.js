import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, requireRole } from "@/lib/auth";

// GET /api/brokers - super admin and admin
export async function GET(request) {
  const { user, error } = verifyToken(request);
  if (error) return error;
  const roleError = requireRole(user, "SUPER_ADMIN", "ADMIN");
  if (roleError) return roleError;

  try {
    const brokers = await prisma.broker.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(brokers, {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// POST /api/brokers - super admin and admin
export async function POST(request) {
  const { user, error } = verifyToken(request);
  if (error) return error;
  const roleError = requireRole(user, "SUPER_ADMIN", "ADMIN");
  if (roleError) return roleError;

  try {
    const { name } = await request.json();
    if (!name)
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 },
      );

    const broker = await prisma.broker.create({ data: { name } });
    return NextResponse.json(broker, { status: 201 });
  } catch (err) {
    if (err.code === "P2002")
      return NextResponse.json(
        { message: "Broker already exists" },
        { status: 409 },
      );
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
