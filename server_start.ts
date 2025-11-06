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

// Now import and run the actual server
import("./server/_core/index.ts").catch(err => {
  console.error("[Fatal] Failed to start server:", err);
  process.exit(1);
});
