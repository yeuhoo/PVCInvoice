import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

/**
 * Verifies JWT from the Authorization header.
 * Returns { user } on success or { error: NextResponse } on failure.
 */
export function verifyToken(request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      error: NextResponse.json(
        { message: "No token provided" },
        { status: 401 },
      ),
    };
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { user: decoded };
  } catch {
    return {
      error: NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 401 },
      ),
    };
  }
}

/**
 * Checks if the user has one of the required roles.
 * Returns an error NextResponse if not authorized.
 */
export function requireRole(user, ...roles) {
  if (!roles.includes(user.role)) {
    return NextResponse.json(
      { message: "Forbidden: insufficient permissions" },
      { status: 403 },
    );
  }
  return null;
}
