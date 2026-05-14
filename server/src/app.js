import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import env from "./config/env.js";
import routes from "./routes/index.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      const allowedOrigins = [
        env.corsOrigin,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
      ];

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(
  rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: "Too many requests. Please try again shortly.",
    },
  })
);

app.use(express.json({ limit: "500kb" }));
app.use(express.urlencoded({ extended: true, limit: "500kb" }));

app.get("/", (req, res) => {
  res.type("html").send(`
    <!doctype html>
    <html>
      <head>
        <title>World Cup in Miami API</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #050816;
            color: white;
            font-family: Arial, sans-serif;
          }
          main {
            max-width: 760px;
            padding: 32px;
          }
          a { color: #17d8ff; }
          code {
            background: rgba(255,255,255,0.1);
            padding: 4px 8px;
            border-radius: 8px;
          }
        </style>
      </head>
      <body>
        <main>
          <h1>World Cup in Miami API</h1>
          <p>The WCIM backend is running.</p>
          <p>Status endpoint: <a href="${env.apiPrefix}/status"><code>${env.apiPrefix}/status</code></a></p>
        </main>
      </body>
    </html>
  `);
});

app.use(env.apiPrefix, routes);

app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
});

app.use((error, req, res, next) => {
  console.error("[error]", {
    message: error.message,
    path: req.originalUrl,
    method: req.method,
  });

  res.status(error.status || 500).json({
    error: env.nodeEnv === "production" ? "Internal server error" : error.message,
    timestamp: new Date().toISOString(),
  });
});

export default app;
