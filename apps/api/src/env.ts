export interface Env {
  ENVIRONMENT: string;
  ALLOWED_ORIGINS: string;
  SUPABASE_URL?: string;
  SUPABASE_JWKS_URL?: string;
  SUPABASE_JWT_ISSUER?: string;
  SUPABASE_JWT_AUDIENCE?: string;
  QR_TOKEN_PEPPER?: string;
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
}
