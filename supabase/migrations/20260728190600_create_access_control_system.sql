/*
# Sistema de controle de acesso e permissões do portal

1. Visão geral
Implementa um sistema de login baseado em e-mails corporativos @g.globo. Apenas
e-mails previamente cadastrados pelo administrador na tabela portal_users podem
criar conta e acessar o portal. Existem dois papéis: admin (acesso total) e
common (somente leitura).

2. Nova tabela: `portal_users`
- id (uuid, pk)
- email (text, único, não nulo) — e-mail corporativo @g.globo
- role (text, não nulo, default 'common') — 'admin' ou 'common'
- status (text, não nulo, default 'active') — 'active' ou 'inactive'
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())

3. Novas funções SQL
- `is_portal_admin()` — retorna true se o usuário autenticado atual é admin ativo.
  Usa auth.jwt() para obter o e-mail. Retorna false para usuários não autenticados.
- `is_authorized_email(check_email text)` — retorna true se o e-mail está na lista
  de usuários autorizados com status 'active'. SECURITY DEFINER para ser chamável
  por anon durante o cadastro/login.

4. Seed
- Cadastra ana.vicente.santos@g.globo como administrador ativo.

5. Alterações de RLS — TODAS as tabelas de dados
As tabelas formats, cases, portal_updates e team_events passam de
`TO anon, authenticated` para `TO authenticated`:
- SELECT: qualquer usuário autenticado pode ler.
- INSERT/UPDATE/DELETE: apenas administradores (via is_portal_admin()).

6. RLS — portal_users
- SELECT: qualquer usuário autenticado pode ver a lista de autorizados.
- INSERT/UPDATE/DELETE: apenas administradores.

7. Storage — bucket `cases`
- SELECT: apenas autenticados.
- INSERT/UPDATE/DELETE: apenas administradores.

8. Notas
- Políticas antigas são removidas (DROP POLICY) e substituídas — sem perda de dados.
- A função is_authorized_email permite que o frontend valide o e-mail antes de
  criar a conta, sem expor a lista completa de usuários.
- O e-mail admin é cadastrado mas ainda precisa criar sua conta (sign-up) no portal.
*/

-- =========================
-- Tabela portal_users
-- =========================
CREATE TABLE IF NOT EXISTS portal_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'common',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE portal_users ENABLE ROW LEVEL SECURITY;

-- Seed do administrador
INSERT INTO portal_users (email, role, status)
VALUES ('ana.vicente.santos@g.globo', 'admin', 'active')
ON CONFLICT (email) DO NOTHING;

-- =========================
-- Funções auxiliares
-- =========================

-- Verifica se o usuário atual é admin ativo
CREATE OR REPLACE FUNCTION is_portal_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM portal_users
    WHERE email = auth.jwt() ->> 'email'
    AND role = 'admin'
    AND status = 'active'
  );
$$;

-- Verifica se um e-mail está autorizado (chamável por anon)
CREATE OR REPLACE FUNCTION is_authorized_email(check_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM portal_users
    WHERE email = check_email
    AND status = 'active'
  );
$$;

-- =========================
-- RLS: portal_users
-- =========================
DROP POLICY IF EXISTS "anon_select_portal_users" ON portal_users;
DROP POLICY IF EXISTS "auth_select_portal_users" ON portal_users;
CREATE POLICY "auth_select_portal_users" ON portal_users
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_portal_users" ON portal_users;
DROP POLICY IF EXISTS "admin_insert_portal_users" ON portal_users;
CREATE POLICY "admin_insert_portal_users" ON portal_users
  FOR INSERT TO authenticated WITH CHECK (is_portal_admin());

DROP POLICY IF EXISTS "anon_update_portal_users" ON portal_users;
DROP POLICY IF EXISTS "admin_update_portal_users" ON portal_users;
CREATE POLICY "admin_update_portal_users" ON portal_users
  FOR UPDATE TO authenticated USING (is_portal_admin()) WITH CHECK (is_portal_admin());

DROP POLICY IF EXISTS "anon_delete_portal_users" ON portal_users;
DROP POLICY IF EXISTS "admin_delete_portal_users" ON portal_users;
CREATE POLICY "admin_delete_portal_users" ON portal_users
  FOR DELETE TO authenticated USING (is_portal_admin());

-- =========================
-- RLS: formats (restrito a authenticated)
-- =========================
DROP POLICY IF EXISTS "anon_select_formats" ON formats;
CREATE POLICY "auth_select_formats" ON formats
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_formats" ON formats;
CREATE POLICY "admin_insert_formats" ON formats
  FOR INSERT TO authenticated WITH CHECK (is_portal_admin());

DROP POLICY IF EXISTS "anon_update_formats" ON formats;
CREATE POLICY "admin_update_formats" ON formats
  FOR UPDATE TO authenticated USING (is_portal_admin()) WITH CHECK (is_portal_admin());

DROP POLICY IF EXISTS "anon_delete_formats" ON formats;
CREATE POLICY "admin_delete_formats" ON formats
  FOR DELETE TO authenticated USING (is_portal_admin());

-- =========================
-- RLS: cases (restrito a authenticated)
-- =========================
DROP POLICY IF EXISTS "anon_select_cases" ON cases;
CREATE POLICY "auth_select_cases" ON cases
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_cases" ON cases;
CREATE POLICY "admin_insert_cases" ON cases
  FOR INSERT TO authenticated WITH CHECK (is_portal_admin());

DROP POLICY IF EXISTS "anon_update_cases" ON cases;
CREATE POLICY "admin_update_cases" ON cases
  FOR UPDATE TO authenticated USING (is_portal_admin()) WITH CHECK (is_portal_admin());

DROP POLICY IF EXISTS "anon_delete_cases" ON cases;
CREATE POLICY "admin_delete_cases" ON cases
  FOR DELETE TO authenticated USING (is_portal_admin());

-- =========================
-- RLS: portal_updates (restrito a authenticated)
-- =========================
DROP POLICY IF EXISTS "anon_select_portal_updates" ON portal_updates;
CREATE POLICY "auth_select_portal_updates" ON portal_updates
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_portal_updates" ON portal_updates;
CREATE POLICY "admin_insert_portal_updates" ON portal_updates
  FOR INSERT TO authenticated WITH CHECK (is_portal_admin());

DROP POLICY IF EXISTS "anon_update_portal_updates" ON portal_updates;
CREATE POLICY "admin_update_portal_updates" ON portal_updates
  FOR UPDATE TO authenticated USING (is_portal_admin()) WITH CHECK (is_portal_admin());

DROP POLICY IF EXISTS "anon_delete_portal_updates" ON portal_updates;
CREATE POLICY "admin_delete_portal_updates" ON portal_updates
  FOR DELETE TO authenticated USING (is_portal_admin());

-- =========================
-- RLS: team_events (restrito a authenticated)
-- =========================
DROP POLICY IF EXISTS "anon_select_team_events" ON team_events;
CREATE POLICY "auth_select_team_events" ON team_events
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_team_events" ON team_events;
CREATE POLICY "admin_insert_team_events" ON team_events
  FOR INSERT TO authenticated WITH CHECK (is_portal_admin());

DROP POLICY IF EXISTS "anon_update_team_events" ON team_events;
CREATE POLICY "admin_update_team_events" ON team_events
  FOR UPDATE TO authenticated USING (is_portal_admin()) WITH CHECK (is_portal_admin());

DROP POLICY IF EXISTS "anon_delete_team_events" ON team_events;
CREATE POLICY "admin_delete_team_events" ON team_events
  FOR DELETE TO authenticated USING (is_portal_admin());

-- =========================
-- Storage: bucket cases (restrito a authenticated)
-- =========================
DROP POLICY IF EXISTS "anon_select_cases_bucket" ON storage.objects;
CREATE POLICY "auth_select_cases_bucket" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'cases');

DROP POLICY IF EXISTS "anon_insert_cases_bucket" ON storage.objects;
CREATE POLICY "admin_insert_cases_bucket" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'cases' AND is_portal_admin());

DROP POLICY IF EXISTS "anon_update_cases_bucket" ON storage.objects;
CREATE POLICY "admin_update_cases_bucket" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'cases' AND is_portal_admin()) WITH CHECK (bucket_id = 'cases' AND is_portal_admin());

DROP POLICY IF EXISTS "anon_delete_cases_bucket" ON storage.objects;
CREATE POLICY "admin_delete_cases_bucket" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'cases' AND is_portal_admin());
