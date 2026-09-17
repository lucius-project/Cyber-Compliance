/**
 * Seeds sample/demo data: one MSP client (DataStream Networks), the three
 * initial frameworks, a handful of sample master controls with real
 * many-to-many framework mappings, and one in-progress assessment.
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

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function main() {
  console.log("Seeding users...");
  const systemUser = await prisma.user.upsert({
    where: { email: SYSTEM_USER_EMAIL },
    create: { email: SYSTEM_USER_EMAIL, name: "System", role: "ADMIN" },
    update: {},
  });

  const assessor = await prisma.user.upsert({
    where: { email: "jordan.lee@dsnets-msp.example" },
    create: { email: "jordan.lee@dsnets-msp.example", name: "Jordan Lee", role: "ASSESSOR" },
    update: {},
  });

  const technician = await prisma.user.upsert({
    where: { email: "sam.patel@dsnets-msp.example" },
    create: { email: "sam.patel@dsnets-msp.example", name: "Sam Patel", role: "TECHNICIAN" },
    update: {},
  });

  console.log("Seeding frameworks...");
  const frameworkDefs = [
    { name: "Cyber Insurability 2025", version: "2025", description: "Baseline controls commonly requested by cyber insurance underwriters." },
    { name: "CIS v8", version: "8", description: "CIS Critical Security Controls, version 8." },
    { name: "PIPEDA", version: null, description: "Personal Information Protection and Electronic Documents Act (Canada)." },
  ];
  const frameworks = new Map<string, Awaited<ReturnType<typeof prisma.framework.upsert>>>();
  for (const def of frameworkDefs) {
    const slug = slugify(def.name);
    const framework = await prisma.framework.upsert({
      where: { slug },
      create: { name: def.name, slug, version: def.version ?? undefined, description: def.description },
      update: {},
    });
    frameworks.set(def.name, framework);
  }

  console.log("Seeding framework requirements...");
  const requirementDefs: { framework: string; code: string; title?: string }[] = [
    { framework: "CIS v8", code: "5.2", title: "Use Unique Passwords" },
    { framework: "CIS v8", code: "5.4", title: "Restrict Administrator Privileges to Dedicated Admin Accounts" },
    { framework: "CIS v8", code: "6.3", title: "Require MFA for Externally-Exposed Applications" },
    { framework: "CIS v8", code: "7.1", title: "Establish and Maintain a Vulnerability Management Process" },
    { framework: "CIS v8", code: "3.11", title: "Encrypt Sensitive Data at Rest" },
    { framework: "CIS v8", code: "10.1", title: "Deploy and Maintain Anti-Malware Software" },
    { framework: "CIS v8", code: "11.2", title: "Perform Automated Backups" },
    { framework: "CIS v8", code: "14.1", title: "Establish and Maintain a Security Awareness Program" },
    { framework: "CIS v8", code: "17.1", title: "Designate Personnel to Manage Incident Handling" },
    { framework: "Cyber Insurability 2025", code: "AP-1", title: "Unique / Complex Passwords" },
    { framework: "Cyber Insurability 2025", code: "AP-2", title: "Multi-Factor Authentication" },
    { framework: "Cyber Insurability 2025", code: "AP-3", title: "Privileged Access Management" },
    { framework: "Cyber Insurability 2025", code: "CB-1", title: "Tested Data Backups" },
    { framework: "Cyber Insurability 2025", code: "IR-1", title: "Documented Incident Response Plan" },
    { framework: "Cyber Insurability 2025", code: "EM-1", title: "Email Security Controls" },
    { framework: "PIPEDA", code: "4.7.3", title: "Security Safeguards - Methods" },
    { framework: "PIPEDA", code: "4.5", title: "Limiting Use, Disclosure, and Retention" },
    { framework: "PIPEDA", code: "4.8", title: "Openness" },
  ];
  const requirements = new Map<string, Awaited<ReturnType<typeof prisma.frameworkRequirement.upsert>>>();
  for (const def of requirementDefs) {
    const framework = frameworks.get(def.framework)!;
    const requirement = await prisma.frameworkRequirement.upsert({
      where: { frameworkId_code: { frameworkId: framework.id, code: def.code } },
      create: { frameworkId: framework.id, code: def.code, title: def.title },
      update: {},
    });
    requirements.set(`${def.framework}:${def.code}`, requirement);
  }

  console.log("Seeding sample master controls...");
  const controlDefs: {
    controlNumber: string;
    name: string;
    description: string;
    category: string;
    mappings: string[];
  }[] = [
    {
      controlNumber: "100",
      name: "Unique, complex passwords or passphrases",
      description:
        "Require unique, complex passwords or passphrases meeting current industry guidance for every account, with no password reuse across systems.",
      category: "Access Control",
      mappings: ["CIS v8:5.2", "Cyber Insurability 2025:AP-1", "PIPEDA:4.7.3"],
    },
    {
      controlNumber: "101",
      name: "Multi-factor authentication for remote access",
      description: "Require MFA for all remote access, VPN, and externally-exposed applications.",
      category: "Access Control",
      mappings: ["CIS v8:6.3", "Cyber Insurability 2025:AP-2"],
    },
    {
      controlNumber: "110",
      name: "Maintain and test data backups",
      description: "Maintain automated, encrypted backups and periodically test restoration.",
      category: "Backup & Recovery",
      mappings: ["CIS v8:11.2", "Cyber Insurability 2025:CB-1"],
    },
    {
      controlNumber: "120",
      name: "Vulnerability scanning and patch management",
      description: "Run regular vulnerability scans and apply critical patches within defined SLAs.",
      category: "Vulnerability Management",
      mappings: ["CIS v8:7.1"],
    },
    {
      controlNumber: "130",
      name: "Security awareness training program",
      description: "Provide recurring security awareness training, including phishing simulations.",
      category: "Security Awareness",
      mappings: ["CIS v8:14.1", "PIPEDA:4.8"],
    },
    {
      controlNumber: "140",
      name: "Endpoint detection and response (EDR)",
      description: "Deploy EDR/anti-malware tooling with centralized monitoring on all endpoints and servers.",
      category: "Endpoint Security",
      mappings: ["CIS v8:10.1"],
    },
    {
      controlNumber: "150",
      name: "Documented incident response plan",
      description: "Maintain a written incident response plan with defined roles and an annual tabletop exercise.",
      category: "Incident Response",
      mappings: ["CIS v8:17.1", "Cyber Insurability 2025:IR-1"],
    },
    {
      controlNumber: "160",
      name: "Email security and anti-phishing controls",
      description: "Deploy SPF/DKIM/DMARC, attachment sandboxing, and link-scanning on all mail flows.",
      category: "Email Security",
      mappings: ["Cyber Insurability 2025:EM-1"],
    },
    {
      controlNumber: "170",
      name: "Encrypt sensitive data at rest and in transit",
      description: "Apply encryption to sensitive data at rest and in transit using current industry-standard algorithms.",
      category: "Data Protection",
      mappings: ["CIS v8:3.11", "PIPEDA:4.5"],
    },
    {
      controlNumber: "180",
      name: "Privileged access management",
      description: "Restrict administrator privileges to dedicated admin accounts, reviewed quarterly.",
      category: "Access Control",
      mappings: ["CIS v8:5.4", "Cyber Insurability 2025:AP-3"],
    },
  ];

  const controls = new Map<string, Awaited<ReturnType<typeof prisma.control.upsert>>>();
  for (const def of controlDefs) {
    const control = await prisma.control.upsert({
      where: { controlNumber: def.controlNumber },
      create: {
        controlNumber: def.controlNumber,
        name: def.name,
        description: def.description,
        category: def.category,
      },
      update: {},
    });
    controls.set(def.controlNumber, control);

    for (const mappingKey of def.mappings) {
      const requirement = requirements.get(mappingKey);
      if (!requirement) continue;
      await prisma.controlFrameworkMapping.upsert({
        where: { controlId_frameworkRequirementId: { controlId: control.id, frameworkRequirementId: requirement.id } },
        create: { controlId: control.id, frameworkRequirementId: requirement.id },
        update: {},
      });
    }
  }

  console.log("Seeding sample organization: DataStream Networks...");
  const organization =
    (await prisma.organization.findFirst({ where: { name: "DataStream Networks" } })) ??
    (await prisma.organization.create({
      data: {
        name: "DataStream Networks",
        legalName: "DataStream Networks Inc.",
        primaryContact: "Alex Rivera",
        email: "alex.rivera@datastream-networks.example",
        phone: "555-0142",
        industry: "Managed IT Services",
        employeeCount: 42,
        endpointCount: 65,
        serverCount: 8,
        location: "Toronto, ON",
        notes: "SAMPLE / DEMO organization seeded for Phase 1 demonstration purposes.",
      },
    }));

  const existingAssessment = await prisma.assessment.findFirst({
    where: { organizationId: organization.id, name: "2026 Baseline Assessment" },
  });

  if (existingAssessment) {
    console.log("Sample assessment already exists - skipping assessment/evidence/remediation seed.");
  } else {
    console.log("Seeding sample assessment with varied control statuses...");
    const assessment = await prisma.assessment.create({
      data: {
        organizationId: organization.id,
        name: "2026 Baseline Assessment",
        status: "IN_PROGRESS",
        assessmentDate: new Date(),
        startedDate: daysFromNow(-14),
        assessorId: assessor.id,
        notes: "SAMPLE / DEMO assessment seeded for Phase 1 demonstration purposes.",
        frameworks: {
          create: [...frameworks.values()].map((f) => ({ frameworkId: f.id })),
        },
      },
    });

    const statusPlan: Record<
      string,
      { status: "NOT_ASSESSED" | "NOT_STARTED" | "IN_PROGRESS" | "IMPLEMENTED" | "NOT_APPLICABLE"; isApplicable?: boolean }
    > = {
      "100": { status: "IMPLEMENTED" },
      "101": { status: "IMPLEMENTED" },
      "110": { status: "IN_PROGRESS" },
      "120": { status: "IN_PROGRESS" },
      "130": { status: "NOT_STARTED" },
      "140": { status: "NOT_STARTED" },
      "150": { status: "NOT_ASSESSED" },
      "160": { status: "NOT_ASSESSED" },
      "170": { status: "IMPLEMENTED" },
      "180": { status: "NOT_APPLICABLE", isApplicable: false },
    };

    const controlAssessments = new Map<string, Awaited<ReturnType<typeof prisma.controlAssessment.create>>>();
    for (const [controlNumber, control] of controls) {
      const plan = statusPlan[controlNumber] ?? { status: "NOT_ASSESSED" as const };
      const ca = await prisma.controlAssessment.create({
        data: {
          assessmentId: assessment.id,
          controlId: control.id,
          status: plan.status,
          isApplicable: plan.isApplicable ?? true,
          ownerId: plan.status === "NOT_ASSESSED" ? undefined : technician.id,
          assessorId: assessor.id,
          lastReviewedAt: plan.status === "NOT_ASSESSED" ? undefined : daysFromNow(-7),
          nextReviewAt: daysFromNow(180),
          notes:
            controlNumber === "180"
              ? "Single owner-operator environment; no additional privileged accounts beyond domain admin."
              : undefined,
        },
      });
      controlAssessments.set(controlNumber, ca);
    }

    console.log("Seeding sample evidence...");
    await prisma.evidence.create({
      data: {
        controlAssessmentId: controlAssessments.get("100")!.id,
        title: "Password policy - Active Directory GPO export",
        description: "GPO enforcing 14-character minimum, complexity, and no reuse.",
        evidenceType: "CONFIGURATION_EXPORT",
        dateCollected: daysFromNow(-7),
        collectedById: technician.id,
        reviewDate: daysFromNow(180),
      },
    });
    await prisma.evidence.create({
      data: {
        controlAssessmentId: controlAssessments.get("101")!.id,
        title: "MFA enforcement policy",
        description: "Conditional access policy requiring MFA for all remote sessions.",
        evidenceType: "POLICY",
        dateCollected: daysFromNow(-7),
        collectedById: technician.id,
      },
    });
    await prisma.evidence.create({
      data: {
        controlAssessmentId: controlAssessments.get("170")!.id,
        title: "Disk encryption status report",
        description: "BitLocker compliance report across all managed endpoints.",
        evidenceType: "CONFIGURATION_EXPORT",
        dateCollected: daysFromNow(-3),
        collectedById: technician.id,
      },
    });

    console.log("Seeding sample remediation items...");
    await prisma.remediationItem.create({
      data: {
        title: "Finish rollout of automated offsite backup testing",
        description: "Backups run nightly but restoration has not been test-verified this quarter.",
        organizationId: organization.id,
        controlAssessmentId: controlAssessments.get("110")!.id,
        ownerId: technician.id,
        priority: "MEDIUM",
        status: "IN_PROGRESS",
        dueDate: daysFromNow(21),
      },
    });
    await prisma.remediationItem.create({
      data: {
        title: "Remediate critical vulnerabilities on public-facing servers",
        description: "Scan identified 3 critical CVEs on internet-facing hosts.",
        organizationId: organization.id,
        controlAssessmentId: controlAssessments.get("120")!.id,
        ownerId: technician.id,
        priority: "HIGH",
        status: "OPEN",
        dueDate: daysFromNow(-10), // intentionally overdue, for dashboard demo
      },
    });
    await prisma.remediationItem.create({
      data: {
        title: "Deploy EDR agent to remaining unmanaged endpoints",
        description: "12 of 65 endpoints still lack the EDR agent.",
        organizationId: organization.id,
        controlAssessmentId: controlAssessments.get("140")!.id,
        ownerId: technician.id,
        priority: "CRITICAL",
        status: "OPEN",
        dueDate: daysFromNow(-3), // intentionally overdue, for dashboard demo
      },
    });
    await prisma.remediationItem.create({
      data: {
        title: "Schedule security awareness training kickoff",
        description: "No training program in place yet; vendor selection in progress.",
        organizationId: organization.id,
        controlAssessmentId: controlAssessments.get("130")!.id,
        ownerId: assessor.id,
        priority: "MEDIUM",
        status: "OPEN",
        dueDate: daysFromNow(30),
      },
    });
  }

  console.log(`Seed complete. System user: ${systemUser.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
