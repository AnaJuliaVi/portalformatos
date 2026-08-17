/*
# Remover e-mail ana.vicente.santos@g.globo do sistema de acesso

1. Objetivo
Remove o usuário "ana.vicente.santos@g.globo" da tabela portal_users.
Ele deixará de ter acesso ao portal e não será mais administrador.

2. Notas
- Operação de DELETE pontual e segura — apenas remove o registro específico.
- A coluna user_id não é referenciada por outras tabelas de forma que perca dados.
*/

DELETE FROM portal_users WHERE email = 'ana.vicente.santos@g.globo';
