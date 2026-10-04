# Render Deployment

Chronicle can be deployed as a Docker Web Service on Render. The repository includes `render.yaml`, which defines the service, health check, and required environment variables.

## 1. Create a Render Web Service

1. Create or sign in to a Render account.
2. Connect the Git repository that contains Chronicle.
3. Choose **New** then **Blueprint** and select the repository.
4. Render reads `render.yaml` and creates the `chronicle` Docker web service.

Render builds the repository Dockerfile and routes its health check to `/api/health`.

## 2. Set Environment Variables

Set these values in the Render service Environment page:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Neon PostgreSQL connection string with SSL enabled |
| `BETTER_AUTH_URL` | Render service URL, for example `https://chronicle.onrender.com` |
| `DIRECT_URL` | Optional non-pooler Neon URL for migration jobs; omit to use DATABASE_URL |

Render generates `BETTER_AUTH_SECRET` from `render.yaml`. Replace it only through the Render dashboard when intentionally rotating authentication sessions.

Enter connection values as bare URLs, without surrounding quotes, `DATABASE_URL=`, or `psql` commands. Leave `DIRECT_URL` unset unless a valid direct connection is available; it takes precedence over `DATABASE_URL` for Prisma CLI commands. `SHADOW_DATABASE_URL` is unnecessary for production deploys and should be unset unless deliberately configured for development. CLI configuration errors identify the offending variable without printing its value. Runtime Neon connections still require explicit SSL settings.


## 3. Apply Migrations

Before registration is opened, apply the committed Prisma migration from a controlled machine with the production `DATABASE_URL`:

```sh
npm run prisma:deploy
```

The GitHub Actions `Database Migrate` workflow is also suitable after its `DATABASE_URL` secret is set.

## 4. Verify

For runtime `DriverAdapterError: DatabaseNotReachable`, run `node scripts/check-db.mjs` in the Render service Shell after deploying this version. This uses the service's existing `DATABASE_URL` and makes only a DNS lookup and `SELECT 1`. Do not paste connection strings into the command. The Docker image includes this script; `npm run db:check` is also available in a full repository checkout.

Only share the resulting `database_check` JSON lines. `stage: dns` with `ENOTFOUND` points to hostname resolution; `ECONNREFUSED` points to a rejected TCP connection; `ETIMEDOUT` points to a timeout; `28P01` points to authentication failure. Check the selected Neon endpoint and its availability, connection hostname/port, credentials, and any configured network restrictions according to the result. `UNCLASSIFIED` needs further investigation and is not proof of a particular cause. Success confirms connectivity from that service at that time, not migration state.

- Open `https://your-service.onrender.com/api/health` and confirm a 200 response with `database: reachable`. DB failures return 503.
- Open the root page, register an account, and sign in.
- Create a project and verify an event is recorded.

Render supports Docker builds and Blueprint environment variables; see the official [Docker deployment documentation](https://render.com/docs/docker) and [Blueprint specification](https://render.com/docs/blueprint-spec).
