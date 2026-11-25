import { z } from "zod";
import {
  COMMUNITY_ROLES,
  ENGINEERING_DEPARTMENTS,
  USER_ROLES,
  USER_TYPES,
  VERIFICATION_STATUSES,
} from "../constants/domain";

const MIN_ENTRY_YEAR = 2018;
const MAX_YEAR = 2035;

export const onboardingInputSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(3, "Ad soyad en az 3 karakter olmalıdır.")
      .max(100, "Ad soyad en fazla 100 karakter olabilir."),
    userType: z.enum(USER_TYPES, {
      errorMap: () => ({ message: "Lütfen öğrenci veya mezun durumunu seçin." }),
    }),
    department: z.enum(ENGINEERING_DEPARTMENTS, {
      errorMap: () => ({ message: "Lütfen mühendislik bölümünüzü seçin." }),
    }),
    entryYear: z.coerce
      .number()
      .int()
      .min(MIN_ENTRY_YEAR, `Giriş yılı ${MIN_ENTRY_YEAR} veya sonrası olmalıdır.`)
      .max(MAX_YEAR, `Giriş yılı ${MAX_YEAR} değerini aşamaz.`),
    graduationYear: z.coerce
      .number()
      .int()
      .min(MIN_ENTRY_YEAR, `Mezuniyet yılı ${MIN_ENTRY_YEAR} veya sonrası olmalıdır.`)
      .max(MAX_YEAR, `Mezuniyet yılı ${MAX_YEAR} değerini aşamaz.`)
      .nullable()
      .optional(),
    verificationNote: z
      .string()
      .trim()
      .max(400, "Doğrulama notu en fazla 400 karakter olabilir.")
      .optional(),
    kvkkDisclosureAccepted: z.literal(true, {
      errorMap: () => ({
        message: "KVKK Aydınlatma Metni onayı başvuru için zorunludur.",
      }),
    }),
    kvkkExplicitConsent: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.userType === "alumni" && !data.graduationYear) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["graduationYear"],
        message: "Mezun başvurularında mezuniyet yılı zorunludur.",
      });
    }
    if (data.graduationYear && data.graduationYear < data.entryYear) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["graduationYear"],
        message: "Mezuniyet yılı giriş yılından küçük olamaz.",
      });
    }
  });

export type OnboardingInput = z.infer<typeof onboardingInputSchema>;

export const communityPermissionSchema = z.object({
  communityId: z.string(),
  communitySlug: z.string(),
  communityName: z.string(),
  role: z.enum(COMMUNITY_ROLES),
});

export const meProfileSchema = z.object({
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
  contactEmail: z.string().nullable(),
  linkedinUrl: z.string().nullable(),
  githubUrl: z.string().nullable(),
  websiteUrl: z.string().nullable(),
  avatarKey: z.string().nullable(),
  directoryVisible: z.boolean(),
  showContactInfo: z.boolean(),
  showProfessionalLinks: z.boolean(),
});

export const meUserSchema = z.object({
  id: z.string(),
  supabaseUserId: z.string(),
  email: z.string().email(),
  role: z.enum(USER_ROLES),
  verificationStatus: z.enum(VERIFICATION_STATUSES),
  verifiedAt: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  communityPermissions: z.array(communityPermissionSchema),
});

export const meResponseSchema = z.object({
  onboarded: z.boolean(),
  user: meUserSchema.nullable(),
  profile: meProfileSchema.nullable(),
});

export type MeResponse = z.infer<typeof meResponseSchema>;

export const verificationDecisionSchema = z
  .object({
    decision: z.enum(["verified", "rejected"]),
    rejectionReason: z
      .string()
      .trim()
      .max(300, "Ret gerekçesi en fazla 300 karakter olabilir.")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.decision === "rejected" && (!data.rejectionReason || data.rejectionReason.length < 5)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rejectionReason"],
        message: "Ret kararında en az 5 karakterlik gerekçe belirtilmelidir.",
      });
    }
  });

export type VerificationDecisionInput = z.infer<typeof verificationDecisionSchema>;

export const adminVerificationItemSchema = z.object({
  userId: z.string(),
  email: z.string(),
  role: z.enum(USER_ROLES),
  verificationStatus: z.enum(VERIFICATION_STATUSES),
  createdAt: z.string(),
  verifiedAt: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  fullName: z.string(),
  userType: z.enum(USER_TYPES),
  department: z.string(),
  entryYear: z.number().int(),
  graduationYear: z.number().int().nullable(),
  verificationNote: z.string().nullable(),
});

export type AdminVerificationItem = z.infer<typeof adminVerificationItemSchema>;

export const adminVerificationsListResponseSchema = z.object({
  items: z.array(adminVerificationItemSchema),
});

export type AdminVerificationsListResponse = z.infer<typeof adminVerificationsListResponseSchema>;
