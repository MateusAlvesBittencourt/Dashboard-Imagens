#!/usr/bin/env tsx
import "dotenv/config";

// Set environment variables if not already set
process.env.NODE_ENV = process.env.NODE_ENV || "development";
process.env.PORT = process.env.PORT || "3000";
process.env.VITE_LOCAL_MODE = process.env.VITE_LOCAL_MODE || "true";

console.log(`[Server Init] Environment:`);
console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`  PORT: ${process.env.PORT}`);
console.log(`  VITE_LOCAL_MODE: ${process.env.VITE_LOCAL_MODE}`);

// Global error handlers
process.on("uncaughtException", (err: any) => {
  console.error("[Uncaught Exception]", err?.message || String(err));
  console.error(err?.stack);
});

process.on("unhandledRejection", (reason: any) => {
  console.error("[Unhandled Rejection]", reason?.message || String(reason));
  if (reason?.stack) console.error(reason.stack);
});

// Now import and run the actual server
import("./server/_core/index.ts").then(() => {
  console.log("[Server Init] Server module loaded");
  // Keep process alive
  process.stdin.resume();
}).catch(err => {
  console.error("[Fatal] Failed to start server:", err);
  process.exit(1);
});
