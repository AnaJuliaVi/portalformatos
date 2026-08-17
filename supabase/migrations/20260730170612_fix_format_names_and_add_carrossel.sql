/*
# Corrigir nomes dos formatos + adicionar Carrossel

1. Objetivo
Padroniza os nomes dos formatos publicitários, corrigindo erros ortográficos
(Carousel → Carrossel) e removendo o prefixo "Native" dos formatos de carrossel.
Adiciona um novo formato "Carrossel" independente.

2. Formatos renomeados
- "Native Carousel Foto" → "Carrossel Foto"
- "Native Carousel Vídeo" → "Carrossel Vídeo"

3. Novo formato
- "Carrossel" (slug: carrossel, plataforma: Digital, mídia: Display)

4. Notas
- Atualiza os slugs dos formatos renomeados para manter consistência.
- Atualiza cases.title para refletir os novos nomes dos formatos.
- Sem operações destrutivas — apenas UPDATE e INSERT.
*/

UPDATE formats SET name = 'Carrossel Foto', slug = 'carrossel-foto', updated_at = now() WHERE name = 'Native Carousel Foto';

UPDATE formats SET name = 'Carrossel Vídeo', slug = 'carrossel-video', updated_at = now() WHERE name = 'Native Carousel Vídeo';

INSERT INTO formats (name, slug, platform, media_type, status, description, has_case)
SELECT 'Carrossel', 'carrossel', 'Digital', 'Display', 'Ativo',
  'Formato de carrossel publicitário que permite a exibição de múltiplos produtos ou mensagens em sequência, com rotação automática ou navegação manual pelo usuário.',
  false
WHERE NOT EXISTS (SELECT 1 FROM formats WHERE slug = 'carrossel');

UPDATE cases c
SET title = f.name, updated_at = now()
FROM formats f
WHERE c.format_id = f.id
  AND c.title IS DISTINCT FROM f.name;
