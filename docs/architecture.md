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

## Phase 3 Scope

Phase 3 establishes the database baseline:

- Prisma is configured for PostgreSQL with Prisma 7 driver adapters.
- Runtime database access uses `@prisma/adapter-pg`.
- The initial migration creates Better Auth tables plus Chronicle `project` and `event` tables.
- `event` keeps append-only project event streams with a unique `(projectId, version)` constraint.
- Neon should be configured through `DATABASE_URL` with SSL enabled.

Migrations should be applied with `npm run prisma:migrate` in development and `npm run prisma:deploy` in deployment environments.

## Phase 4 Scope

Phase 4 adds the project domain model:

- Project events are represented as a TypeScript discriminated union.
- `ProjectState` is rebuilt only by applying ordered events.
- `reduceProjectEvents` is a pure function with no framework, API, or database dependency.
- Reducer invariants reject missing versions, duplicate creates, unknown decisions, unknown alternatives, unknown relations, cross-project events, and self-relations.
- `diffProjectStates` compares two reconstructed states for version comparison screens.
- Domain tests cover event replay, invalid streams, and state comparison.

## Phase 5 Scope

Phase 5 adds the event store boundary:

- Command services will append `ProjectEventDraft` values without assigning versions.
- `ProjectEventStore.append` assigns event ids, timestamps, and contiguous per-project versions.
- `expectedVersion` is checked inside the append operation and stale writes raise `EventStoreConcurrencyError`.
- The Prisma implementation persists events in a transaction and relies on the unique `(projectId, version)` constraint as a final race-condition guard.
- `ProjectCreated` also creates the relational `project` row used for ownership and project listing.
- Reads always return events ordered by ascending `version`, optionally bounded by version or timestamp.

## Phase 6 Scope

Phase 6 adds command services:

- API handlers will call `ProjectCommandService` rather than writing domain logic directly.
- Commands are validated with zod schemas before event creation.
- Non-create commands load current state from events and require `state.ownerId === actorId`.
- Commands generate event drafts only; the event store assigns ids, timestamps, and versions.
- Command results include both appended events and the rebuilt project state.
- Stale writes are surfaced through `EventStoreConcurrencyError`.

## Phase 7 Scope

Phase 7 adds query services:

- Query services read events and rebuild state with the domain reducer.
- Project listing reads the relational `project` table through a `ProjectReader` port.
- Read authorization checks project ownership before returning events, state, comparisons, or graph data.
- `getProjectStateAtVersion` supports historical reconstruction by event version.
- `compareProjectVersions` produces a `ProjectDiff` between two rebuilt states.
- `getProjectGraph` returns React Flow compatible nodes and edges without coupling React components to domain logic.

## Phase 8 Scope

Phase 8 connects the application layer to HTTP:

- Hono routes are mounted under `/api` through the Next.js catch-all route.
- `/api/auth/*` remains owned by Better Auth.
- Project APIs require a Better Auth session and use the session user id as `actorId`.
- API handlers do not contain domain mutation logic; they delegate to command and query services.
- Request bodies are parsed as JSON objects, then validated by command zod schemas in the application layer.
- Route params and query params are validated at the HTTP boundary.
- Application errors are mapped to stable HTTP status codes, including `409 Conflict` for version races.

## Phase 9 Scope

Phase 9 provides the authenticated Chronicle workspace:

- `/projects` lists owned projects and appends a `ProjectCreated` event through the API.
- `/projects/[projectId]` edits decisions, alternatives, status, reasons, and relations only through command endpoints.
- The workspace sends the current project version as `expectedVersion`; a `409 Conflict` reloads the latest event-derived state.
- The event timeline offers reconstruction comparisons between a historical version and the current version.
- React Flow renders the query-side graph projection. Node placement remains a read-model concern, not persisted domain state.

## Core Decisions

- Authentication data is stored normally through Better Auth and is not event sourced.
- Decision history is append-only.
- Project events use a per-project `version` with a unique `(projectId, version)` constraint.
- Current state will be reconstructed by applying events in ascending version order.
- Commands and queries will be kept separate so write-side validation and read-side projections can evolve independently.
- Domain logic must live outside React components and API route handlers.
- Event reducers must be pure functions and covered by unit tests.
