import express from "express";

import env from "./config/env.js";
import securityHeaders from "./config/securityHeaders.js";
import { globalRateLimiter } from "./config/rateLimit.js";
import corsMiddleware from "./middleware/cors.js";
import inputScanner from "./middleware/inputScanner.js";
import requestContext from "./middleware/requestContext.js";
import requestLogger from "./middleware/requestLogger.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import healthRouter from "./routes/health.js";
import routes from "./routes/index.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", env.trustProxy);

app.use(requestContext);
app.use(securityHeaders());
app.use(corsMiddleware());
app.use(globalRateLimiter());
app.use(requestLogger);

app.use(express.json({ limit: env.requestBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: env.requestBodyLimit }));

app.use(inputScanner);

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
          <p>Health endpoint: <a href="/health"><code>/health</code></a></p>
          <p>Status endpoint: <a href="${env.apiPrefix}/status"><code>${env.apiPrefix}/status</code></a></p>
        </main>
      </body>
    </html>
  `);
});

/*
  Production platforms usually expect root-level probes.
  API users can also call /api/v1/health, /api/v1/health/live, and /api/v1/health/ready.
*/
app.use("/", healthRouter);
app.use(env.apiPrefix, routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
