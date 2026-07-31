# Docker Self-Hosting

Chronicle can run without Vercel on any machine that supports Docker Compose. Neon PostgreSQL remains the database service.

## Requirements

- Docker Engine and Docker Compose
- A configured `.env.local` containing `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `NEXT_PUBLIC_APP_URL`

For a server deployment, set the two application URL values to the public HTTPS domain. For a local machine, use `http://localhost:3000`.

## Start

Apply database migrations before starting a new release:

```sh
docker compose --profile migration run --rm migrate
```

Then build and run the application:

```sh
docker compose up --build -d app
```

Chronicle listens on port `3000`. Put a reverse proxy with HTTPS in front of it when deploying to a public server.

## Update

After pulling a new application version, review migrations, run the migration command above, then recreate the app container:

```sh
docker compose up --build -d app
```

## Operational Checks

- `curl http://localhost:3000/api/health` returns the Chronicle health response.
- Registration and login work with the configured application URL.
- `.env.local` stays only on the deployment machine and is never copied into the image.
