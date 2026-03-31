// Vercel-like local API server with TypeScript support
// - /api/* routing
// - supports .js and .ts (via tsx)
// - no cache (hot reload friendly)

import http from "http";
import { readdirSync, statSync } from "fs";
import { join, extname } from "path";
import url from "url";
import { pathToFileURL } from "url";
import dotenv from "dotenv";
dotenv.config();

const API_DIR = join(process.cwd(), "api");

// Recursively collect API routes
function getRoutes(dir, baseRoute = "") {
  const entries = readdirSync(dir);
  let routes = {};

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      Object.assign(routes, getRoutes(fullPath, baseRoute + "/" + entry));
    } else if ([".js", ".ts"].includes(extname(entry))) {
      const routePath =
        (baseRoute + "/" + entry.replace(/\.(js|ts)$/, ""))
          .replace(/\/index$/, "") || "/";

      routes[routePath] = fullPath;
    }
  }

  return routes;
}

async function handler(req, res) {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // Only handle /api/*
  if (!pathname.startsWith("/api")) {
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  // Strip /api prefix
  pathname = pathname.replace(/^\/api/, "") || "/";

  // Rebuild routes on every request (dev-friendly)
  const routes = getRoutes(API_DIR);
  const file = routes[pathname];

  if (!file) {
    res.writeHead(404);
    res.end("API route not found");
    return;
  }

  try {
    // 🔥 Fix: proper file URL + cache busting
    const fileUrl = pathToFileURL(file).href + `?t=${Date.now()}`;

    const mod = await import(fileUrl);
    const fn = mod.default || mod;

    // Attach query like Vercel
    req.query = parsedUrl.query;

    // Helpers
    const send = (status, data) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
    };

    res.status = (code) => {
      res.statusCode = code;
      return res;
    };

    res.json = (data) => send(res.statusCode || 200, data);

    await fn(req, res);
  } catch (err) {
    console.error(err);
    res.writeHead(500);
    res.end("Server Error");
  }
}

const server = http.createServer(handler);

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/api`);
});