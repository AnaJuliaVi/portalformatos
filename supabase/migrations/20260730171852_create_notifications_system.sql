/*
# Criar sistema de notificações

1. Objetivo
Cria uma tabela `notifications` que registra eventos da plataforma (novos formatos,
novos cases, atualizações) e permite aos usuários acompanhar novidades através
do sino de notificações no topo da interface.

2. Nova tabela: notifications
- id (uuid, primary key)
- type (text): categoria da notificação — 'format', 'case', 'update'
- title (text): título exibido no painel
- body (text, nullable): descrição detalhada
- entity_id (uuid, nullable): id do registro relacionado (formato ou case)
- entity_slug (text, nullable): slug para navegação (formatos)
- read (boolean, default false): indica se foi lida
- created_at (timestamptz, default now())

3. Segurança (RLS)
- RLS habilitado na tabela notifications.
- Políticas para anon + authenticated: todos os usuários autenticados do portal
  podem ler e marcar como lidas. Inserções/updates controlados por aplicação
  via service role (triggers) e pelos usuários para marcar como lida.

4. Triggers
- Trigger after INSERT em formats: gera notificação de novo formato.
- Trigger after INSERT em cases: gera notificação de novo case.
- Ambas as triggers são SECURITY DEFINER para poder inserir em notifications
  independente de RLS.

5. Notas
- Idempotente: usa IF NOT EXISTS / DROP IF EXISTS para triggers e políticas.
- Não há perda de dados — apenas criação de nova tabela + triggers.
*/

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('format', 'case', 'update')),
  title text NOT NULL,
  body text,
  entity_id uuid,
  entity_slug text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_notifications" ON notifications;
CREATE POLICY "select_notifications"
ON notifications FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "update_notifications" ON notifications;
CREATE POLICY "update_notifications"
ON notifications FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "insert_notifications" ON notifications;
CREATE POLICY "insert_notifications"
ON notifications FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "delete_notifications" ON notifications;
CREATE POLICY "delete_notifications"
ON notifications FOR DELETE
TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications (read) WHERE read = false;

-- Função para notificar novo formato
CREATE OR REPLACE FUNCTION notify_new_format()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (type, title, body, entity_id, entity_slug)
  VALUES (
    'format',
    'Novo formato: ' || NEW.name,
    NEW.description,
    NEW.id,
    NEW.slug
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_new_format ON formats;
CREATE TRIGGER trigger_notify_new_format
AFTER INSERT ON formats
FOR EACH ROW EXECUTE FUNCTION notify_new_format();

-- Função para notificar novo case
CREATE OR REPLACE FUNCTION notify_new_case()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (type, title, entity_id)
  VALUES (
    'case',
    'Novo case cadastrado',
    NEW.id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_new_case ON cases;
CREATE TRIGGER trigger_notify_new_case
AFTER INSERT ON cases
FOR EACH ROW EXECUTE FUNCTION notify_new_case();
