import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Plugins array built without top-level await
async function getPlugins() {
  const plugins = [react()];

  if (
    process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
  ) {
    const runtimeErrorModal = await import("@replit/vite-plugin-runtime-error-modal");
    const cartographer = await import("@replit/vite-plugin-cartographer");
    plugins.push(runtimeErrorModal.default(), cartographer.cartographer());
  }

  return plugins;
}

export default defineConfig(async () => ({
  base: "/DUD/",
  plugins: await getPlugins(),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
}));
