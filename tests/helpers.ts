import type { App } from "@/app/app";

export async function request(
  app: App,
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
) {
  const res = await app.handle(
    new Request(`http://localhost${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  );
  const json = (await res.json()) as Record<string, unknown>;
  return { status: res.status, json };
}
