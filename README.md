# Coop Voting App

Small-scale coop election system built with Next.js App Router, Prisma, Supabase Postgres, TypeScript, and Tailwind.

## Core Features

- Admin authentication with HTTP-only signed session cookie.
- Admin user stored in Supabase via Prisma `AdminUser` table.
- Admin dashboard:
  - Position CRUD (`name`, `maxWinners`, `displayOrder`)
  - Candidate CRUD with position assignment
  - Voter CRUD + bulk import via coop IDs
  - Election open/close control
  - Live tally summary and CSV export
- Voter dashboard:
  - Coop ID entry and eligibility checks
  - Ballot form grouped by position
  - Per-position max selection guardrails
  - One-time transactional ballot submission
- Integrity controls:
  - DB uniqueness + relationship constraints
  - DB triggers for ballot immutability and selection integrity
  - Server-side zod validation and rate limiting

## Environment Variables

Copy `.env.example` values into `.env` and set secure values:

```env
DATABASE_URL="postgresql://postgres.your-project-ref:your-password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require"
DIRECT_URL="postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres?sslmode=require"
SESSION_SECRET="replace-with-a-long-random-secret"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="replace-with-a-strong-password"
```

`SESSION_SECRET` should be at least 16 characters.
`DATABASE_URL` should use Supabase pooler URL (port `6543`), and `DIRECT_URL` should use the direct database URL (port `5432`) for migrations.
`ADMIN_USERNAME` and `ADMIN_PASSWORD` are used by `npm run db:seed` to create/update the admin user record in Supabase.

## Setup

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://localhost:3000

## Routes

- `/admin/login`
- `/admin/summary`
- `/admin/positions`
- `/admin/candidates`
- `/admin/voters`
- `/vote`
- `/vote/ballot`
- `/vote/success`

## Tests

Rule-focused tests for ballot validation are under `tests/voting-rules.test.ts`.

Run:

```bash
npm test
```
