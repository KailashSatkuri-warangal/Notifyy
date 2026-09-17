import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { ServerSeedService } from "@/services/server/SeedService";

export async function POST(req: Request) {
  try {
    const { name, email, password, mobile } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return NextResponse.json({ error: "Email is already registered. Please log in." }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    // Create user and default workspace
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        mobile: mobile?.trim() || null,
        workspaces: {
          create: {
            name: `${name.trim()}'s Workspace`,
          },
        },
      },
      include: { workspaces: true },
    });

    const workspace = user.workspaces[0];

    // Seed initial demo data for smooth onboarding
    await ServerSeedService.seedWorkspace(workspace.id, user.name);

    // Generate JWT token
    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      workspaceId: workspace.id,
    });

    const res = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
      workspace: { id: workspace.id, name: workspace.name },
    });

    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return res;
  } catch (err: any) {
    console.error("Registration error:", err);
    return NextResponse.json({ error: err.message || "Failed to register" }, { status: 500 });
  }
}
