import { SignJWT, jwtVerify } from "jose";
import { env } from "@/config/env";

export interface JwtClaims {
  user_id: string;
  username: string;
  sub: string;
}

// env.JWT_SECRET never changes at runtime, so encode it once instead of on every sign/verify call.
const secretKey = new TextEncoder().encode(env.JWT_SECRET);

export async function signToken(claims: JwtClaims): Promise<{ token: string; expiresAt: Date }> {
  const expiresAt = new Date(Date.now() + env.JWT_EXPIRE_HOUR * 60 * 60 * 1000);
  const token = await new SignJWT({ user_id: claims.user_id, username: claims.username })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(secretKey);
  return { token, expiresAt };
}

export async function verifyToken(token: string): Promise<JwtClaims> {
  const { payload } = await jwtVerify(token, secretKey, { algorithms: ["HS256"] });
  return {
    user_id: payload.user_id as string,
    username: payload.username as string,
    sub: payload.sub as string,
  };
}
