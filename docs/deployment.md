# Vercel Deployment

Chronicle deploys as a Next.js application on Vercel. The project does not need a custom Vercel build command.

## 1. Prepare Neon

Create a Neon PostgreSQL database and keep its connection string available for Vercel and the migration workflow. The application uses Prisma migrations in `prisma/migrations`.

## 2. Configure Vercel

Import the Git repository into Vercel. In Project Settings, add these environment variables for Production, Preview, and Development as appropriate:

| Variable | Production value |
| --- | --- |
| `DATABASE_URL` | Neon connection string with SSL enabled. |
| `BETTER_AUTH_SECRET` | A unique, long random secret. |
| `BETTER_AUTH_URL` | `https://your-production-domain` |
| `NEXT_PUBLIC_APP_URL` | `https://your-production-domain` |

Preview deployments using Better Auth should use a stable configured URL or separate auth environments. Do not point a preview deployment at a production auth URL unless that behavior is intentional.

## 3. Apply Migrations

Database migrations are intentionally separate from the Vercel build. This prevents a preview build from modifying the production schema.

In GitHub repository secrets, add `DATABASE_URL` for the target Neon database. Then run the `Database Migrate` workflow manually after reviewing the migration. The workflow executes `npm run prisma:deploy`.

For the first deployment, run the migration before opening registration to users.

## 4. Deploy

Push to the connected branch or deploy from Vercel. Vercel runs `npm run build`, which generates Prisma Client before Next.js creates the production bundle.

## Operational Checks

- `GET /api/health` returns the service health response.
- Registration and login work against the configured production domain.
- A project can be created and a decision event increments its project version.
- Vercel environment variables must never be committed to Git.
