import { Elysia } from "elysia";
import { corsPlugin } from "./plugins/cors";
import { errorHandlerPlugin } from "./plugins/error-handler";
import { openapiPlugin } from "./plugins/openapi";
import { routes } from "./routes";

export function buildApp() {
  return new Elysia()
    .use(errorHandlerPlugin)
    .use(corsPlugin)
    .use(openapiPlugin)
    .use(routes);
}

export type App = ReturnType<typeof buildApp>;
