import { Elysia } from "elysia";
import { authAdminRoutes, authRoutes } from "@/modules/auth/auth.routes";
import { masjidRoutes } from "@/modules/masjid/masjid.routes";
import { sholatRoutes } from "@/modules/sholat/sholat.routes";
import { hadistRoutes } from "@/modules/hadist/hadist.routes";
import { locationRoutes } from "@/modules/location/location.routes";
import { healthRoutes } from "@/modules/display/health.routes";

export const routes = new Elysia()
  .use(healthRoutes) // outside /api — no rate limiting, matches v1
  .get("/", ({ set }) => {
    set.headers["content-type"] = "text/html";
    return "<html><head><title>Masjid Display API</title></head><body>Welcome to Masjid Display API</body></html>";
  })
  .use(authRoutes)
  .use(authAdminRoutes)
  .use(masjidRoutes)
  .use(sholatRoutes)
  .use(hadistRoutes)
  .use(locationRoutes);
