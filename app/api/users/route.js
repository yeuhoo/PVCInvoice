import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyToken, requireRole } from "@/lib/auth";

// GET all users (super admin only)
export async function GET(request) {
  try {
    const { user, error } = verifyToken(request);
    if (error) return error;

    const roleError = requireRole(user, "SUPER_ADMIN");
    if (roleError) return roleError;

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        linkedBrokerId: true,
        linkedBroker: {
          select: {
            id: true,
            name: true,
            managedByAdminId: true,
            managedByAdmin: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    return NextResponse.json(
      { message: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

// POST create new user (super admin only)
export async function POST(request) {
  try {
    const { user, error } = verifyToken(request);
    if (error) return error;

    const roleError = requireRole(user, "SUPER_ADMIN");
    if (roleError) return roleError;

    const { name, email, password, role, linkedBrokerId } =
      await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email, and password are required" },
        { status: 400 },
      );
    }

    // Validate broker role requirements - auto-create broker entity if not provided
    let resolvedBrokerId = linkedBrokerId ? parseInt(linkedBrokerId) : null;
    if (role === "BROKER" && !resolvedBrokerId) {
      // Auto-create a broker entity with the user's name
      const newBroker = await prisma.broker.create({ data: { name } });
      resolvedBrokerId = newBroker.id;
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 },
      );
    }

    // If linking to broker, check if broker already has a user
    if (resolvedBrokerId) {
      const brokerUser = await prisma.user.findFirst({
        where: { linkedBrokerId: resolvedBrokerId },
      });
      if (brokerUser) {
        return NextResponse.json(
          { message: "This broker already has a linked user account" },
          { status: 409 },
        );
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role || "ADMIN",
        linkedBrokerId: resolvedBrokerId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        linkedBrokerId: true,
        linkedBroker: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (err) {
    console.error("Error creating user:", err);
    return NextResponse.json(
      { message: "Failed to create user" },
      { status: 500 },
    );
  }
}
