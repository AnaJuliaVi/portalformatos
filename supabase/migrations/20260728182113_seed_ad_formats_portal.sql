/*
# Dados iniciais — formatos, cases, atualizações e eventos do time

1. Conteúdo
- Catálogo completo de formatos publicitários (Billboard, Retângulo Médio, Native
  Carousel Foto/Vídeo, Touchpoint, Pause Ads Takeover, Clickshop, Big Banner,
  Mini Stories, Vitrine, DCO, Branded Content, Home Day, VGLOBO, Banner Vídeo).
- Cases em destaque vinculados a alguns formatos.
- Atualizações recentes do portal.
- Eventos do time: férias, aniversários e itens do planner da semana.

2. Observações
- Inserção idempotente via ON CONFLICT (slug) DO NOTHING para formats.
- Para as demais tabelas, usa-se WHERE NOT EXISTS por chave natural.
*/

INSERT INTO formats (name, slug, description, platform, status, media_type, has_case, thumbnail_url, updated_at) VALUES
('Billboard', 'billboard', 'Formato de alto impacto no topo das páginas, com grande visibilidade e espaço criativo ampliado para campanhas de branding.', 'Digital', 'Ativo', 'Display', true, 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=1200', '2026-07-28'),
('Retângulo Médio', 'retangulo-medio', 'Formato retangular de médio porte inserido no fluxo editorial, equilibrando performance e impacto visual.', 'Digital', 'Ativo', 'Display', true, 'https://images.pexels.com/photos/669615/pexels-photo-669615.jpeg?auto=compress&cs=tinysrgb&w=1200', '2026-07-27'),
('Native Carousel Foto', 'native-carousel-foto', 'Carrossel nativo de fotos que se integra ao conteúdo editorial, gerando alta interação e contexto relevante.', 'Digital', 'Ativo', 'Native', false, 'https://images.pexels.com/photos/1051838/pexels-photo-1051838.jpeg?auto=compress&cs=tinysrgb&w=1200', '2026-07-26'),
('Native Carousel Vídeo', 'native-carousel-video', 'Carrossel nativo com vídeos curtos, combinando o engajamento do formato carrossel com o poder do vídeo.', 'Digital', 'Ativo', 'Native', true, 'https://images.pexels.com/photos/3753025/pexels-photo-3753025.jpeg?auto=compress&cs=tinysrgb&w=1200', '2026-07-25'),
('Touchpoint', 'touchpoint', 'Unidade interativa que aparece em momentos estratégicos da navegação, com chamada para ação direta.', 'Digital', 'Ativo', 'Display', true, 'https://images.pexels.com/photos/1181271/pexels-photo-1181271.jpeg?auto=compress&cs=tinysrgb&w=1200', '2026-07-24'),
('Pause Ads Takeover', 'pause-ads-takeover', 'Anúncio em destaque durante a pausa do vídeo, ocupando a tela com criativos imersivos e contexto premium.', 'Streaming', 'Ativo', 'Vídeo', false, 'https://images.pexels.com/photos/3165215/pexels-photo-3165215.jpeg?auto=compress&cs=tinysrgb&w=1200', '2026-07-28'),
('Clickshop', 'clickshop', 'Formato comercial que transforma o inventário em vitrine clicável, levando o usuário direto ao produto.', 'Digital', 'Ativo', 'Display', false, 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=1200', '2026-07-23'),
('Big Banner', 'big-banner', 'Banner de grande formato com forte presença visual, ideal para campanhas de alcance e reconhecimento de marca.', 'Digital', 'Ativo', 'Display', true, 'https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=1200', '2026-07-22'),
('Mini Stories', 'mini-stories', 'Sequência de cards em formato stories, vertical e imersivo, inspirado na experiência mobile nativa.', 'Digital', 'Ativo', 'Native', false, 'https://images.pexels.com/photos/341523/pexels-photo-341523.jpeg?auto=compress&cs=tinysrgb&w=1200', '2026-07-21'),
('Vitrine', 'vitrine', 'Vitrine dinâmica que reúne múltiplos produtos em um layout elegante, com rotação automática e interação manual.', 'Digital', 'Ativo', 'Display', false, 'https://images.pexels.com/photos/264787/pexels-photo-264787.jpeg?auto=compress&cs=tinysrgb&w=1200', '2026-07-20'),
('DCO', 'dco', 'Dynamic Creative Optimization: criativos gerados dinamicamente em tempo real, personalizados por audiência e contexto.', 'Digital', 'Ativo', 'Display', true, 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1200', '2026-07-19'),
('Branded Content', 'branded-content', 'Conteúdo desenvolvido em parceria com marcas, integrado ao editorial com narrativa e identidade própria.', 'Digital', 'Ativo', 'Native', true, 'https://images.pexels.com/photos/3747468/pexels-photo-3747468.jpeg?auto=compress&cs=tinysrgb&w=1200', '2026-07-18'),
('Home Day', 'home-day', 'Domínio criativo da home por um dia, com takeover completo e experiência de marca envolvente.', 'Digital', 'Ativo', 'Display', false, 'https://images.pexels.com/photos/259024/pexels-photo-259024.jpeg?auto=compress&cs=tinysrgb&w=1200', '2026-07-17'),
('VGLOBO', 'vglobo', 'Formato exclusivo que combina a força da marca Globo com posicionamento premium em ambientes de alto valor.', 'Digital', 'Ativo', 'Display', false, 'https://images.pexels.com/photos/1024248/pexels-photo-1024248.jpeg?auto=compress&cs=tinysrgb&w=1200', '2026-07-16'),
('Banner Vídeo', 'banner-video', 'Banner com vídeo embutido, unindo o impacto do movimento ao desempenho do formato display tradicional.', 'Digital', 'Ativo', 'Vídeo', false, 'https://images.pexels.com/photos/3062541/pexels-photo-3062541.jpeg?auto=compress&cs=tinysrgb&w=1200', '2026-07-15')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO cases (title, format_id, client, description, image_url, featured, created_at)
SELECT 'Campanha Verão — Alto Impacto', f.id, 'Bebidas Frutas', 'Takeover no Billboard da home durante 3 dias, gerando 4.2M de impressões e CTR 2.1%.', 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=1200', true, '2026-07-20'
FROM formats f WHERE f.slug = 'billboard' AND NOT EXISTS (SELECT 1 FROM cases c WHERE c.title = 'Campanha Verão — Alto Impacto');

INSERT INTO cases (title, format_id, client, description, image_url, featured, created_at)
SELECT 'Lançamento Smartphone 2026', f.id, 'Tech Mobile', 'Sequência de Native Carousel Vídeo com 5 criativos, alcançando 87% de taxa de visualização completa.', 'https://images.pexels.com/photos/3753025/pexels-photo-3753025.jpeg?auto=compress&cs=tinysrgb&w=1200', true, '2026-07-22'
FROM formats f WHERE f.slug = 'native-carousel-video' AND NOT EXISTS (SELECT 1 FROM cases c WHERE c.title = 'Lançamento Smartphone 2026');

INSERT INTO cases (title, format_id, client, description, image_url, featured, created_at)
SELECT 'Branded Content — Sustentabilidade', f.id, 'Eco Brand', 'Conteúdo nativo em 4 peças editoriais sobre sustentabilidade, com 1.2M de leituras completas.', 'https://images.pexels.com/photos/3747468/pexels-photo-3747468.jpeg?auto=compress&cs=tinysrgb&w=1200', true, '2026-07-18'
FROM formats f WHERE f.slug = 'branded-content' AND NOT EXISTS (SELECT 1 FROM cases c WHERE c.title = 'Branded Content — Sustentabilidade');

INSERT INTO cases (title, format_id, client, description, image_url, featured, created_at)
SELECT 'DCO — Personalização por Audiência', f.id, 'Auto Premium', '18 variações de criativo servidas dinamicamente, aumentando a taxa de conversão em 34%.', 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1200', false, '2026-07-19'
FROM formats f WHERE f.slug = 'dco' AND NOT EXISTS (SELECT 1 FROM cases c WHERE c.title = 'DCO — Personalização por Audiência');

INSERT INTO cases (title, format_id, client, description, image_url, featured, created_at)
SELECT 'Touchpoint — fintech onboarding', f.id, 'Fintech X', 'Unidade interativa no fluxo de notícias, levando a 28 mil novos cadastros em 2 semanas.', 'https://images.pexels.com/photos/1181271/pexels-photo-1181271.jpeg?auto=compress&cs=tinysrgb&w=1200', false, '2026-07-24'
FROM formats f WHERE f.slug = 'touchpoint' AND NOT EXISTS (SELECT 1 FROM cases c WHERE c.title = 'Touchpoint — fintech onboarding');

INSERT INTO cases (title, format_id, client, description, image_url, featured, created_at)
SELECT 'Big Banner — campanha institucional', f.id, 'Banco Nacional', 'Campanha de reconhecimento de marca com 12 dias de veiculação, alcance de 9.8M usuários únicos.', 'https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=1200', false, '2026-07-22'
FROM formats f WHERE f.slug = 'big-banner' AND NOT EXISTS (SELECT 1 FROM cases c WHERE c.title = 'Big Banner — campanha institucional');

INSERT INTO cases (title, format_id, client, description, image_url, featured, created_at)
SELECT 'Retângulo Médio — varejo sazonal', f.id, 'Varejo Online', 'Formato de performance no fluxo editorial, com ROAS 3.8x durante a Black Week.', 'https://images.pexels.com/photos/669615/pexels-photo-669615.jpeg?auto=compress&cs=tinysrgb&w=1200', false, '2026-07-27'
FROM formats f WHERE f.slug = 'retangulo-medio' AND NOT EXISTS (SELECT 1 FROM cases c WHERE c.title = 'Retângulo Médio — varejo sazonal');

INSERT INTO portal_updates (title, description, created_at)
SELECT 'Pause Ads Takeover adicionado', 'Novo formato Pause Ads Takeover incluído no catálogo, com especificações e exemplos criativos.', '2026-07-28'
WHERE NOT EXISTS (SELECT 1 FROM portal_updates p WHERE p.title = 'Pause Ads Takeover adicionado');

INSERT INTO portal_updates (title, description, created_at)
SELECT 'Case Branded Content atualizado', 'Adicionamos métricas finais e criativos do case Eco Brand ao formato Branded Content.', '2026-07-26'
WHERE NOT EXISTS (SELECT 1 FROM portal_updates p WHERE p.title = 'Case Branded Content atualizado');

INSERT INTO portal_updates (title, description, created_at)
SELECT 'Filtros reformulados', 'A biblioteca de formatos agora permite filtrar por plataforma, status, tipo de mídia e cases.', '2026-07-24'
WHERE NOT EXISTS (SELECT 1 FROM portal_updates p WHERE p.title = 'Filtros reformulados');

INSERT INTO portal_updates (title, description, created_at)
SELECT 'Home renovada', 'Nova home com banner principal, atalhos e cards de estatísticas do portal.', '2026-07-22'
WHERE NOT EXISTS (SELECT 1 FROM portal_updates p WHERE p.title = 'Home renovada');

INSERT INTO portal_updates (title, description, created_at)
SELECT 'DCO: novas especificações', 'Atualizamos as diretrizes criativas e dimensões do formato DCO.', '2026-07-20'
WHERE NOT EXISTS (SELECT 1 FROM portal_updates p WHERE p.title = 'DCO: novas especificações');

INSERT INTO team_events (type, person, event_date, description)
SELECT 'vacation', 'Ana Souza', '2026-09-15', 'Férias de 20 dias'
WHERE NOT EXISTS (SELECT 1 FROM team_events t WHERE t.person = 'Ana Souza' AND t.type = 'vacation');

INSERT INTO team_events (type, person, event_date, description)
SELECT 'vacation', 'Rafael Lima', '2026-10-02', 'Férias de 15 dias'
WHERE NOT EXISTS (SELECT 1 FROM team_events t WHERE t.person = 'Rafael Lima' AND t.type = 'vacation');

INSERT INTO team_events (type, person, event_date, description)
SELECT 'birthday', 'Sofia Mendes', '2026-07-28', 'Aniversariante de julho'
WHERE NOT EXISTS (SELECT 1 FROM team_events t WHERE t.person = 'Sofia Mendes' AND t.type = 'birthday');

INSERT INTO team_events (type, person, event_date, description)
SELECT 'birthday', 'Bruno Carvalho', '2026-07-30', 'Aniversariante de julho'
WHERE NOT EXISTS (SELECT 1 FROM team_events t WHERE t.person = 'Bruno Carvalho' AND t.type = 'birthday');

INSERT INTO team_events (type, person, event_date, description)
SELECT 'planner', 'Time de Formatos', '2026-07-28', 'Atualizar Touchpoint e Native Carousel'
WHERE NOT EXISTS (SELECT 1 FROM team_events t WHERE t.type = 'planner' AND t.person = 'Time de Formatos');

INSERT INTO team_events (type, person, event_date, description)
SELECT 'planner', 'Time de Formatos', '2026-07-31', 'Revisar cases do trimestre'
WHERE NOT EXISTS (SELECT 1 FROM team_events t WHERE t.type = 'planner' AND t.person = 'Time de Formatos' AND t.event_date = '2026-07-31');
