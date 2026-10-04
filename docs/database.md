# Database Setup

Chronicle uses Neon PostgreSQL through Prisma.

## Environment

Create `.env.local` using `.env.example` as the field reference, then set:

```txt
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
SHADOW_DATABASE_URL="postgresql://user:password@host/shadow_database?sslmode=require"
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="replace-with-a-long-random-secret"
```

`BETTER_AUTH_SECRET` must be generated randomly (at least 32 characters) in every environment. Placeholder values are rejected. Production requires an HTTPS `BETTER_AUTH_URL`.

Runtime uses `@prisma/adapter-pg` and the Neon TCP/pooler `DATABASE_URL`, retaining `sslmode=require`. Optionally set `DIRECT_URL` to the non-pooler URL for Prisma CLI commands. CLI validation reports only configuration keys, never connection values.

`SHADOW_DATABASE_URL` is optional for simple deploys, but Prisma requires it for some migration diff and development workflows. Use a separate Neon database or branch for it.

## Commands

```txt
npm run prisma:generate
npm run prisma:migrate
npm run prisma:validate
```

Use `npm run prisma:deploy` from the approved migration workflow or another controlled deployment step. Do not run migrations automatically from preview builds.

## Tables

Better Auth owns:

- `user`
- `session`
- `account`
- `verification`

Chronicle owns:

- `project`
- `event`

The `event` table stores append-only domain events. Event order is guaranteed per project by the unique `(projectId, version)` constraint.
