# Chronicle Architecture

Chronicle records software development decisions as an event-sourced graph. Git answers what changed in code; Chronicle answers why a decision was made.

## Phase 1 Scope

This phase establishes the project foundation:

- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- Hono mounted under `/api`
- Prisma configured for Neon PostgreSQL
- Better Auth-compatible database models
- Vitest configuration
- Initial domain and server directory boundaries

Feature implementation begins in later phases.

## Phase 2 Scope

Phase 2 adds the authentication foundation:

- Better Auth server configuration in `src/server/auth/auth.ts`
- Prisma adapter backed by the existing Better Auth tables
- Next.js auth route at `/api/auth/*`
- Email/password registration and login pages
- Client-side Better Auth helper in `src/lib/auth-client.ts`
- Server-side session helper in `src/server/auth/session.ts`
- Protected `/projects` page with logout

Auth records remain normal relational rows. They are intentionally not included in the Chronicle event stream.

## Core Decisions

- Authentication data is stored normally through Better Auth and is not event sourced.
- Decision history is append-only.
- Project events use a per-project `version` with a unique `(projectId, version)` constraint.
- Current state will be reconstructed by applying events in ascending version order.
- Commands and queries will be kept separate so write-side validation and read-side projections can evolve independently.
- Domain logic must live outside React components and API route handlers.
- Event reducers must be pure functions and covered by unit tests.
