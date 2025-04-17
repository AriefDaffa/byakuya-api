FROM oven/bun:1.0.33

WORKDIR /app

COPY backend/package.json backend/bun.lockb ./
RUN bun install

COPY backend .

EXPOSE 3001

# Run migration then start the server
CMD bunx prisma migrate deploy && bun run start
