import cors from "@elysiajs/cors";
import { corsOrigins } from "@/config/env";

export const corsPlugin = cors({
  origin: corsOrigins(),
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Accept", "Authorization", "Content-Type", "X-CSRF-Token"],
  exposeHeaders: ["Link"],
  credentials: false,
  maxAge: 300,
});
