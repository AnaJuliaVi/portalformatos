/* Adiciona coluna name em portal_users para exibir nomes no Planner */
ALTER TABLE portal_users ADD COLUMN IF NOT EXISTS name text;
