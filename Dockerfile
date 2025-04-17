FROM oven/bun:1.0.33

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install

COPY . .

EXPOSE 3001

# Run migration then start the server
CMD bunx prisma migrate deploy && bun run start
