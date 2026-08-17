/*
# Portal de Formatos Publicitários — Esquema do banco

1. Visão geral
Este portal é uma biblioteca interna dos formatos publicitários da Globo, organizada
por FORMATOS (e não mais por verticais). É um app single-tenant, sem login, onde os
dados são compartilhados/publicos para todo o time.

2. Novas tabelas
- `formats` — catálogo de formatos publicitários (Billboard, Touchpoint, etc.)
  - id (uuid, pk)
  - name (text, nome do formato)
  - slug (text, único, para URLs)
  - description (text)
  - platform (text: Digital, TV Aberta, TV Fechada, Streaming)
  - status (text: Ativo, Inativo, Rascunho)
  - media_type (text: tipo de mídia, ex. Display, Vídeo, Native, Áudio)
  - has_case (boolean: possui case de sucesso)
  - thumbnail_url (text)
  - updated_at (timestamptz)
  - created_at (timestamptz)
- `cases` — cases de sucesso vinculados a formatos
  - id, title, format_id (fk), client, description, image_url, featured (boolean), created_at
- `portal_updates` — últimas atualizações realizadas no portal
  - id, title, description, created_at
- `team_events` — eventos do time (férias, aniversários, planner)
  - id, type (vacation/birthday/planner), person, event_date, description, created_at

3. Segurança
- RLS habilitado em todas as tabelas.
- App sem login → políticas TO anon, authenticated com USING (true), pois os dados
  são intencionalmente públicos/compartilhados internamente.

4. Notas
- Sem user_id / auth.uid() pois não há tela de login.
- Foreign key cases.format_id → formats.id com ON DELETE SET NULL.
*/

CREATE TABLE IF NOT EXISTS formats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  platform text NOT NULL DEFAULT 'Digital',
  status text NOT NULL DEFAULT 'Rascunho',
  media_type text,
  has_case boolean NOT NULL DEFAULT false,
  thumbnail_url text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  format_id uuid REFERENCES formats(id) ON DELETE SET NULL,
  client text,
  description text,
  image_url text,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portal_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  person text NOT NULL,
  event_date date,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE formats ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_formats" ON formats;
CREATE POLICY "anon_select_formats" ON formats FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_formats" ON formats;
CREATE POLICY "anon_insert_formats" ON formats FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_formats" ON formats;
CREATE POLICY "anon_update_formats" ON formats FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_formats" ON formats;
CREATE POLICY "anon_delete_formats" ON formats FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_cases" ON cases;
CREATE POLICY "anon_select_cases" ON cases FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_cases" ON cases;
CREATE POLICY "anon_insert_cases" ON cases FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_cases" ON cases;
CREATE POLICY "anon_update_cases" ON cases FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_cases" ON cases;
CREATE POLICY "anon_delete_cases" ON cases FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_portal_updates" ON portal_updates;
CREATE POLICY "anon_select_portal_updates" ON portal_updates FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_portal_updates" ON portal_updates;
CREATE POLICY "anon_insert_portal_updates" ON portal_updates FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_portal_updates" ON portal_updates;
CREATE POLICY "anon_update_portal_updates" ON portal_updates FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_portal_updates" ON portal_updates;
CREATE POLICY "anon_delete_portal_updates" ON portal_updates FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_team_events" ON team_events;
CREATE POLICY "anon_select_team_events" ON team_events FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_team_events" ON team_events;
CREATE POLICY "anon_insert_team_events" ON team_events FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_team_events" ON team_events;
CREATE POLICY "anon_update_team_events" ON team_events FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_team_events" ON team_events;
CREATE POLICY "anon_delete_team_events" ON team_events FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_formats_status ON formats(status);
CREATE INDEX IF NOT EXISTS idx_formats_platform ON formats(platform);
CREATE INDEX IF NOT EXISTS idx_formats_updated_at ON formats(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_featured ON cases(featured);
CREATE INDEX IF NOT EXISTS idx_cases_format_id ON cases(format_id);
