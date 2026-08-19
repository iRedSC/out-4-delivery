import { timingSafeEqual } from "node:crypto";
import sensible from "@fastify/sensible";
import Fastify, { type FastifyInstance } from "fastify";
import type { Config } from "./config.js";
import type { ParcelDatabase } from "./database.js";
import type { ParcelSync } from "./sync.js";

type ServerDependencies = {
  config: Config;
  database: ParcelDatabase;
  sync: ParcelSync;
};

export async function createServer(dependencies: ServerDependencies): Promise<FastifyInstance> {
  const { config, database, sync } = dependencies;
  const server = Fastify({ logger: { level: config.LOG_LEVEL } });
  await server.register(sensible);

  server.addHook("onRequest", async (request, reply) => {
    if (request.url === "/health") return;
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, "") ?? "";
    if (!matchesApiKey(token, config.API_KEY)) {
      return reply.unauthorized("A valid bearer token is required");
    }
  });

  server.get("/health", async () => ({ status: "ok" }));

  server.get("/api/packages", async () => ({
    packages: database.listPackages(),
    syncedAt: new Date().toISOString(),
  }));

  server.post("/api/sync", async () => sync.run());

  return server;
}

export function matchesApiKey(candidate: string, expected: string): boolean {
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);
  return candidateBuffer.length === expectedBuffer.length
    && timingSafeEqual(candidateBuffer, expectedBuffer);
}
