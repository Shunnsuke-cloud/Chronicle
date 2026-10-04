FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
# Prisma Client generation and Next.js compilation do not need the production database.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/chronicle" BETTER_AUTH_URL="https://build.invalid" BETTER_AUTH_SECRET="build-only-secret-never-used-at-runtime-0123456789" npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 chronicle && adduser --system --uid 1001 chronicle
COPY --from=build --chown=chronicle:chronicle /app/public ./public
COPY --from=build --chown=chronicle:chronicle /app/.next/standalone ./
COPY --from=build --chown=chronicle:chronicle /app/.next/static ./.next/static
COPY --from=build --chown=chronicle:chronicle /app/scripts/check-db.mjs ./scripts/check-db.mjs
USER chronicle
EXPOSE 3000
CMD ["node", "server.js"]
