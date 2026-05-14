import app from "./app.js";
import env from "./config/env.js";

const server = app.listen(env.port, () => {
  console.log("");
  console.log("============================================================");
  console.log("World Cup in Miami API server running");
  console.log("============================================================");
  console.log(`Environment: ${env.nodeEnv}`);
  console.log(`Local:       http://localhost:${env.port}`);
  console.log(`API Root:    http://localhost:${env.port}${env.apiPrefix}`);
  console.log(`API Status:  http://localhost:${env.port}${env.apiPrefix}/status`);
  console.log("============================================================");
  console.log("");
});

function shutdown(signal) {
  console.log(`[server] received ${signal}. Closing HTTP server...`);

  server.close(() => {
    console.log("[server] shutdown complete.");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("[server] forced shutdown.");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
