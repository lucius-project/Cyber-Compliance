# Cyber Compliance

An MSP cybersecurity compliance and cyber-insurability readiness tracker.
Supports multiple compliance frameworks (Cyber Insurability 2025, CIS v8,
PIPEDA to start) and lets one master control map to requirements in several
frameworks at once, tracked independently per client organization.

This is a standalone project, fully isolated from any other Docker
application on this machine: its own Compose project (`cyber-compliance`),
network, volume, and database. It runs at **http://localhost:3200**.

## Prerequisites

- Docker Desktop (with the WSL integration enabled, if on Windows/WSL)
- Node.js 22+ and npm (only needed for local, non-Docker development)

## First-time setup

1. Copy the environment template and adjust the password if you'd like:

   ```bash
   cp .env.example .env
   ```

2. Build and start the app + database:

   ```bash
   docker compose up -d --build
   ```

   On first start, the app container automatically runs Prisma migrations
   and seeds sample data (safe to re-run on every start - seeding is
   idempotent).

3. Open **http://localhost:3200**.

The seeded sample data includes one demo organization ("DataStream
Networks", clearly marked as sample data in its notes field), the three
initial frameworks with example requirements, ten sample master controls
(including "Control 100" mapped to all three frameworks, as in the original
spec), and one in-progress assessment with a mix of control statuses and a
couple of overdue remediation items so the dashboard has something to show.

## Everyday commands

```bash
docker compose up -d --build     # (re)build and start
docker compose logs -f app        # follow application logs
docker compose logs -f db          # follow database logs
docker compose ps                   # see this project's containers only
docker compose down                  # stop and remove THIS project's containers (data volume is preserved)
docker compose down -v                # also remove the database volume (data loss)
```

All `docker compose` commands here are scoped to the `cyber-compliance`
Compose project (see the `name:` key in `docker-compose.yml`) and only ever
affect this project's own containers, network, and volume - they will not
touch any other Docker application on this machine.

### Running migrations / seed manually

Normally you don't need to - the app container does this on every start.
If you do:

```bash
docker compose exec app npx prisma migrate deploy
docker compose exec app npx prisma db seed
```

### Applying a schema change

1. Edit `prisma/schema.prisma`.
2. Generate a migration. Since Postgres isn't published to the host by
   default, either run this inside the app container:

   ```bash
   docker compose exec app npx prisma migrate dev --name <change-name>
   ```

   or temporarily uncomment the `ports` mapping under the `db` service in
   `docker-compose.yml`, run `npm run db:migrate` from the host, then remove
   the mapping again.

## Local (non-Docker) development

Useful for fast iteration with `next dev`. Requires Postgres reachable from
the host - either temporarily publish the `db` service's port (see above) or
point `DATABASE_URL` in `.env` at a Postgres instance of your own.

```bash
npm install
npm run db:migrate     # applies schema + creates the local dev database
npm run db:seed
npm run dev              # http://localhost:3000 (not 3200 - that's the Docker-only mapping)
```

## Importing the real control library

Phase 1 seeds a handful of sample controls only. To load the full ~170-item
control library, use **Controls → Import CSV** in the app (or `POST` the
same Server Action programmatically). Expected columns:

```
control_number,control_name,description,category,deprecated,framework,framework_requirement
```

A `control_number` that repeats across multiple rows (once per framework
it maps to) is recognized as the same master control and only mapped to
each additional framework requirement - it is never duplicated. The import
page shows a row-by-row summary and any errors after each run.

## Project structure

```
prisma/schema.prisma        Data model (see CLAUDE.md for the relationships)
prisma/seed.ts               Idempotent sample data
src/app/                      Pages (Next.js App Router)
src/components/                 UI components (shadcn-style primitives in ui/)
src/lib/actions/                 Server Actions (all mutations)
src/lib/                          Prisma client, validation, compliance calculations, audit logging
```

See `CLAUDE.md` for architecture notes, coding conventions, and rules for
future changes to this repository.

## Known limitations (Phase 1)

- No authentication/login yet - all actions are attributed to one seeded
  system user. The `User` model and role enum already exist for when auth is
  added.
- Evidence stores a file reference/URL, not actual file uploads - cloud file
  storage is planned for a later phase.
- Reports are a live-data foundation, not exportable documents - PDF
  generation is planned for a later phase.
- No email notifications, billing, or external integrations.

## Recommended Phase 2 work

- Authentication (swap `getActingUserId()` in `src/lib/system-user.ts` for a
  real session) and role-based access control using the existing `UserRole`
  enum.
- File upload storage for Evidence.
- PDF export for the report types already scaffolded under `/reports`.
- Import of the full ~170-control library via the CSV importer.
- Progress-over-time charting once there are multiple historical assessments
  per organization to compare.
