import { resolve } from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: resolve(process.cwd(), "../.env") });

void import("./server.js").catch((error: unknown) => {
  console.error("Backend startup failed:", error);
  process.exitCode = 1;
});
