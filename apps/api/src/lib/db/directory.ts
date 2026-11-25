import type {
  DirectoryListResponse,
  DirectoryQuery,
  ProfileUpdateInput,
  UserType,
} from "@gibtu/shared";
import { parseSkillsJson } from "./identity";

interface DirectoryRow {
  user_id: string;
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
  avatar_key: string | null;
  contact_email: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  website_url: string | null;
  show_contact_info: number;
  show_professional_links: number;
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

export async function updateMemberProfile(
  db: D1Database,
  userId: string,
  input: ProfileUpdateInput,
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `UPDATE profiles
       SET full_name = ?1,
           headline = ?2,
           company = ?3,
           city = ?4,
           bio = ?5,
           skills_json = ?6,
           contact_email = ?7,
           linkedin_url = ?8,
           github_url = ?9,
           website_url = ?10,
           directory_visible = ?11,
           show_contact_info = ?12,
           show_professional_links = ?13,
           updated_at = ?14
       WHERE user_id = ?15`,
    )
    .bind(
      input.fullName,
      input.headline ?? null,
      input.company ?? null,
      input.city ?? null,
      input.bio ?? null,
      JSON.stringify(input.skills),
      input.contactEmail ?? null,
      input.linkedinUrl ?? null,
      input.githubUrl ?? null,
      input.websiteUrl ?? null,
      input.directoryVisible ? 1 : 0,
      input.showContactInfo ? 1 : 0,
      input.showProfessionalLinks ? 1 : 0,
      now,
      userId,
    )
    .run();
}

export async function updateAvatarKey(
  db: D1Database,
  userId: string,
  avatarKey: string | null,
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare(`UPDATE profiles SET avatar_key = ?1, updated_at = ?2 WHERE user_id = ?3`)
    .bind(avatarKey, now, userId)
    .run();
}

export async function searchDirectoryMembers(
  db: D1Database,
  query: DirectoryQuery,
): Promise<DirectoryListResponse> {
  const conditions: string[] = [
    "u.verification_status = 'verified'",
    "p.directory_visible = 1",
  ];
  const bindings: unknown[] = [];

  if (query.userType !== "all") {
    bindings.push(query.userType);
    conditions.push(`p.user_type = ?${bindings.length}`);
  }

  if (query.department !== "all") {
    bindings.push(query.department);
    conditions.push(`p.department = ?${bindings.length}`);
  }

  if (query.q && query.q.length > 0) {
    const pattern = `%${escapeLikePattern(query.q)}%`;
    bindings.push(pattern);
    const idx = bindings.length;
    conditions.push(
      `(p.full_name LIKE ?${idx} ESCAPE '\\' OR COALESCE(p.headline, '') LIKE ?${idx} ESCAPE '\\' OR COALESCE(p.company, '') LIKE ?${idx} ESCAPE '\\' OR COALESCE(p.skills_json, '') LIKE ?${idx} ESCAPE '\\')`,
    );
  }

  const whereClause = conditions.join(" AND ");
  const countSql = `SELECT COUNT(*) AS total FROM users u INNER JOIN profiles p ON p.user_id = u.id WHERE ${whereClause}`;
  const countRow = await db
    .prepare(countSql)
    .bind(...bindings)
    .first<{ total: number }>();
  const total = countRow?.total ?? 0;

  const offset = (query.page - 1) * query.pageSize;
  const dataBindings = [...bindings, query.pageSize, offset];
  const limitIdx = bindings.length + 1;
  const offsetIdx = bindings.length + 2;

  const dataSql = `
    SELECT u.id AS user_id, p.full_name, p.user_type, p.department, p.entry_year, p.graduation_year,
           p.headline, p.company, p.city, p.bio, p.skills_json, p.avatar_key,
           p.contact_email, p.linkedin_url, p.github_url, p.website_url,
           p.show_contact_info, p.show_professional_links
    FROM users u
    INNER JOIN profiles p ON p.user_id = u.id
    WHERE ${whereClause}
    ORDER BY p.full_name ASC
    LIMIT ?${limitIdx} OFFSET ?${offsetIdx}
  `;

  const result = await db
    .prepare(dataSql)
    .bind(...dataBindings)
    .all<DirectoryRow>();

  const items = (result.results ?? []).map((row) => ({
    userId: row.user_id,
    fullName: row.full_name,
    userType: row.user_type,
    department: row.department,
    entryYear: row.entry_year,
    graduationYear: row.graduation_year,
    headline: row.headline,
    company: row.company,
    city: row.city,
    bio: row.bio,
    skills: parseSkillsJson(row.skills_json),
    avatarKey: row.avatar_key,
    contactEmail: row.show_contact_info === 1 ? row.contact_email : null,
    linkedinUrl: row.show_professional_links === 1 ? row.linkedin_url : null,
    githubUrl: row.show_professional_links === 1 ? row.github_url : null,
    websiteUrl: row.show_professional_links === 1 ? row.website_url : null,
  }));

  return {
    items,
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}
