import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
  ".json": "application/json",
};

/**
 * Serves static files from `oldRoot`, then switches to `newRoot` after POST /__test/use-new-build.
 */
export function startDualBuildServer({ oldRoot, newRoot, port }) {
  let activeRoot = oldRoot;

  const server = createServer(async (req, res) => {
    const url = req.url || "/";
    if (url === "/__test/use-new-build" && req.method === "POST") {
      activeRoot = newRoot;
      res.writeHead(204);
      res.end();
      return;
    }

    let path = url.split("?")[0] || "/";
    if (path === "/") path = "/index.html";
    try {
      const file = join(activeRoot, path.replace(/^\//, ""));
      const data = await readFile(file);
      res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("not found");
    }
  });

  return new Promise((resolve, reject) => {
    server.listen(port, "127.0.0.1", () => resolve(server));
    server.on("error", reject);
  });
}
