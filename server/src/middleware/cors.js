import cors from "cors";
import env from "../config/env.js";

export function corsMiddleware() {
  return cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (env.corsAllowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      const error = new Error("CORS origin blocked.");
      error.status = 403;
      error.code = "CORS_BLOCKED";
      error.expose = true;
      return callback(error);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "x-admin-token",
    ],
    maxAge: 86400,
  });
}

export default corsMiddleware;
