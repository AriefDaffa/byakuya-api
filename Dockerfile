FROM oven/bun:1.0.33

WORKDIR /app

COPY backend/bun.lockb backend/package.json ./
RUN bun install

COPY backend .

EXPOSE 3001

CMD ["bun", "run", "start"]
