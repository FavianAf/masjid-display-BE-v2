import { buildApp } from "@/app/app";
import { env } from "@/config/env";

const app = buildApp();

app.listen(env.APP_PORT, () => {
  console.log(`Masjid Display BE v2 listening on port ${env.APP_PORT} (${env.APP_ENV})`);
});
