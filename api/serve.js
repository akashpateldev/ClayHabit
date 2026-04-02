/**
 * Vercel API route for serving Expo static builds
 * Adapted from server/serve.js for serverless environment
 */

const fs = require("fs");
const path = require("path");

const STATIC_ROOT = path.resolve(__dirname, "..", "static-build");
const TEMPLATE_PATH = path.resolve(__dirname, "..", "server", "templates", "landing-page.html");
const basePath = (process.env.BASE_PATH || "/").replace(/\/+$/, "");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".map": "application/json",
};

function getAppName() {
  try {
    const appJsonPath = path.resolve(__dirname, "..", "app.json");
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf-8"));
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}

function serveManifest(platform, res) {
  const manifestPath = path.join(STATIC_ROOT, platform, "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: `Manifest not found for platform: ${platform}` }));
    return;
  }

  const content = fs.readFileSync(manifestPath, "utf-8");
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(content);
}

function serveLandingPage(res) {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${getAppName()}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              margin: 0;
              padding: 20px;
              background: #0D0D14;
              color: #fff;
              text-align: center;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            h1 { font-size: 2em; margin-bottom: 10px; }
            p { font-size: 1.1em; opacity: 0.8; }
            .container { max-width: 600px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${getAppName()}</h1>
            <p>Mobile App - Deployed with Vercel</p>
          </div>
        </body>
      </html>
    `);
    return;
  }

  const template = fs.readFileSync(TEMPLATE_PATH, "utf-8");
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(template);
}

function serveFile(filePath, res) {
  const normalizedPath = path.normalize(filePath);

  if (!fs.existsSync(normalizedPath)) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
    return;
  }

  const ext = path.extname(normalizedPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const content = fs.readFileSync(normalizedPath);

  res.writeHead(200, { "Content-Type": contentType });
  res.end(content);
}

module.exports = (req, res) => {
  const urlPath = req.url.split("?")[0];
  const platform = req.headers["expo-platform"];

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, expo-platform");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Manifest request
  if ((urlPath === "/" || urlPath === "/manifest") && platform) {
    serveManifest(platform, res);
    return;
  }

  // Landing page
  if (urlPath === "/" || urlPath === "") {
    serveLandingPage(res);
    return;
  }

  // Static files
  const filePath = path.join(STATIC_ROOT, urlPath);
  serveFile(filePath, res);
};
