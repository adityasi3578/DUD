import { IStorage } from "./storage.impl.ts";

// Dynamic import between mem and db based on NODE_ENV
const isDev = process.env.NODE_ENV !== "production";

// Use in-memory store locally, DB store in production
export const storage: IStorage = isDev
  ? (await import("./mem-storage.ts")).memStorage
  : (await import("./storage.db.ts")).dbStorage;
