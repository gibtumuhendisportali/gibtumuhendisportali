import {
  KVKK_POLICY_VERSION,
  type AdminVerificationItem,
  type CommunityRole,
  type MeResponse,
  type OnboardingInput,
  type UserRole,
  type UserType,
  type VerificationStatus,
} from "@gibtu/shared";

interface UserRow {
  id: string;
  supabase_user_id: string;
  email: string;
  role: UserRole;
  verification_status: VerificationStatus;
  verified_at: string | null;
  rejection_reason: string | null;
}

interface ProfileRow {
  full_name: string;
  user_type: UserType;
  department: string;
  entry_year: number;
  graduation_year: number | null;
  headline: string | null;
  company: string | null;
  city: string | null;
  bio: string | null;
  skills_json: string | null;
  contact_email: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  website_url: string | null;
  avatar_key: string | null;
  directory_visible: number;
  show_contact_info: number;
  show_professional_links: number;
}

export function parseSkillsJson(raw: string | null): string[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
    return [];
  } catch {
    return [];
  }
}

interface CommunityPermissionRow {
  community_id: string;
  community_slug: string;
  community_name: string;
  role: CommunityRole;
}

interface AdminVerificationRow {
  user_id: string;
  email: string;
  role: UserRole;
  verification_status: VerificationStatus;
  created_at: string;
  verified_at: string | null;
  rejection_reason: string | null;
  full_name: string;
  user_type: UserType;
  department: string;
  entry_year: number;
  graduation_year: number | null;
  verification_note: string | null;
}

export async function findMeBySupabaseId(
  db: D1Database,
  supabaseUserId: string,
): Promise<MeResponse> {
  const userRow = await db
    .prepare(
      `SELECT id, supabase_user_id, email, role, verification_status, verified_at, rejection_reason
       FROM users
       WHERE supabase_user_id = ?1
       LIMIT 1`,
    )
    .bind(supabaseUserId)
    .first<UserRow>();

  if (!userRow) {
    return {
      onboarded: false,
      user: null,
      profile: null,
    };
  }

  const [profileRow, permissionsResult] = await Promise.all([
    db
      .prepare(
        `SELECT full_name, user_type, department, entry_year, graduation_year,
                headline, company, city, bio, skills_json,
                contact_email, linkedin_url, github_url, website_url, avatar_key,
                directory_visible, show_contact_info, show_professional_links
         FROM profiles
         WHERE user_id = ?1
         LIMIT 1`,
      )
      .bind(userRow.id)
      .first<ProfileRow>(),
    db
      .prepare(
        `SELECT cp.community_id, c.slug AS community_slug, c.name AS community_name, cp.role
         FROM community_permissions cp
         INNER JOIN communities c ON c.id = cp.community_id
         WHERE cp.user_id = ?1`,
      )
      .bind(userRow.id)
      .all<CommunityPermissionRow>(),
  ]);

  return {
    onboarded: true,
    user: {
      id: userRow.id,
      supabaseUserId: userRow.supabase_user_id,
      email: userRow.email,
      role: userRow.role,
      verificationStatus: userRow.verification_status,
      verifiedAt: userRow.verified_at,
      rejectionReason: userRow.rejection_reason,
      communityPermissions: (permissionsResult.results ?? []).map((row) => ({
        communityId: row.community_id,
        communitySlug: row.community_slug,
        communityName: row.community_name,
        role: row.role,
      })),
    },
    profile: profileRow
      ? {
          fullName: profileRow.full_name,
          userType: profileRow.user_type,
          department: profileRow.department,
          entryYear: profileRow.entry_year,
          graduationYear: profileRow.graduation_year,
          headline: profileRow.headline,
          company: profileRow.company,
          city: profileRow.city,
          bio: profileRow.bio,
          skills: parseSkillsJson(profileRow.skills_json),
          contactEmail: profileRow.contact_email,
          linkedinUrl: profileRow.linkedin_url,
          githubUrl: profileRow.github_url,
          websiteUrl: profileRow.website_url,
          avatarKey: profileRow.avatar_key,
          directoryVisible: profileRow.directory_visible === 1,
          showContactInfo: profileRow.show_contact_info === 1,
          showProfessionalLinks: profileRow.show_professional_links === 1,
        }
      : null,
  };
}

export async function createOnboardingApplication(
  db: D1Database,
  params: {
    supabaseUserId: string;
    email: string;
    input: OnboardingInput;
  },
): Promise<MeResponse> {
  const userId = crypto.randomUUID();
  const disclosureId = crypto.randomUUID();
  const explicitConsentId = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.batch([
    db
      .prepare(
        `INSERT INTO users (
          id, supabase_user_id, email, role, verification_status, created_at, updated_at
        ) VALUES (?1, ?2, ?3, 'member', 'pending', ?4, ?4)`,
      )
      .bind(userId, params.supabaseUserId, params.email, now),
    db
      .prepare(
        `INSERT INTO profiles (
          user_id, full_name, user_type, department, entry_year, graduation_year,
          verification_note, directory_visible, show_contact_info, show_professional_links, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 0, 0, 0, ?8)`,
      )
      .bind(
        userId,
        params.input.fullName,
        params.input.userType,
        params.input.department,
        params.input.entryYear,
        params.input.userType === "alumni" ? (params.input.graduationYear ?? null) : null,
        params.input.verificationNote ?? null,
        now,
      ),
    db
      .prepare(
        `INSERT INTO kvkk_consents (id, user_id, consent_type, policy_version, accepted, consented_at)
         VALUES (?1, ?2, 'kvkk_disclosure_ack', ?3, 1, ?4)`,
      )
      .bind(disclosureId, userId, KVKK_POLICY_VERSION, now),
    db
      .prepare(
        `INSERT INTO kvkk_consents (id, user_id, consent_type, policy_version, accepted, consented_at)
         VALUES (?1, ?2, 'kvkk_explicit_consent', ?3, ?4, ?5)`,
      )
      .bind(
        explicitConsentId,
        userId,
        KVKK_POLICY_VERSION,
        params.input.kvkkExplicitConsent ? 1 : 0,
        now,
      ),
  ]);

  return findMeBySupabaseId(db, params.supabaseUserId);
}

export async function listVerificationApplications(
  db: D1Database,
  status: VerificationStatus = "pending",
): Promise<AdminVerificationItem[]> {
  const result = await db
    .prepare(
      `SELECT u.id AS user_id, u.email, u.role, u.verification_status,
              u.created_at, u.verified_at, u.rejection_reason,
              p.full_name, p.user_type, p.department, p.entry_year, p.graduation_year, p.verification_note
       FROM users u
       INNER JOIN profiles p ON p.user_id = u.id
       WHERE u.verification_status = ?1
       ORDER BY u.created_at ASC
       LIMIT 100`,
    )
    .bind(status)
    .all<AdminVerificationRow>();

  return (result.results ?? []).map((row) => ({
    userId: row.user_id,
    email: row.email,
    role: row.role,
    verificationStatus: row.verification_status,
    createdAt: row.created_at,
    verifiedAt: row.verified_at,
    rejectionReason: row.rejection_reason,
    fullName: row.full_name,
    userType: row.user_type,
    department: row.department,
    entryYear: row.entry_year,
    graduationYear: row.graduation_year,
    verificationNote: row.verification_note,
  }));
}

export async function findUserById(
  db: D1Database,
  userId: string,
): Promise<{ id: string; verification_status: VerificationStatus } | null> {
  return db
    .prepare(`SELECT id, verification_status FROM users WHERE id = ?1 LIMIT 1`)
    .bind(userId)
    .first<{ id: string; verification_status: VerificationStatus }>();
}

export async function applyVerificationDecision(
  db: D1Database,
  params: {
    targetUserId: string;
    actorUserId: string;
    decision: "verified" | "rejected";
    rejectionReason?: string;
  },
): Promise<void> {
  const now = new Date().toISOString();
  const auditId = crypto.randomUUID();
  const verifiedAt = params.decision === "verified" ? now : null;
  const rejectionReason =
    params.decision === "rejected" ? (params.rejectionReason ?? null) : null;

  await db.batch([
    db
      .prepare(
        `UPDATE users
         SET verification_status = ?1,
             verified_at = ?2,
             verified_by = ?3,
             rejection_reason = ?4,
             updated_at = ?5
         WHERE id = ?6`,
      )
      .bind(
        params.decision,
        verifiedAt,
        params.actorUserId,
        rejectionReason,
        now,
        params.targetUserId,
      ),
    db
      .prepare(
        `INSERT INTO audit_logs (id, actor_user_id, action, target_type, target_id, metadata_json, created_at)
         VALUES (?1, ?2, ?3, 'user', ?4, ?5, ?6)`,
      )
      .bind(
        auditId,
        params.actorUserId,
        params.decision === "verified" ? "user.verify.approve" : "user.verify.reject",
        params.targetUserId,
        JSON.stringify({
          decision: params.decision,
          hasRejectionReason: Boolean(rejectionReason),
        }),
        now,
      ),
  ]);
}
