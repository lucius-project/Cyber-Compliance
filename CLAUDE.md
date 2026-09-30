# CLAUDE.md

Guidance for future Claude Code sessions working in this repository.

## Project purpose

Cyber Compliance is an internal MSP tool for tracking client cybersecurity
compliance and cyber-insurability readiness across multiple frameworks
(initially Cyber Insurability 2025, CIS v8, PIPEDA). One master control can
map to requirements in several frameworks at once.

## Existing application safety (read this first)

This machine also runs other, unrelated Docker applications:

- `datastream-command-center` on host port **3001**
- `automated-blog-writer` on host ports **3100/3101** (plus its own Postgres/Redis)

**Never** run `docker system prune`, `docker container prune`, `docker volume
prune`, `docker network prune`, or any command that stops/removes a container,
network, volume, or image that isn't prefixed `cyber-compliance`. This
project's Docker Compose project is named `cyber-compliance`; every resource
it creates (`cyber-compliance-app`, `cyber-compliance-db`,
`cyber-compliance-net`, `cyber-compliance-pgdata`) is isolated to that
namespace. Scope every `docker compose` command to this directory
(`docker compose -p cyber-compliance ...` or just run it from here) so it can
never touch another project's containers.

Cyber Compliance must stay on host port **3200**
(`http://localhost:3200`). Do not change this without being asked.

## Architecture

- **Next.js App Router + TypeScript**, React Server Components by default.
  Every page reads live data straight from Postgres via Prisma - there is no
  cached/static rendering (`export const dynamic = "force-dynamic"` in
  `src/app/layout.tsx`), and no compliance percentage is ever stored; it is
  always derived from current `ControlAssessment` rows
  (`src/lib/compliance.ts`).
- **Mutations are Server Actions** (`src/lib/actions/*.ts`), not a separate
  REST/API layer - there is intentionally no `src/app/api/`. Forms call
  actions directly; list/detail pages call `revalidatePath` after a mutation.
- **Next.js 16 breaking changes to remember**: `params` and `searchParams` on
  pages are `Promise`s - always `await` them. Cache Components
  (`cacheComponents: true`) is **not** enabled, so the older, simpler caching
  model applies (a page is either static or dynamic; we force dynamic
  everywhere) - do not add `"use cache"` or Suspense-for-caching patterns
  without enabling that flag first, they won't do anything.
- **Prisma is pinned to 6.x**, not 7. Prisma 7 moved connection config out of
  `schema.prisma` into `prisma.config.ts` + driver adapters, which is a much
  larger architectural change than this project needs. Don't upgrade to
  Prisma 7 without deliberately taking on that migration.
- **Audit trail**: every meaningful mutation calls `recordAuditLog()`
  (`src/lib/audit.ts`), which writes an `AuditLog` row with before/after JSON.
  Add a call there for any new mutation that changes compliance-relevant
  state.
- **No auth yet**: `src/lib/system-user.ts` resolves a single seeded "system"
  user (via `SEED_SYSTEM_USER_EMAIL`) used for `ownerId`/`actorId` on every
  mutation. When real auth is added, swap `getActingUserId()` for a session
  lookup - that's the only place mutation code should need to change. The
  `User.role` enum (`ADMIN`/`ASSESSOR`/`TECHNICIAN`/`CLIENT`) already exists
  for that future work.

## Database model (see `prisma/schema.prisma` for the full picture)

The core design rule: **master `Control` rows never carry an organization's
implementation status.** Status/owner/evidence/notes live on
`ControlAssessment`, which belongs to one `Assessment` (which belongs to one
`Organization`). This is what lets the same control be assessed
independently, and differently, for every client, and lets assessments be
preserved historically instead of overwritten.

- `Framework` → `FrameworkRequirement` (e.g. CIS v8 → "5.2"). Adding a new
  framework is a data operation (new rows), never a schema change.
- `Control` ↔ `FrameworkRequirement` via the explicit join model
  `ControlFrameworkMapping` - many-to-many, so one control (e.g. "Control
  100") can map to CIS v8 5.2, Cyber Insurability 2025 AP-1, and PIPEDA 4.7.3
  simultaneously without being duplicated.
- `Organization` → `Assessment` → `AssessmentFramework` (join, since one
  assessment can cover multiple frameworks) and → `ControlAssessment` (one
  row per control included in that assessment).
- `ControlAssessment` → `Evidence` (many) and → `RemediationItem` (many).
- `AuditLog` is a generic entity/action/before/after trail, not tied to a
  specific table.
- People at a client are `User` rows with `organizationId` set (MSP staff
  have none), so they can own controls and remediation items.

## Coding conventions

- UI primitives in `src/components/ui/` are small hand-rolled shadcn-style
  components (Tailwind + `class-variance-authority` + a few Radix
  primitives) - keep new ones consistent with that style rather than pulling
  in the full shadcn CLI.
- Status/priority enums get a dedicated badge component in
  `src/components/status-badges.tsx` - add new enum values there, not as ad
  hoc `<Badge>` colors scattered across pages.
- Forms use native `<form action={serverAction}>` with `useActionState` +
  `useFormStatus` (`src/components/submit-button.tsx`,
  `src/components/form-error.tsx`) for pending/error state - no client-side
  form library.
- Validation lives in `src/lib/validation.ts` (Zod). Server actions parse
  `Object.fromEntries(formData)` through the relevant schema before touching
  Prisma.
- To bind extra arguments (e.g. an id) to a server action used as a
  `<form action>`, use `.bind(null, id)` - see
  `updateOrganization.bind(null, organization.id)` for the pattern.

## Development commands

```bash
npm run dev          # Next.js dev server (needs DATABASE_URL reachable, e.g. published Postgres port)
npm run build         # production build (no DB access required - dynamic rendering only)
npm run lint           # ESLint
npx tsc --noEmit        # type check
npm run db:migrate       # prisma migrate dev (schema changes, local)
npm run db:deploy         # prisma migrate deploy (apply existing migrations)
npm run db:seed            # prisma db seed (idempotent - safe to re-run)
npm run db:studio           # Prisma Studio
```

## Docker commands

Primary workflow - everything runs in containers, migrations and seeding
happen automatically on `app` container start (`docker-entrypoint.sh`):

```bash
docker compose up -d --build   # build and start (app on :3200, db internal-only)
docker compose logs -f app      # follow app logs
docker compose down              # stop THIS project only (safe - scoped by compose project name "cyber-compliance")
```

Postgres does not publish port 5432 to the host by default (see
`docker-compose.yml` for how to enable it temporarily if you need a local DB
client).

## Control CSV import

`src/lib/actions/import.ts` + `/controls/import`. Expects
`control_number,control_name,description,category,deprecated,framework,framework_requirement`
columns; a control number repeated across rows (once per framework mapping)
is recognized as the same control and only mapped, never duplicated. This is
the intended path for loading the ~170-control library mentioned in the
original project brief - do not hand-write that many `Control` rows into the
seed script.

## Known accepted issues

- `npm audit` reports a transitive high-severity advisory in `deepmerge-ts`
  via `@prisma/config` (a Prisma CLI/dev-tool dependency, not reachable from
  the running application). Fixing it via `npm audit fix --force` would
  downgrade Prisma to an older 6.x patch; not worth it for a dev-tool-only,
  non-runtime advisory. Re-check when bumping Prisma.
