import { Elysia } from "elysia";
import { success } from "@/shared/types/response";
import { pingDatabase } from "@/db";
import { env } from "@/config/env";

export const healthRoutes = new Elysia().get("/healthz", async () => {
  const connected = await pingDatabase();
  const port = `:${env.APP_PORT}`;
  return success({
    message: `Masjid Display BE berjalan di port ${port}`,
    port,
    status: "healthy",
    database: connected ? "connected" : "disconnected",
  });
});
