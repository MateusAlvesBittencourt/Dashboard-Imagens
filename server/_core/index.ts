import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

// Global error handlers
process.on("uncaughtException", (err: any) => {
  console.error(`[Uncaught Exception] ${err?.message || String(err)}`);
  console.error(err?.stack);
  // Don't exit - let the server keep running
});

process.on("unhandledRejection", (reason: any) => {
  console.error(`[Unhandled Rejection] ${reason?.message || String(reason)}`);
  if (reason?.stack) console.error(reason.stack);
  // Don't exit - let the server keep running
});

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Rota simples de saúde para diagnósticos rápidos
  app.get("/healthz", (_req, res) => {
    res.status(200).json({ ok: true, mode: process.env.NODE_ENV || "development" });
  });
  // tRPC API - deve vir ANTES do setup do Vite para não ser interceptado
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    console.log("[Init] Setting up Vite middleware...");
    setupVite(app, server).then(() => {
      console.log("[Init] Vite middleware setup complete");
      listenServer(server);
    }).catch(err => {
      console.error(`[Startup Error] ${err?.message || String(err)}`);
    });
  } else {
    console.log("[Init] Using static file serving");
    serveStatic(app);
    listenServer(server);
  }
}

function listenServer(server: any) {
  const preferredPort = parseInt(process.env.PORT || "3000");
  console.log(`[Init] Checking port availability starting from ${preferredPort}...`);
  
  findAvailablePort(preferredPort).then(port => {
    console.log(`[Init] Port ${port} is available`);

    if (port !== preferredPort) {
      console.log(`[Init] Port ${preferredPort} is busy, using port ${port} instead`);
    }

    server.on("error", (err: any) => {
      console.error(`[Server Error] ${err.message}`);
      console.error(err?.stack);
    });

    server.on("close", () => {
      console.log("[Server] Closed");
    });

    server.on("connection", (conn: any) => {
      console.log(`[Server] New connection from ${conn.remoteAddress}:${conn.remotePort}`);
    });

    console.log(`[Init] Calling server.listen(${port}, 127.0.0.1)...`);
    server.listen(port, "127.0.0.1", () => {
      console.log(`Server running on http://localhost:${port}/`);
      // Never resolve - keep the promise hanging forever
      // This ensures the process never exits
    });
  }).catch(err => {
    console.error(`[Port Error] ${err?.message || String(err)}`);
    console.error(err?.stack);
  });
}

startServer();

startServer();

// Keep the process alive - this prevents Node from exiting
setInterval(() => {
  // Empty interval just to keep the process alive
}, 1000 * 60 * 60);
