import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/clients
export async function GET(request) {
  const { user, error } = verifyToken(request);
  if (error) return error;

  try {
    const clients = await prisma.client.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(clients, {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// POST /api/clients - all authenticated users can create clients
export async function POST(request) {
  const { user, error } = verifyToken(request);
  if (error) return error;

  try {
    const {
      name,
      companyCode,
      ownerName,
      adminName,
      email,
      phone,
      payrollCompany,
      deductionDay,
    } = await request.json();
    if (!name)
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 },
      );

    const client = await prisma.client.create({
      data: {
        name,
        companyCode,
        ownerName,
        adminName,
        email,
        phone,
        payrollCompany,
        deductionDay,
      },
    });
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
