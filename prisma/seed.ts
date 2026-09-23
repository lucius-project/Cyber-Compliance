/**
 * Seeds foundation data: the system user, the assessor (Lucius Craig), and
 * the three initial frameworks. The master control library (~180 controls)
 * and their framework requirement mappings are loaded via CSV import
 * (`/controls/import`, see `src/lib/actions/import.ts`), not hand-written
 * here. Client organizations (e.g. FMI) are entered through the app UI too.
 *
 * Safe to run repeatedly (used by docker-entrypoint.sh on every container
 * start): every insert is either an upsert on a natural unique key, or
 * guarded by an existence check before creating.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SYSTEM_USER_EMAIL = process.env.SEED_SYSTEM_USER_EMAIL ?? "system@cyber-compliance.local";

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function main() {
  console.log("Seeding users...");
  const systemUser = await prisma.user.upsert({
    where: { email: SYSTEM_USER_EMAIL },
    create: { email: SYSTEM_USER_EMAIL, name: "System", role: "ADMIN" },
    update: {},
  });

  const assessor = await prisma.user.upsert({
    where: { email: "lcraig@dsnets.com" },
    create: { email: "lcraig@dsnets.com", name: "Lucius Craig", role: "ASSESSOR" },
    update: {},
  });

  console.log("Seeding frameworks...");
  const frameworkDefs = [
    { name: "Cyber Insurability 2025", version: "2025", description: "Baseline controls commonly requested by cyber insurance underwriters." },
    { name: "CIS v8", version: "8", description: "CIS Critical Security Controls, version 8." },
    { name: "PIPEDA", version: null, description: "Personal Information Protection and Electronic Documents Act (Canada)." },
  ];
  for (const def of frameworkDefs) {
    const slug = slugify(def.name);
    await prisma.framework.upsert({
      where: { slug },
      create: { name: def.name, slug, version: def.version ?? undefined, description: def.description },
      update: {},
    });
  }

  console.log(`Seed complete. System user: ${systemUser.email}, assessor: ${assessor.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
