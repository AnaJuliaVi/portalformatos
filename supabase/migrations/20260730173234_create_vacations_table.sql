/*
# Criar tabela de férias (vacations)

1. Objetivo
Cria uma tabela `vacations` para registrar os períodos de férias dos colaboradores,
permitindo cadastrar, editar, excluir e visualizar todas as férias da equipe.
O status (Programadas, Em andamento, Finalizadas) é calculado automaticamente
pela aplicação com base nas datas e na data atual.

2. Nova tabela: vacations
- id (uuid, primary key, default gen_random_uuid())
- employee_name (text, not null): nome do colaborador
- start_date (date, not null): data de início das férias (saída)
- end_date (date, not null): data de término das férias (retorno ao trabalho)
- days (integer, not null): quantidade de dias de férias (calculado)
- notes (text, nullable): observações opcionais
- created_by (uuid, nullable): id do usuário que cadastrou (referência ao auth.users)
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())

3. Validações
- CHECK (end_date >= start_date): a data de retorno não pode ser anterior à saída.
- CHECK (days > 0): a quantidade de dias deve ser positiva.

4. Segurança (RLS)
- RLS habilitado na tabela vacations.
- Todos os usuários autenticados podem ler, criar, editar e excluir férias,
  pois as férias são dados compartilhados da equipe (todos visualizam todas).
- Políticas separadas por verbo CRUD (SELECT, INSERT, UPDATE, DELETE).

5. Notas
- Idempotente: usa IF NOT EXISTS para a tabela e DROP IF EXISTS para policies.
- created_by é opcional para não quebrar inserts que não enviam o user_id.
- Não há perda de dados — apenas criação de nova tabela.
*/

CREATE TABLE IF NOT EXISTS vacations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  days integer NOT NULL,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vacations_end_after_start CHECK (end_date >= start_date),
  CONSTRAINT vacations_days_positive CHECK (days > 0)
);

ALTER TABLE vacations ENABLE ROW LEVEL SECURITY;

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
TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_vacations" ON vacations;
CREATE POLICY "delete_vacations"
ON vacations FOR DELETE
TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_vacations_start_date ON vacations (start_date);
CREATE INDEX IF NOT EXISTS idx_vacations_end_date ON vacations (end_date);
