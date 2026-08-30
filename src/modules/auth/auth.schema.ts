import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(3).max(150),
  email: z.string().email(),
  password: z.string().min(6),
  masjid_name: z.string().min(3),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const deleteAccountSchema = z.object({
  email: z.string().min(1, "email is required"),
});
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

export const updateStatusSchema = z.object({
  email: z.string().min(1, "email is required"),
  is_active: z.boolean(),
});
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
