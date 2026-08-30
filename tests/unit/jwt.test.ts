import { describe, expect, it } from "bun:test";
import { signToken, verifyToken } from "@/shared/utils/jwt";

describe("jwt sign/verify", () => {
  it("round-trips claims and respects expiry", async () => {
    const { token, expiresAt } = await signToken({
      user_id: "11111111-1111-1111-1111-111111111111",
      username: "admin",
      sub: "11111111-1111-1111-1111-111111111111",
    });

    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

    const claims = await verifyToken(token);
    expect(claims.user_id).toBe("11111111-1111-1111-1111-111111111111");
    expect(claims.username).toBe("admin");
    expect(claims.sub).toBe("11111111-1111-1111-1111-111111111111");
  });

  it("rejects a tampered token", async () => {
    const { token } = await signToken({ user_id: "u1", username: "admin", sub: "u1" });
    const tampered = `${token.slice(0, -2)}xx`;
    await expect(verifyToken(tampered)).rejects.toThrow();
  });
});
