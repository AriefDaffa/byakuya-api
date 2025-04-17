FROM oven/bun:1.0.33

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install

COPY . .

EXPOSE 3001

# Run migration then start the server
CMD bunx prisma generate && bunx prisma migrate deploy && bun run start

