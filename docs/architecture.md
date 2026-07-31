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

## Core Decisions

- Authentication data is stored normally through Better Auth and is not event sourced.
- Decision history is append-only.
- Project events use a per-project `version` with a unique `(projectId, version)` constraint.
- Current state will be reconstructed by applying events in ascending version order.
- Commands and queries will be kept separate so write-side validation and read-side projections can evolve independently.
- Domain logic must live outside React components and API route handlers.
- Event reducers must be pure functions and covered by unit tests.
