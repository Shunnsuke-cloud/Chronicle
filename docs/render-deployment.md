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


## 3. Apply Migrations

Before registration is opened, apply the committed Prisma migration from a controlled machine with the production `DATABASE_URL`:

```sh
npm run prisma:deploy
```

The GitHub Actions `Database Migrate` workflow is also suitable after its `DATABASE_URL` secret is set.

## 4. Verify

- Open `https://your-service.onrender.com/api/health` and confirm a 200 response with `database: reachable`. DB failures return 503.
- Open the root page, register an account, and sign in.
- Create a project and verify an event is recorded.

Render supports Docker builds and Blueprint environment variables; see the official [Docker deployment documentation](https://render.com/docs/docker) and [Blueprint specification](https://render.com/docs/blueprint-spec).
