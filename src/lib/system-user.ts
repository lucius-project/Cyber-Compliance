import { prisma } from "@/lib/prisma";

/**
 * Phase 1 has no login flow, so every mutation is attributed to a single
 * seeded system user. Swapping this for a real session lookup is the only
 * change auth needs to make in the action layer.
 */
export async function getActingUserId(): Promise<string | null> {
  const email = process.env.SEED_SYSTEM_USER_EMAIL ?? "system@cyber-compliance.local";
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return user?.id ?? null;
}
