import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, requireRole } from "@/lib/auth";

// GET /api/clients
export async function GET(request) {
  const { user, error } = verifyToken(request);
  if (error) return error;

  try {
    const clients = await prisma.client.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(clients);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// POST /api/clients - super admin only
export async function POST(request) {
  const { user, error } = verifyToken(request);
  if (error) return error;
  const roleError = requireRole(user, "SUPER_ADMIN");
  if (roleError) return roleError;

  try {
    const { name } = await request.json();
    if (!name)
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 },
      );

    const client = await prisma.client.create({ data: { name } });
    return NextResponse.json(client, { status: 201 });
  } catch (err) {
    if (err.code === "P2002")
      return NextResponse.json(
        { message: "Client already exists" },
        { status: 409 },
      );
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
