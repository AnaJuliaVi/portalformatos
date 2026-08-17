/*
# Tornar cases.title nullable

1. Objetivo
O campo `title` deixa de ser obrigatório. O título do case será derivado
automaticamente do nome do formato publicitário selecionado, no frontend.
O campo continua existindo no banco por compatibilidade, mas aceita NULL.

2. Notas
- Apenas ALTER COLUMN ... DROP NOT NULL — sem perda de dados.
- Idempotente via DO $$ ... IF NOT EXISTS.
*/

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'title' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE cases ALTER COLUMN title DROP NOT NULL;
  END IF;
END $$;
