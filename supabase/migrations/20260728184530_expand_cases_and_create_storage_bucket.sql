/*
# Expandir cases + criar bucket de armazenamento

1. Tabela modificada: `cases`
Adiciona campos para suportar o cadastro completo de cases:
- `platform` (text) — plataforma do case (Digital, TV Aberta, TV Fechada, Streaming)
- `status` (text, default 'Ativo') — status do case (Ativo, Inativo, Rascunho)
- `publication_date` (date) — data de publicação
- `gallery_images` (text[], default '{}') — galeria de imagens (URLs)
- `videos` (text[], default '{}') — links de vídeos do case
- `links` (jsonb, default '[]') — materiais complementares [{label, url}]
- `updated_at` (timestamptz, default now()) — data da última atualização

A coluna `image_url` existente continua como imagem de capa.

2. Storage
- Cria bucket público `cases` para upload de imagens dos cases.
- Políticas: anon + authenticated podem inserir, ler, atualizar e excluir objetos
  no bucket `cases` (app sem login, dados compartilhados internamente).

3. Notas
- Todas as adições são idempotentes (DO $$ ... IF NOT EXISTS).
- Sem operações destrutivas — apenas adiciona colunas.
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'platform') THEN
    ALTER TABLE cases ADD COLUMN platform text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'status') THEN
    ALTER TABLE cases ADD COLUMN status text NOT NULL DEFAULT 'Ativo';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'publication_date') THEN
    ALTER TABLE cases ADD COLUMN publication_date date;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'gallery_images') THEN
    ALTER TABLE cases ADD COLUMN gallery_images text[] NOT NULL DEFAULT '{}';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'videos') THEN
    ALTER TABLE cases ADD COLUMN videos text[] NOT NULL DEFAULT '{}';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'links') THEN
    ALTER TABLE cases ADD COLUMN links jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'updated_at') THEN
    ALTER TABLE cases ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_format_id_status ON cases(format_id, status);

INSERT INTO storage.buckets (id, name, public) VALUES ('cases', 'cases', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "anon_select_cases_bucket" ON storage.objects;
CREATE POLICY "anon_select_cases_bucket" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'cases');

DROP POLICY IF EXISTS "anon_insert_cases_bucket" ON storage.objects;
CREATE POLICY "anon_insert_cases_bucket" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'cases');

DROP POLICY IF EXISTS "anon_update_cases_bucket" ON storage.objects;
CREATE POLICY "anon_update_cases_bucket" ON storage.objects
  FOR UPDATE TO anon, authenticated USING (bucket_id = 'cases') WITH CHECK (bucket_id = 'cases');

DROP POLICY IF EXISTS "anon_delete_cases_bucket" ON storage.objects;
CREATE POLICY "anon_delete_cases_bucket" ON storage.objects
  FOR DELETE TO anon, authenticated USING (bucket_id = 'cases');
