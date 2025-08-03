import type { IStorage } from "./storage.impl.js";

// Dynamic import between mem and db based on NODE_ENV
const isDev = process.env.NODE_ENV !== "production";

// Use in-memory store locally, DB store in production
export const storage: IStorage = isDev
  ? (await import("./mem-storage.js")).memStorage
  : (await import("./storage.db.js")).dbStorage;
