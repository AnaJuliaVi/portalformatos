/*
# Enriquecer cases existentes com novos campos

1. Objetivo
Preenche os novos campos (platform, status, publication_date, gallery_images,
videos, links, updated_at) dos cases já cadastrados, para que as páginas de
detalhe e galeria exibam conteúdo rico.

2. Notas
- Atualizações idempotentes via WHERE para só preencher campos vazios.
- Sem operações destrutivas.
*/

UPDATE cases SET platform = 'Digital', updated_at = now() WHERE platform IS NULL;

UPDATE cases SET status = 'Ativo' WHERE status IS NULL OR status = '';

UPDATE cases SET publication_date = created_at::date WHERE publication_date IS NULL;

UPDATE cases SET updated_at = created_at WHERE updated_at IS NULL;

UPDATE cases
SET gallery_images = ARRAY[
  'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/3165215/pexels-photo-3165215.jpeg?auto=compress&cs=tinysrgb&w=1200'
],
videos = ARRAY['https://www.youtube.com/watch?v=dQw4w9WgXcQ']
WHERE title = 'Campanha Verão — Alto Impacto' AND (gallery_images = '{}' OR gallery_images IS NULL);

UPDATE cases
SET gallery_images = ARRAY[
  'https://images.pexels.com/photos/3753025/pexels-photo-3753025.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/3062541/pexels-photo-3062541.jpeg?auto=compress&cs=tinysrgb&w=1200'
],
links = '[{"label":"Apresentação comercial","url":"https://example.com/deck"},{"label":"Briefing criativo","url":"https://example.com/brief"}]'::jsonb
WHERE title = 'Lançamento Smartphone 2026' AND (gallery_images = '{}' OR gallery_images IS NULL);

UPDATE cases
SET gallery_images = ARRAY[
  'https://images.pexels.com/photos/3747468/pexels-photo-3747468.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1024248/pexels-photo-1024248.jpeg?auto=compress&cs=tinysrgb&w=1200'
]
WHERE title = 'Branded Content — Sustentabilidade' AND (gallery_images = '{}' OR gallery_images IS NULL);
