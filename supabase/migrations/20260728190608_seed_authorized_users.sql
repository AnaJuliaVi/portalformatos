/*
# Seed de usuários autorizados de exemplo

1. Objetivo
Cadastra os e-mails de exemplo fornecidos como usuários comuns ativos,
para que possam criar conta e acessar o portal.

2. Notas
- Inserção idempotente via ON CONFLICT (email) DO NOTHING.
- Todos com role 'common' e status 'active'.
*/

INSERT INTO portal_users (email, role, status) VALUES
('joao.silva@g.globo', 'common', 'active'),
('maria.santos@g.globo', 'common', 'active'),
('pedro.oliveira@g.globo', 'common', 'active')
ON CONFLICT (email) DO NOTHING;
