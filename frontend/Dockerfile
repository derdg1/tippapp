FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install
COPY . .
RUN bun run build

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./
EXPOSE 3000
ENV PORT=3000
CMD ["bun", "./build/index.js"]
