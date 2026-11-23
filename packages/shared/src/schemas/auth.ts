import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const emailSchema = z
  .string()
  .trim()
  .min(1, "E-posta adresi zorunludur.")
  .email("Geçerli bir e-posta adresi giriniz.")
  .max(254, "E-posta adresi çok uzun.");

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Parola en az ${PASSWORD_MIN_LENGTH} karakter olmalıdır.`)
  .max(PASSWORD_MAX_LENGTH, `Parola en fazla ${PASSWORD_MAX_LENGTH} karakter olabilir.`)
  .refine((val) => /[a-zA-Z]/.test(val) && /\d/.test(val), {
    message: "Parola en az bir harf ve bir rakam içermelidir.",
  });

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    passwordConfirm: z.string().min(1, "Parola tekrarı zorunludur."),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "Parolalar eşleşmiyor.",
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Parola zorunludur.").max(PASSWORD_MAX_LENGTH),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const authMeResponseSchema = z.object({
  user: z.object({
    supabaseUserId: z.string(),
    email: z.string().email().nullable(),
    emailVerified: z.boolean().nullable(),
    sessionIssuedAt: z.string().nullable(),
  }),
});

export type AuthMeResponse = z.infer<typeof authMeResponseSchema>;
