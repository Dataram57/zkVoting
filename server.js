const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const BASE_DIR = path.join(__dirname, "front_end");

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf"
};

function safePath(base, target) {
  const resolved = path.resolve(base, target);
  if (!resolved.startsWith(base)) {
    return null;
  }
  return resolved;
}

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split("?")[0]);

  if (reqPath === "/") {
    reqPath = "/index.html";
  }

  const filePath = safePath(BASE_DIR, "." + reqPath);

  if (!filePath) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404);
      return res.end("Not Found");
    }

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});