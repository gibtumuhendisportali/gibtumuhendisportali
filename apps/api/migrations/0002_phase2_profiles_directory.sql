-- Phase 2: Professional Profile Fields & Directory Indexing

ALTER TABLE profiles ADD COLUMN headline TEXT;
ALTER TABLE profiles ADD COLUMN company TEXT;
ALTER TABLE profiles ADD COLUMN city TEXT;
ALTER TABLE profiles ADD COLUMN bio TEXT;
ALTER TABLE profiles ADD COLUMN skills_json TEXT;
ALTER TABLE profiles ADD COLUMN contact_email TEXT;
ALTER TABLE profiles ADD COLUMN linkedin_url TEXT;
ALTER TABLE profiles ADD COLUMN github_url TEXT;
ALTER TABLE profiles ADD COLUMN website_url TEXT;
ALTER TABLE profiles ADD COLUMN avatar_key TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_directory_visible
  ON profiles(directory_visible, user_type, department);
