import { createContext } from "./context";
import { appRouter } from "./routers";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { logger } from "../lib/utils/logger";
import { WebSocketServer } from "ws";

const wss = new WebSocketServer({
  port: 3001,
});

const handler = applyWSSHandler({
  wss,
  router: appRouter,
  createContext,
  keepAlive: {
    enabled: true,
    // server ping message interval in milliseconds
    pingMs: 10000,
    // connection is terminated if pong message is not received in this many milliseconds
    pongWaitMs: 3000,
  },
});

wss.on("connection", (ws) => {
  logger.info(`➕ Connection established (${wss.clients.size} total)`);
  ws.once("close", () => {
    logger.info(`➖ Connection closed (${wss.clients.size} total)`);
  });
});
logger.info("WebSocket Server listening on ws://localhost:3001");

process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down WebSocket server...");
  handler.broadcastReconnectNotification();
  wss.close();
});

// Handler for Ctrl+C
process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down WebSocket server...");
  handler.broadcastReconnectNotification();
  wss.close();
});
