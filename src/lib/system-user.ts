import { prisma } from "@/lib/prisma";

export const SYSTEM_USER_EMAIL = process.env.SEED_SYSTEM_USER_EMAIL ?? "system@cyber-compliance.local";

/** Where-clause fragment for people who can be assigned work - everyone but the internal system user. */
export const ASSIGNABLE_USER = { active: true, email: { not: SYSTEM_USER_EMAIL } } as const;

/**
 * Phase 1 has no login flow, so every mutation is attributed to a single
 * seeded system user. Swapping this for a real session lookup is the only
 * change auth needs to make in the action layer.
 */
export async function getActingUserId(): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { email: SYSTEM_USER_EMAIL }, select: { id: true } });
  return user?.id ?? null;
}
