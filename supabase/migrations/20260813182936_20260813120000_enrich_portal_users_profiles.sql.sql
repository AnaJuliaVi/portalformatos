/*
# Enrich portal_users with full profile fields + avatars storage bucket

1. Modified Tables
- `portal_users` — adds profile fields to transform the table into a living team registry:
  - `photo_url` (text, nullable) — public URL of the user's avatar image in storage
  - `job_title` (text, nullable) — cargo/função (e.g. "Gerente de Formatos")
  - `area` (text, nullable) — área do integrante (e.g. "Digital", "TV")
  - `join_date` (date, nullable) — data de entrada no time
  - `birthday` (date, nullable) — data de aniversário (used for dynamic birthday lists)
  - `updated_at` — already exists, no change needed

2. New Storage Bucket
- `avatars` — public bucket for profile photos
- Policies: authenticated users can read all avatars (public read) and upload/update their own

3. Security
- RLS already enabled on portal_users; existing policies remain unchanged.
- New storage policies on `avatars` bucket:
  - SELECT: public read (anon, authenticated) — avatars are visible to all portal users
  - INSERT/UPDATE: authenticated users can manage avatar objects (admin manages for all users)
  - DELETE: authenticated users can delete avatar objects

4. Important Notes
- All new columns are nullable so existing rows remain valid.
- The `birthday` column stores only month/day relevance; the year may be real or a placeholder.
- No data loss — purely additive migration.
*/

-- Add profile columns to portal_users
ALTER TABLE portal_users
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS area text,
  ADD COLUMN IF NOT EXISTS join_date date,
  ADD COLUMN IF NOT EXISTS birthday date;

-- Create avatars storage bucket (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
-- Public read: anyone can view avatars
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'avatars');

-- Authenticated users can upload avatars
DROP POLICY IF EXISTS "avatars_authenticated_upload" ON storage.objects;
CREATE POLICY "avatars_authenticated_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- Authenticated users can update avatars
DROP POLICY IF EXISTS "avatars_authenticated_update" ON storage.objects;
CREATE POLICY "avatars_authenticated_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars');

-- Authenticated users can delete avatars
DROP POLICY IF EXISTS "avatars_authenticated_delete" ON storage.objects;
CREATE POLICY "avatars_authenticated_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars');
