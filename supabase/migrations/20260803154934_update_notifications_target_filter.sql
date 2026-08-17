/*
# Notificações: filtrar por target_user_id

1. Objetivo
Notificações com target_user_id preenchido só devem ser visíveis para
o usuário alvo. Notificações com target_user_id NULL continuam globais.

2. Alterações
- Atualiza a policy SELECT de notifications para incluir o filtro.
*/

DROP POLICY IF EXISTS "select_notifications" ON notifications;
CREATE POLICY "select_notifications"
ON notifications FOR SELECT
TO authenticated
USING (target_user_id IS NULL OR target_user_id = auth.uid());
