import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { SESSION_COOKIE_NAME, verifySessionToken, SessionPayload } from "./auth";

export interface AuthenticatedUserContext {
  user: {
    id: string;
    email: string;
    name: string;
    mobile?: string | null;
  };
  workspace: {
    id: string;
    name: string;
  };
}

export async function getAuthenticatedSession(): Promise<AuthenticatedUserContext | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie?.value) {
      return null;
    }

    const payload = await verifySessionToken(sessionCookie.value);
    if (!payload) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        workspaces: {
          where: { id: payload.workspaceId },
          take: 1,
        },
      },
    });

    if (!user || user.workspaces.length === 0) {
      return null;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        mobile: user.mobile,
      },
      workspace: {
        id: user.workspaces[0].id,
        name: user.workspaces[0].name,
      },
    };
  } catch (err) {
    console.error("Session verification error:", err);
    return null;
  }
}

export async function requireAuth(): Promise<AuthenticatedUserContext> {
  const session = await getAuthenticatedSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
