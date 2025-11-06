import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./_core/oauth";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { serveStatic, setupVite } from "./_core/vite";

// Global error handlers
process.on("uncaughtException", (err: any) => {
  console.error(`[Uncaught Exception] ${err?.message || String(err)}`);
  if (err?.stack) console.error(err.stack);
});

process.on("unhandledRejection", (reason: any) => {
  console.error(`[Unhandled Rejection] ${reason?.message || String(reason)}`);
  if (reason?.stack) console.error(reason.stack);
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

async function startServer() {
  console.log("[Server] Initializing...");
  
  const app = express();
  const server = createServer(app);
  
  // Configure body parser
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Health check endpoint
  app.get("/healthz", (_req, res) => {
    res.status(200).json({ ok: true, mode: process.env.NODE_ENV || "development" });
  });
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  
  // OAuth routes
  registerOAuthRoutes(app);
  
  // Setup frontend
  if (process.env.NODE_ENV === "development") {
    console.log("[Server] Using Vite middleware for development");
    await setupVite(app, server);
  } else {
    console.log("[Server] Using static file serving for production");
    serveStatic(app);
  }
  
  // Find available port
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  
  if (port !== preferredPort) {
    console.log(`[Server] Port ${preferredPort} is busy, using port ${port} instead`);
  }
  
  // Start server - this will never resolve, keeping the process alive
  server.listen(port, "127.0.0.1", () => {
    console.log(`[Server] ✓ Running on http://localhost:${port}/`);
    console.log(`[Server] Mode: ${process.env.NODE_ENV || "development"}`);
    console.log(`[Server] Local mode: ${process.env.VITE_LOCAL_MODE === "true" ? "YES" : "NO"}`);
  });
  
  // Error handling
  server.on("error", (err: any) => {
    console.error(`[Server Error] ${err.message}`);
  });
}

// Start the server
startServer().catch(err => {
  console.error("[Server] Fatal error:", err);
  process.exit(1);
});

// Keep process alive
setInterval(() => {}, 60000);
