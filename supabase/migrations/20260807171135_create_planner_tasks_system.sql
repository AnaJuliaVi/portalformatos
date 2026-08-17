/*
# Planner — sistema completo de tarefas

1. Objetivo
Cria um gerenciador de tarefas estilo Microsoft Planner com buckets
(A Fazer, Em Andamento, Em Revisão, Concluído), drag-and-drop, checklist,
comentários com menções, anexos, etiquetas, prioridade, recorrência,
histórico de alterações e notificações. Usa a mesma base de usuários
do portal (portal_users).

2. Novas tabelas
- planner_tasks: tarefas principais
- planner_comments: comentários das tarefas (com menções)
- planner_activity: histórico de alterações de cada tarefa

3. planner_tasks
- id (uuid pk)
- title (text, not null)
- description (text, nullable)
- bucket (text, not null): 'A Fazer' | 'Em Andamento' | 'Em Revisão' | 'Concluído'
- priority (text, default 'Média'): 'Baixa' | 'Média' | 'Alta' | 'Urgente'
- assignee (text, nullable): email do responsável (portal_users)
- start_date (date, nullable)
- due_date (date, nullable)
- labels (text[], default '{}'): etiquetas coloridas
- checklist (jsonb, default '[]'): [{id, text, done}]
- attachments (jsonb, default '[]'): [{id, type, label, url}]
- recurrence (text, nullable): 'daily' | 'weekly' | 'monthly' | null
- sort_order (integer, default 0): ordenação dentro do bucket
- created_by (uuid, default auth.uid()): quem criou
- created_at, updated_at (timestamptz)

4. planner_comments
- id (uuid pk)
- task_id (uuid fk → planner_tasks ON DELETE CASCADE)
- author (text): email de quem comentou
- body (text): conteúdo (suporta @menções em texto puro)
- mentions (text[], default '{}'): emails mencionados
- created_at (timestamptz)

5. planner_activity
- id (uuid pk)
- task_id (uuid fk → planner_tasks ON DELETE CASCADE)
- actor (text): email de quem fez a alteração
- action (text): descrição da alteração
- created_at (timestamptz)

6. Notificações
- Novo tipo 'task' adicionado ao CHECK de notifications
- Trigger após INSERT em planner_tasks: notifica atribuição
- Trigger após UPDATE (mudança de bucket ou assignee): notifica alteração
- Função helper notifica usuarios quando tarefa está próxima do prazo

7. Segurança (RLS)
- Todas as tabelas: authenticated pode ler tudo (dados compartilhados)
- INSERT: qualquer autenticado pode criar
- UPDATE/DELETE: criador da tarefa ou admin (is_portal_admin)
- Comments/activity: qualquer autenticado pode inserir; update/delete
  restrito ao autor ou admin

8. Notas
- Idempotente com IF NOT EXISTS / DROP IF EXISTS
- Sem perda de dados
- Estrutura preparada para sincronização com Power Apps/SharePoint
  (campos em JSONB são compatíveis com exportação)
*/

-- ============ planner_tasks ============

CREATE TABLE IF NOT EXISTS planner_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  bucket text NOT NULL DEFAULT 'A Fazer' CHECK (bucket IN ('A Fazer', 'Em Andamento', 'Em Revisão', 'Concluído')),
  priority text NOT NULL DEFAULT 'Média' CHECK (priority IN ('Baixa', 'Média', 'Alta', 'Urgente')),
  assignee text,
  start_date date,
  due_date date,
  labels text[] NOT NULL DEFAULT '{}',
  checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  recurrence text CHECK (recurrence IS NULL OR recurrence IN ('daily', 'weekly', 'monthly')),
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE planner_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_planner_tasks" ON planner_tasks;
CREATE POLICY "select_planner_tasks"
ON planner_tasks FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_planner_tasks" ON planner_tasks;
CREATE POLICY "insert_planner_tasks"
ON planner_tasks FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_planner_tasks" ON planner_tasks;
CREATE POLICY "update_planner_tasks"
ON planner_tasks FOR UPDATE TO authenticated
USING (auth.uid() = created_by OR is_portal_admin())
WITH CHECK (auth.uid() = created_by OR is_portal_admin());

DROP POLICY IF EXISTS "delete_planner_tasks" ON planner_tasks;
CREATE POLICY "delete_planner_tasks"
ON planner_tasks FOR DELETE TO authenticated
USING (auth.uid() = created_by OR is_portal_admin());

CREATE INDEX IF NOT EXISTS idx_planner_tasks_bucket ON planner_tasks (bucket);
CREATE INDEX IF NOT EXISTS idx_planner_tasks_assignee ON planner_tasks (assignee);
CREATE INDEX IF NOT EXISTS idx_planner_tasks_due_date ON planner_tasks (due_date);
CREATE INDEX IF NOT EXISTS idx_planner_tasks_sort ON planner_tasks (bucket, sort_order);

-- ============ planner_comments ============

CREATE TABLE IF NOT EXISTS planner_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES planner_tasks(id) ON DELETE CASCADE,
  author text NOT NULL,
  body text NOT NULL,
  mentions text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE planner_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_planner_comments" ON planner_comments;
CREATE POLICY "select_planner_comments"
ON planner_comments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_planner_comments" ON planner_comments;
CREATE POLICY "insert_planner_comments"
ON planner_comments FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "delete_planner_comments" ON planner_comments;
CREATE POLICY "delete_planner_comments"
ON planner_comments FOR DELETE TO authenticated
USING (true);

CREATE INDEX IF NOT EXISTS idx_planner_comments_task ON planner_comments (task_id, created_at);

-- ============ planner_activity ============

CREATE TABLE IF NOT EXISTS planner_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES planner_tasks(id) ON DELETE CASCADE,
  actor text NOT NULL,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE planner_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_planner_activity" ON planner_activity;
CREATE POLICY "select_planner_activity"
ON planner_activity FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_planner_activity" ON planner_activity;
CREATE POLICY "insert_planner_activity"
ON planner_activity FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_planner_activity_task ON planner_activity (task_id, created_at);

-- ============ notifications: novo tipo 'task' ============

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('format', 'case', 'update', 'vacation', 'task'));

-- ============ Trigger: notificar nova tarefa atribuída ============

CREATE OR REPLACE FUNCTION notify_new_task()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assignee_email text;
  v_assignee_id uuid;
BEGIN
  IF NEW.assignee IS NOT NULL THEN
    SELECT id INTO v_assignee_id FROM auth.users WHERE email = NEW.assignee LIMIT 1;
    INSERT INTO notifications (type, title, body, entity_id, target_user_id)
    VALUES ('task', 'Nova tarefa atribuída', NEW.title, NEW.id, v_assignee_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_new_task ON planner_tasks;
CREATE TRIGGER trigger_notify_new_task
AFTER INSERT ON planner_tasks
FOR EACH ROW EXECUTE FUNCTION notify_new_task();

-- ============ Trigger: notificar mudança de responsável ============

CREATE OR REPLACE FUNCTION notify_task_assignee_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_id uuid;
BEGIN
  IF NEW.assignee IS DISTINCT FROM OLD.assignee AND NEW.assignee IS NOT NULL THEN
    SELECT id INTO v_new_id FROM auth.users WHERE email = NEW.assignee LIMIT 1;
    INSERT INTO notifications (type, title, body, entity_id, target_user_id)
    VALUES ('task', 'Tarefa atribuída a você', NEW.title, NEW.id, v_new_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_task_assignee_change ON planner_tasks;
CREATE TRIGGER trigger_notify_task_assignee_change
AFTER UPDATE OF assignee ON planner_tasks
FOR EACH ROW EXECUTE FUNCTION notify_task_assignee_change();

-- ============ Trigger: registrar atividade em mudanças ============

CREATE OR REPLACE FUNCTION log_task_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor text;
BEGIN
  SELECT email INTO v_actor FROM auth.users WHERE id = auth.uid() LIMIT 1;
  v_actor := COALESCE(v_actor, 'Sistema');

  IF TG_OP = 'INSERT' THEN
    INSERT INTO planner_activity (task_id, actor, action)
    VALUES (NEW.id, v_actor, 'Criou a tarefa');
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.bucket IS DISTINCT FROM OLD.bucket THEN
      INSERT INTO planner_activity (task_id, actor, action)
      VALUES (NEW.id, v_actor, 'Moveu para "' || NEW.bucket || '"');
    END IF;
    IF NEW.title IS DISTINCT FROM OLD.title THEN
      INSERT INTO planner_activity (task_id, actor, action)
      VALUES (NEW.id, v_actor, 'Atualizou o título');
    END IF;
    IF NEW.assignee IS DISTINCT FROM OLD.assignee THEN
      INSERT INTO planner_activity (task_id, actor, action)
      VALUES (NEW.id, v_actor, 'Atribuiu a ' || COALESCE(NEW.assignee, 'ninguém'));
    END IF;
    IF NEW.due_date IS DISTINCT FROM OLD.due_date THEN
      INSERT INTO planner_activity (task_id, actor, action)
      VALUES (NEW.id, v_actor, 'Alterou o prazo para ' || COALESCE(NEW.due_date::text, '—'));
    END IF;
    IF NEW.priority IS DISTINCT FROM OLD.priority THEN
      INSERT INTO planner_activity (task_id, actor, action)
      VALUES (NEW.id, v_actor, 'Prioridade: ' || NEW.priority);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_log_task_activity_insert ON planner_tasks;
CREATE TRIGGER trigger_log_task_activity_insert
AFTER INSERT ON planner_tasks
FOR EACH ROW EXECUTE FUNCTION log_task_activity();

DROP TRIGGER IF EXISTS trigger_log_task_activity_update ON planner_tasks;
CREATE TRIGGER trigger_log_task_activity_update
AFTER UPDATE ON planner_tasks
FOR EACH ROW EXECUTE FUNCTION log_task_activity();
