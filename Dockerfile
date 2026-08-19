FROM node:22-bookworm-slim AS build

RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile=false

COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

FROM node:22-bookworm-slim

RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile=false
COPY --from=build /app/dist ./dist

RUN mkdir -p /data && chown -R node:node /data /app
USER node

EXPOSE 8787
CMD ["node", "dist/index.js"]
