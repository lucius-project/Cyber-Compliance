import { z } from "zod";

// Shared primitives -----------------------------------------------------

const optionalTrimmed = z
  .string()
  .trim()
  .transform((v) => (v.length === 0 ? undefined : v))
  .optional();

const optionalDate = z
  .string()
  .trim()
  .transform((v) => (v.length === 0 ? undefined : new Date(v)))
  .optional();

/** Only http/https external references are accepted, to avoid javascript:/data: URIs. */
const optionalSafeUrl = z
  .string()
  .trim()
  .transform((v) => (v.length === 0 ? undefined : v))
  .optional()
  .refine((v) => !v || /^https?:\/\//i.test(v), {
    message: "URL must start with http:// or https://",
  });

// Organizations -----------------------------------------------------------

export const organizationSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  legalName: optionalTrimmed,
  primaryContact: optionalTrimmed,
  email: z.union([z.literal(""), z.string().trim().email()]).optional(),
  phone: optionalTrimmed,
  industry: optionalTrimmed,
  employeeCount: z.coerce.number().int().nonnegative().optional().or(z.literal("").transform(() => undefined)),
  endpointCount: z.coerce.number().int().nonnegative().optional().or(z.literal("").transform(() => undefined)),
  serverCount: z.coerce.number().int().nonnegative().optional().or(z.literal("").transform(() => undefined)),
  location: optionalTrimmed,
  notes: optionalTrimmed,
});

/** A person at a client organization, stored as a `User` so they can own tasks. */
export const personSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().toLowerCase().email("A valid email is required"),
  title: optionalTrimmed,
  role: z.enum(["ADMIN", "ASSESSOR", "TECHNICIAN", "CLIENT"]).default("CLIENT"),
});

// Controls ------------------------------------------------------------------

export const controlSchema = z.object({
  controlNumber: z.string().trim().min(1, "Control number is required"),
  name: z.string().trim().min(1, "Name is required"),
  description: optionalTrimmed,
  guidance: optionalTrimmed,
  category: optionalTrimmed,
});

// Frameworks ------------------------------------------------------------------

export const frameworkSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  version: optionalTrimmed,
  description: optionalTrimmed,
});

// Assessments -----------------------------------------------------------------

export const assessmentSchema = z.object({
  organizationId: z.string().trim().min(1, "Organization is required"),
  name: z.string().trim().min(1, "Name is required"),
  assessmentDate: optionalDate,
  assessorId: optionalTrimmed,
  notes: optionalTrimmed,
  frameworkIds: z.array(z.string().trim().min(1)).min(1, "Select at least one framework"),
});

export const controlAssessmentUpdateSchema = z.object({
  controlAssessmentId: z.string().trim().min(1),
  status: z.enum(["NOT_ASSESSED", "NOT_STARTED", "IN_PROGRESS", "IMPLEMENTED", "NOT_APPLICABLE"]),
  isApplicable: z.coerce.boolean().optional(),
  ownerId: optionalTrimmed,
  assessorId: optionalTrimmed,
  notes: optionalTrimmed,
  lastReviewedAt: optionalDate,
  nextReviewAt: optionalDate,
});

// Evidence ----------------------------------------------------------------

export const evidenceSchema = z.object({
  controlAssessmentId: z.string().trim().min(1),
  title: z.string().trim().min(1, "Title is required"),
  description: optionalTrimmed,
  evidenceType: z.enum([
    "SCREENSHOT",
    "POLICY",
    "BACKUP_REPORT",
    "VULNERABILITY_REPORT",
    "SECURITY_AWARENESS_REPORT",
    "CONFIGURATION_EXPORT",
    "TICKET",
    "EXTERNAL_URL",
    "ASSESSMENT_DOCUMENT",
    "OTHER",
  ]),
  fileReference: optionalTrimmed,
  externalUrl: optionalSafeUrl,
  dateCollected: optionalDate,
  reviewDate: optionalDate,
  notes: optionalTrimmed,
});

// Remediation ---------------------------------------------------------------

// Meetings ------------------------------------------------------------------

export const meetingScheduleSchema = z.object({
  assessmentId: z.string().trim().min(1),
  startDate: z.string().trim().min(1, "Start date is required"),
  startTime: z.string().trim().min(1, "Start time is required"),
  intervalDays: z.coerce.number().int().positive().default(14),
  controlsPerMeeting: z.coerce.number().int().positive().max(20).default(3),
});

export const meetingNotesSchema = z.object({
  meetingId: z.string().trim().min(1),
  notes: optionalTrimmed,
});

export const remediationSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: optionalTrimmed,
  organizationId: z.string().trim().min(1),
  controlAssessmentId: optionalTrimmed,
  ownerId: optionalTrimmed,
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  status: z.enum(["OPEN", "IN_PROGRESS", "BLOCKED", "COMPLETED", "ACCEPTED_RISK"]),
  dueDate: optionalDate,
  notes: optionalTrimmed,
});
