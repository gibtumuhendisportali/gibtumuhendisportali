import { z } from "zod";
import { ENGINEERING_DEPARTMENTS, USER_TYPES } from "../constants/domain";

function isSafeHttpsUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

const optionalHttpsUrlSchema = z
  .string()
  .trim()
  .max(250, "Bağlantı adresi çok uzun.")
  .refine((val) => val === "" || isSafeHttpsUrl(val), {
    message: "Bağlantı adresi https:// ile başlamalıdır.",
  })
  .transform((val) => (val === "" ? null : val))
  .nullable()
  .optional();

const optionalContactEmailSchema = z
  .string()
  .trim()
  .max(254, "E-posta adresi çok uzun.")
  .refine((val) => val === "" || z.string().email().safeParse(val).success, {
    message: "Geçerli bir iletişim e-postası giriniz.",
  })
  .transform((val) => (val === "" ? null : val))
  .nullable()
  .optional();

export const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Ad soyad en az 3 karakter olmalıdır.")
    .max(100, "Ad soyad en fazla 100 karakter olabilir."),
  headline: z
    .string()
    .trim()
    .max(120, "Ünvan/başlık en fazla 120 karakter olabilir.")
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .optional(),
  company: z
    .string()
    .trim()
    .max(100, "Kurum/şirket adı en fazla 100 karakter olabilir.")
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .optional(),
  city: z
    .string()
    .trim()
    .max(60, "Şehir adı en fazla 60 karakter olabilir.")
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .optional(),
  bio: z
    .string()
    .trim()
    .max(600, "Biyografi en fazla 600 karakter olabilir.")
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .optional(),
  skills: z
    .array(z.string().trim().min(1).max(40))
    .max(12, "En fazla 12 yetkinlik eklenebilir.")
    .default([]),
  contactEmail: optionalContactEmailSchema,
  linkedinUrl: optionalHttpsUrlSchema,
  githubUrl: optionalHttpsUrlSchema,
  websiteUrl: optionalHttpsUrlSchema,
  directoryVisible: z.boolean(),
  showContactInfo: z.boolean(),
  showProfessionalLinks: z.boolean(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const directoryQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  userType: z.enum(["all", ...USER_TYPES]).default("all"),
  department: z.enum(["all", ...ENGINEERING_DEPARTMENTS]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(30).default(12),
});

export type DirectoryQuery = z.infer<typeof directoryQuerySchema>;

export const directoryMemberSchema = z.object({
  userId: z.string(),
  fullName: z.string(),
  userType: z.enum(USER_TYPES),
  department: z.string(),
  entryYear: z.number().int(),
  graduationYear: z.number().int().nullable(),
  headline: z.string().nullable(),
  company: z.string().nullable(),
  city: z.string().nullable(),
  bio: z.string().nullable(),
  skills: z.array(z.string()),
  avatarKey: z.string().nullable(),
  contactEmail: z.string().nullable(),
  linkedinUrl: z.string().nullable(),
  githubUrl: z.string().nullable(),
  websiteUrl: z.string().nullable(),
});

export type DirectoryMember = z.infer<typeof directoryMemberSchema>;

export const directoryListResponseSchema = z.object({
  items: z.array(directoryMemberSchema),
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
});

export type DirectoryListResponse = z.infer<typeof directoryListResponseSchema>;
