import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import {
  ADMIN_COOKIE_NAME,
  VOTER_COOKIE_NAME,
  adminCookieOptions,
  createAdminSessionToken,
  createVoterSessionToken,
  verifyAdminSessionToken,
  verifyVoterSessionToken,
  voterCookieOptions,
} from "@/lib/session";

export async function validateAdminCredentials(
  username: string,
  password: string,
): Promise<boolean> {
  const admin = await prisma.adminUser.findUnique({
    where: { username },
    select: {
      passwordHash: true,
      isActive: true,
    },
  });

  if (!admin || !admin.isActive) {
    return false;
  }

  return verifyPassword(password, admin.passwordHash);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminSessionToken(token);
}

export async function requireAdminSession(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

export async function setAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, createAdminSessionToken(), adminCookieOptions);
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

export async function getVoterSessionVoterId(): Promise<number | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(VOTER_COOKIE_NAME)?.value;
  return verifyVoterSessionToken(token);
}

export async function setVoterSession(voterId: number): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(VOTER_COOKIE_NAME, createVoterSessionToken(voterId), voterCookieOptions);
}

export async function clearVoterSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(VOTER_COOKIE_NAME);
}
