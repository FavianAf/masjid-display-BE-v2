import { BCRYPT_COST } from "@/config/constants";
import { BadRequestError, NotFoundError } from "@/shared/errors/app-error";
import { signToken } from "@/shared/utils/jwt";
import * as repo from "./auth.repository";
import type { LoginInput, RegisterInput } from "./auth.schema";

const USER_NOT_FOUND_BY_EMAIL = "User not found with this email";

interface TokenSubject {
  id: string;
  username: string;
  email: string;
  masjidId: string;
  masjidName: string;
}

async function buildTokenResponse(subject: TokenSubject) {
  const { token, expiresAt } = await signToken({
    user_id: subject.id,
    username: subject.username,
    sub: subject.id,
  });
  return {
    token,
    expires_at: expiresAt.toISOString(),
    user: {
      id: subject.id,
      username: subject.username,
      email: subject.email,
      masjid_id: subject.masjidId,
      masjid_name: subject.masjidName,
    },
  };
}

export async function register(input: RegisterInput) {
  const existing = await repo.findByEmail(input.email);
  if (existing) {
    if (existing.username === input.username) {
      throw new BadRequestError("Username and email already exist");
    }
    throw new BadRequestError("Email already exist");
  }

  const passwordHash = await Bun.password.hash(input.password, {
    algorithm: "bcrypt",
    cost: BCRYPT_COST,
  });
  const { user, masjid } = await repo.createUserWithMasjid(
    input.username,
    input.email,
    passwordHash,
    input.masjid_name,
  );

  return buildTokenResponse({
    id: user.id,
    username: user.username,
    email: user.email,
    masjidId: masjid.id,
    masjidName: masjid.name,
  });
}

export async function login(input: LoginInput) {
  const user = await repo.findWithMasjidByEmail(input.email);
  if (!user || !user.isActive) throw new BadRequestError("Invalid email or password");

  const valid = await Bun.password.verify(input.password, user.passwordHash);
  if (!valid) throw new BadRequestError("Invalid email or password");

  return buildTokenResponse(user);
}

export async function getAccountByEmail(email: string) {
  const user = await repo.findWithMasjidByEmail(email);
  if (!user) throw new NotFoundError(USER_NOT_FOUND_BY_EMAIL);
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    is_active: user.isActive,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
    masjid_id: user.masjidId,
    masjid_name: user.masjidName,
    city_id: user.cityId,
    city_name: user.cityName,
  };
}

export async function getAccountsByUsername(username: string, limit: number) {
  const rows = await repo.findUsersByUsername(username, limit);
  if (rows.length === 0) throw new NotFoundError("No users found with this username");
  return {
    username,
    count: rows.length,
    emails: rows.map((r) => ({
      email: r.email,
      is_active: r.isActive,
      created_at: r.createdAt.toISOString(),
    })),
  };
}

export async function deleteAccount(email: string) {
  const deleted = await repo.deleteUserByEmail(email);
  if (!deleted) throw new NotFoundError(USER_NOT_FOUND_BY_EMAIL);
}

export async function updateAccountStatus(email: string, isActive: boolean) {
  const updated = await repo.updateUserStatus(email, isActive);
  if (!updated) throw new NotFoundError(USER_NOT_FOUND_BY_EMAIL);
}
