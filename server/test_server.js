import express from "express";
import { fileURLToPath } from "url";
import { dirname, join, extname } from "path";
import fs from "fs";
import dotenv from "dotenv";

// ===============================
// Load environment variables first
// ===============================
dotenv.config({ path: ".env.base" });

// ===============================
// Setup paths
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const API_DIR = join(__dirname, "api");

// ===============================
// Express app
// ===============================
const app = express();
const PORT = process.env.PORT || 3000;

// JSON middleware
app.use(express.json());

// ===============================
// Helper: Recursively map routes (lazy-load)
// ===============================
function mapRoutes(dir, baseRoute = "/api") {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    // Skip private/internal folders
    if (entry.isDirectory() && entry.name.startsWith("_")) continue;

    if (entry.isDirectory()) {
      // Recurse into subfolder
      const subRoute = `${baseRoute}/${entry.name}`;
      mapRoutes(fullPath, subRoute);
    } else if (entry.isFile() && extname(entry.name) === ".js") {
      let route = baseRoute;
      if (entry.name !== "index.js") {
        route += `/${entry.name.replace(".js", "")}`;
      }

      // Lazy-load handler on request
      app.all(route, async (req, res, next) => {
        try {
          const mod = await import(fullPath);
          const handler = mod.default;
          if (!handler) {
            res.status(500).json({ error: "No default export found" });
            return;
          }
          return handler(req, res);
        } catch (err) {
          console.error(`Failed to handle ${route}:`, err);
          res.status(500).json({ error: "Internal Server Error" });
        }
      });

      console.log(`Mapped ${fullPath} → ${route}`);
    }
  }
}

// Map all API routes
mapRoutes(API_DIR);

// ===============================
// Start server
// ===============================
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Loaded environment variables from .env.base`);
});