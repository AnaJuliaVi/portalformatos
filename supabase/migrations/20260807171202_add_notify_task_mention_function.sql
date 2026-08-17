/*
# Planner: função para notificar menções em comentários

1. Objetivo
Permite que o frontend notifique usuários mencionados em comentários
sem precisar acessar auth.users (bloqueado por RLS).

2. Nova função
- notify_task_mention(p_task_id, p_body, p_emails[]): SECURITY DEFINER,
  resolve emails → user_ids em auth.users e insere notificações.
*/

CREATE OR REPLACE FUNCTION notify_task_mention(p_task_id uuid, p_body text, p_emails text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email text;
  uid uuid;
BEGIN
  FOREACH email IN ARRAY p_emails LOOP
    SELECT id INTO uid FROM auth.users WHERE email = email LIMIT 1;
    IF uid IS NOT NULL THEN
      INSERT INTO notifications (type, title, body, entity_id, target_user_id)
      VALUES ('task', 'Você foi mencionado em um comentário', p_body, p_task_id, uid);
    END IF;
  END LOOP;
END;
$$;
