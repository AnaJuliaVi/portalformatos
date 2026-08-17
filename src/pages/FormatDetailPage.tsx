import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Star, Clock, Monitor, Tv, LayoutGrid, Sparkles, PlayCircle, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { fetchFormatBySlug, fetchCasesForFormat, formatDate, relativeDate } from '@/lib/data';
import type { Format, AdCase } from '@/lib/supabase';
import Badge from '@/components/ui/Badge';
import { SkeletonBox, SkeletonLine } from '@/components/ui/Skeleton';

function platformGlyph(platform: string) {
  if (platform === 'Streaming') return <Monitor className="w-4 h-4" />;
  if (platform.startsWith('TV')) return <Tv className="w-4 h-4" />;
  return <LayoutGrid className="w-4 h-4" />;
}

function mediaGlyph(media: string | null) {
  if (!media) return <LayoutGrid className="w-4 h-4" />;
  const m = media.toLowerCase();
  if (m.includes('vídeo') || m.includes('video')) return <PlayCircle className="w-4 h-4" />;
  if (m.includes('native')) return <Sparkles className="w-4 h-4" />;
  if (m.includes('display')) return <LayoutGrid className="w-4 h-4" />;
  return <ImageIcon className="w-4 h-4" />;
}

export default function FormatDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [format, setFormat] = useState<Format | null>(null);
  const [cases, setCases] = useState<AdCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    (async () => {
      if (!slug) return;
      try {
        const f = await fetchFormatBySlug(slug);
        if (!active) return;
        if (!f) {
          setNotFound(true);
          return;
        }
        setFormat(f);
        const c = await fetchCasesForFormat(f.id);
        if (active) setCases(c);
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) return <DetailSkeleton />;
  if (notFound || !format)
    return (
      <div className="px-6 py-20 text-center">
        <p className="text-lg font-semibold text-ink-800">Formato não encontrado</p>
        <Link to="/formatos" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
          <ArrowLeft className="w-4 h-4" /> Voltar ao catálogo
        </Link>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8 animate-fade-in">
      <Link to="/formatos" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-500 transition-colors hover:text-ink-900">
        <ArrowLeft className="w-4 h-4" /> Catálogo de formatos
      </Link>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl shadow-float">
        <div className="relative h-64 sm:h-80">
          {format.thumbnail_url ? (
            <img src={format.thumbnail_url} alt={format.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full gradient-brand" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-900/40 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="status" value={format.status}>{format.status}</Badge>
            <Badge variant="platform" value={format.platform}>{platformGlyph(format.platform)}{format.platform}</Badge>
            {format.media_type && <Badge variant="media">{mediaGlyph(format.media_type)}{format.media_type}</Badge>}
            {format.has_case && <Badge variant="case"><Star className="w-3 h-3" /> Case</Badge>}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{format.name}</h1>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Description */}
        <div className="lg:col-span-2 space-y-6">
          <section className="card-surface p-6">
            <h2 className="text-lg font-bold text-ink-900">Descrição</h2>
            <p className="mt-3 whitespace-pre-line text-ink-600 leading-relaxed">{format.description}</p>
          </section>

          <section className="card-surface p-6">
            <h2 className="text-lg font-bold text-ink-900">Cases relacionados</h2>
            {cases.length === 0 ? (
              <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 py-10 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-ink-50 text-ink-300">
                  <Star className="w-6 h-6" />
                </div>
                <p className="mt-3 text-sm font-semibold text-ink-600">Sem cases cadastrados</p>
                <p className="mt-1 text-xs text-ink-400">Os cases deste formato aparecerão aqui.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {cases.map((c) => (
                  <div key={c.id} className="flex flex-col gap-4 rounded-2xl border border-ink-100 p-4 transition-colors hover:bg-ink-50/50 sm:flex-row">
                    <div className="h-32 w-full overflow-hidden rounded-xl sm:w-40">
                      {c.image_url ? (
                        <img src={c.image_url} alt={c.title} loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full gradient-mesh" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-ink-900">{c.title}</p>
                      {c.client && <p className="text-xs text-brand-600">{c.client}</p>}
                      <p className="mt-2 text-sm text-ink-500 leading-relaxed">{c.description}</p>
                      <p className="mt-2 text-[10px] text-ink-400">{formatDate(c.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="card-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Resumo</p>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">Plataforma</dt>
                <dd className="font-semibold text-ink-900">{format.platform}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">Tipo de mídia</dt>
                <dd className="font-semibold text-ink-900">{format.media_type ?? '—'}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">Status</dt>
                <dd><Badge variant="status" value={format.status}>{format.status}</Badge></dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">Possui case</dt>
                <dd className="font-semibold text-ink-900">{format.has_case ? 'Sim' : 'Não'}</dd>
              </div>
            </dl>
          </div>

          <div className="card-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Atualização</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-900">{relativeDate(format.updated_at)}</p>
                <p className="text-xs text-ink-400">{formatDate(format.updated_at)}</p>
              </div>
            </div>
          </div>

          <div className="card-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Especificação técnica</p>
            <p className="mt-3 text-sm text-ink-500 leading-relaxed">
              As diretrizes criativas e especificações detalhadas deste formato estão em
              preparação e serão disponibilizadas em breve.
            </p>
            <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-ink-200 py-2.5 text-sm font-semibold text-ink-600 transition-colors hover:bg-ink-50">
              <ExternalLink className="w-4 h-4" />
              Ver especificações
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <SkeletonBox className="h-4 w-40" />
      <SkeletonBox className="h-80 w-full rounded-3xl" />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <SkeletonBox className="h-48 w-full" />
          <SkeletonBox className="h-64 w-full" />
        </div>
        <div className="space-y-4">
          <SkeletonBox className="h-40 w-full" />
          <SkeletonBox className="h-28 w-full" />
        </div>
      </div>
    </div>
  );
}
