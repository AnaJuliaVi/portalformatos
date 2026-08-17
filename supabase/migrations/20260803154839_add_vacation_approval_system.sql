/*
# Sistema de aprovação de férias

1. Objetivo
Adiciona um fluxo de aprovação às férias: novas solicitações começam como
"Pendente", precisam de aprovação de um administrador, e somente férias
"Aprovada" aparecem no calendário/tela de férias. Inclui prevenção de
períodos sobrepostos, notificações para colaborador e administrador, e
histórico completo.

2. Alterações na tabela vacations
- approval_status (text, default 'Pendente'): 'Pendente' | 'Aprovada' | 'Recusada'
- reviewed_by (uuid, nullable): admin que revisou
- reviewed_at (timestamptz, nullable): data da revisão
- review_note (text, nullable): motivo da recusa (opcional)
- created_by agora tem DEFAULT auth.uid() para preencher automaticamente
- Registros existentes são marcados como 'Aprovada' (preservando dados)

3. Alterações na tabela notifications
- Novo tipo 'vacation' adicionado ao CHECK constraint
- Nova coluna target_user_id (uuid, nullable): quando preenchida, apenas
  esse usuário vê a notificação; quando NULL, é global

4. Funções
- is_portal_admin(): verifica se o usuário atual é admin (via portal_users)
- review_vacation(p_id, p_status, p_note): SECURITY DEFINER, apenas admin,
  atualiza status e notifica o colaborador
- check_vacation_overlap(): trigger BEFORE INSERT/UPDATE que impede
  períodos sobrepostos com férias já aprovadas para o mesmo colaborador
- notify_new_vacation_request(): trigger AFTER INSERT que notifica sobre
  nova solicitação

5. Segurança (RLS)
- vacations SELECT: todos autenticados podem ver (equipe compartilha dados)
- vacations INSERT: todos autenticados podem criar solicitações
- vacations UPDATE: apenas o dono (created_by) OU admin
- vacations DELETE: apenas o dono (created_by) OU admin
- A aprovação/recusa é feita via função SECURITY DEFINER que valida admin

6. Notas
- Idempotente: DROP IF EXISTS em policies e triggers
- Preserva dados existentes: registros atuais → 'Aprovada'
- Não há perda de dados
*/

-- ============ vacations: novas colunas ============

ALTER TABLE vacations ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'Pendente';
ALTER TABLE vacations ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE vacations ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE vacations ADD COLUMN IF NOT EXISTS review_note text;

ALTER TABLE vacations ALTER COLUMN created_by SET DEFAULT auth.uid();

-- Registros existentes → Aprovada (preserva dados atuais)
UPDATE vacations SET approval_status = 'Aprovada' WHERE approval_status = 'Pendente' AND created_at < now() - interval '1 minute';

CREATE INDEX IF NOT EXISTS idx_vacations_approval_status ON vacations (approval_status);
CREATE INDEX IF NOT EXISTS idx_vacations_employee ON vacations (employee_name);

-- ============ notifications: novo tipo + target_user_id ============

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN ('format', 'case', 'update', 'vacation'));

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS target_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_notifications_target_user ON notifications (target_user_id) WHERE target_user_id IS NOT NULL;

-- ============ Função auxiliar: is_portal_admin ============

CREATE OR REPLACE FUNCTION is_portal_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM portal_users pu
    JOIN auth.users au ON au.email = pu.email
    WHERE au.id = auth.uid() AND pu.role = 'admin' AND pu.status = 'active'
  );
$$;

-- ============ RLS: vacations (atualizada) ============

DROP POLICY IF EXISTS "select_vacations" ON vacations;
CREATE POLICY "select_vacations"
ON vacations FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_vacations" ON vacations;
CREATE POLICY "insert_vacations"
ON vacations FOR INSERT
TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_vacations" ON vacations;
CREATE POLICY "update_vacations"
ON vacations FOR UPDATE
TO authenticated
USING (auth.uid() = created_by OR is_portal_admin())
WITH CHECK (auth.uid() = created_by OR is_portal_admin());

DROP POLICY IF EXISTS "delete_vacations" ON vacations;
CREATE POLICY "delete_vacations"
ON vacations FOR DELETE
TO authenticated
USING (auth.uid() = created_by OR is_portal_admin());

-- ============ Função: review_vacation (aprovar/recusar) ============

CREATE OR REPLACE FUNCTION review_vacation(p_id uuid, p_status text, p_note text DEFAULT NULL)
RETURNS vacations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_employee text;
  v_created_by uuid;
  v_row vacations%ROWTYPE;
BEGIN
  IF NOT is_portal_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem aprovar ou recusar férias';
  END IF;
  IF p_status NOT IN ('Aprovada', 'Recusada') THEN
    RAISE EXCEPTION 'Status inválido. Use Aprovada ou Recusada.';
  END IF;

  SELECT employee_name, created_by INTO v_employee, v_created_by
  FROM vacations WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitação não encontrada';
  END IF;

  UPDATE vacations
  SET approval_status = p_status,
      review_note = p_note,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  WHERE id = p_id
  RETURNING * INTO v_row;

  -- Notifica o colaborador que solicitou
  INSERT INTO notifications (type, title, body, entity_id, target_user_id)
  VALUES (
    'vacation',
    CASE WHEN p_status = 'Aprovada' THEN 'Férias aprovadas' ELSE 'Férias recusadas' END,
    v_employee || ' — ' || p_status,
    p_id,
    v_created_by
  );

  RETURN v_row;
END;
$$;

-- ============ Trigger: impedir períodos sobrepostos ============

CREATE OR REPLACE FUNCTION check_vacation_overlap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conflict_count integer;
BEGIN
  SELECT COUNT(*) INTO conflict_count
  FROM vacations
  WHERE employee_name = NEW.employee_name
    AND approval_status = 'Aprovada'
    AND id <> NEW.id
    AND start_date <= NEW.end_date
    AND end_date >= NEW.start_date;

  IF conflict_count > 0 THEN
    RAISE EXCEPTION 'Já existe um período de férias aprovado que se sobrepõe a este intervalo para %.', NEW.employee_name;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_check_vacation_overlap ON vacations;
CREATE TRIGGER trigger_check_vacation_overlap
BEFORE INSERT OR UPDATE OF start_date, end_date, approval_status ON vacations
FOR EACH ROW EXECUTE FUNCTION check_vacation_overlap();

-- ============ Trigger: notificar nova solicitação ============

CREATE OR REPLACE FUNCTION notify_new_vacation_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.approval_status = 'Pendente' THEN
    INSERT INTO notifications (type, title, body, entity_id)
    VALUES (
      'vacation',
      'Nova solicitação de férias',
      NEW.employee_name,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_new_vacation_request ON vacations;
CREATE TRIGGER trigger_notify_new_vacation_request
AFTER INSERT ON vacations
FOR EACH ROW EXECUTE FUNCTION notify_new_vacation_request();
