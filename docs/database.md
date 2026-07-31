# Database Setup

Chronicle uses Neon PostgreSQL through Prisma.

## Environment

Create `.env.local` using `.env.example` as the field reference, then set:

```txt
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
SHADOW_DATABASE_URL="postgresql://user:password@host/shadow_database?sslmode=require"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="replace-with-a-long-random-secret"
```

`BETTER_AUTH_SECRET` must be replaced with a long random value before production.

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
