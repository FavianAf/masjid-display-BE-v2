import { afterAll, describe, expect, it } from "bun:test";
import { buildApp } from "@/app/app";
import { env } from "@/config/env";
import { request as requestApp } from "../helpers";

const app = buildApp();
const runId = Date.now();
const email = `test-auth-${runId}@example.com`;

const request = (method: string, path: string, body?: unknown, headers?: Record<string, string>) =>
  requestApp(app, method, path, body, headers);

afterAll(async () => {
  await request("DELETE", "/api/auth/account", { email }, { punyakuid: env.PUNYAKU_ID_SECRET });
});

describe("auth flow", () => {
  it("registers a new user with a masjid", async () => {
    const { status, json } = await request("POST", "/api/auth/register", {
      username: "testuser",
      email,
      password: "password123",
      masjid_name: "Test Masjid",
    });
    expect(status).toBe(201);
    expect(json.responseCode).toBe("01");
    const data = json.responseData as { token: string; user: { email: string; masjid_id: string } };
    expect(data.token).toBeTruthy();
    expect(data.user.email).toBe(email);
    expect(data.user.masjid_id).toBeTruthy();
  });

  it("rejects duplicate email registration", async () => {
    const { status, json } = await request("POST", "/api/auth/register", {
      username: "someoneelse",
      email,
      password: "password123",
      masjid_name: "Another Masjid",
    });
    expect(status).toBe(400);
    expect(json.responseMessage).toBe("Email already exist");
  });

  it("logs in with correct credentials", async () => {
    const { status, json } = await request("POST", "/api/auth/login", { email, password: "password123" });
    expect(status).toBe(200);
    expect(json.responseCode).toBe("00");
  });

  it("rejects wrong password with a generic message", async () => {
    const { status, json } = await request("POST", "/api/auth/login", { email, password: "wrong-password" });
    expect(status).toBe(400);
    expect(json.responseMessage).toBe("Invalid email or password");
  });

  it("rejects settings access without a token", async () => {
    const { status, json } = await request("GET", "/api/masjid/settings");
    expect(status).toBe(401);
    expect(json.responseCode).toBe("401");
  });

  it("admin endpoints require the punyakuId header", async () => {
    const { status } = await request("GET", `/api/auth/account?email=${email}`, undefined, {
      punyakuid: "wrong-secret",
    });
    expect(status).toBe(401);
  });
});
