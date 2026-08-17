import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Star, Calendar, Monitor, Tv, LayoutGrid, PlayCircle, ExternalLink, Link2, Clock, Pencil } from 'lucide-react';
import { fetchCaseById, fetchRelatedCases, formatDate, relativeDate } from '@/lib/data';
import type { AdCase } from '@/lib/supabase';
import Badge from '@/components/ui/Badge';
import Lightbox from '@/components/ui/Lightbox';
import { SkeletonBox, SkeletonLine } from '@/components/ui/Skeleton';

function platformGlyph(p: string | null) {
  if (!p) return <LayoutGrid className="w-4 h-4" />;
  if (p === 'Streaming') return <Monitor className="w-4 h-4" />;
  if (p.startsWith('TV')) return <Tv className="w-4 h-4" />;
  return <LayoutGrid className="w-4 h-4" />;
}

function ytId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
  return m ? m[1] : null;
}

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [caseData, setCaseData] = useState<AdCase | null>(null);
  const [related, setRelated] = useState<AdCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ open: boolean; index: number }>({ open: false, index: 0 });

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      if (!id) return;
      try {
        const c = await fetchCaseById(id);
        if (!active) return;
        setCaseData(c);
        if (c?.format_id) {
          const r = await fetchRelatedCases(c.format_id, c.id, 3);
          if (active) setRelated(r);
        }
      } catch {
        /* keep empty */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <DetailSkeleton />;
  if (!caseData)
    return (
      <div className="px-6 py-20 text-center">
        <p className="text-lg font-semibold text-ink-800">Case não encontrado</p>
        <Link to="/cases" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
          <ArrowLeft className="w-4 h-4" /> Voltar aos cases
        </Link>
      </div>
    );

  const gallery = [caseData.image_url, ...caseData.gallery_images].filter(Boolean) as string[];

  return (
    <div className="animate-fade-in">
      {/* Hero banner */}
      <div className="relative h-[42vh] min-h-[320px] w-full overflow-hidden">
        {caseData.image_url ? (
          <img src={caseData.image_url} alt={caseData.format?.name ?? 'Case'} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full gradient-brand" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/95 via-ink-900/50 to-ink-900/10" />
        <Link
          to="/cases"
          className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
        >
          <ArrowLeft className="w-4 h-4" /> Cases
        </Link>
        <div className="absolute inset-x-0 bottom-0 px-6 pb-8 sm:px-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="status" value={caseData.status}>{caseData.status}</Badge>
            {caseData.platform && <Badge variant="platform" value={caseData.platform}>{platformGlyph(caseData.platform)}{caseData.platform}</Badge>}
            {caseData.featured && <Badge variant="case"><Star className="w-3 h-3" /> Destaque</Badge>}
          </div>
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-4xl text-balance">{caseData.format?.name ?? 'Case'}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/70">
            {caseData.client && <span>{caseData.client}</span>}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10 space-y-10">
        {/* Description + sidebar */}
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-lg font-bold text-ink-900">Sobre o case</h2>
              <p className="mt-3 text-ink-600 leading-relaxed">{caseData.description ?? 'Sem descrição cadastrada.'}</p>
            </section>

            {/* Gallery */}
            {gallery.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-ink-900">Galeria de imagens</h2>
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {gallery.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setLightbox({ open: true, index: i })}
                      className="group relative aspect-video overflow-hidden rounded-xl border border-ink-100 shadow-soft transition-all hover:shadow-float hover:-translate-y-1"
                    >
                      <img src={url} alt={`Imagem ${i + 1}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 grid place-items-center bg-ink-950/0 transition-colors group-hover:bg-ink-950/30" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Videos */}
            {caseData.videos.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-ink-900">Vídeos</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {caseData.videos.map((v, i) => {
                    const yId = ytId(v);
                    return (
                      <div key={i} className="overflow-hidden rounded-2xl border border-ink-100 shadow-soft">
                        {yId ? (
                          <div className="aspect-video">
                            <iframe
                              src={`https://www.youtube.com/embed/${yId}`}
                              title={`Vídeo ${i + 1}`}
                              className="h-full w-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        ) : (
                          <a href={v} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 text-sm font-medium text-brand-600 transition-colors hover:bg-ink-50">
                            <PlayCircle className="w-5 h-5" /> Abrir vídeo
                            <ExternalLink className="ml-auto w-3.5 h-3.5 text-ink-400" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Links */}
            {caseData.links.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-ink-900">Materiais complementares</h2>
                <div className="mt-4 space-y-2">
                  {caseData.links.map((l, i) => (
                    <a
                      key={i}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 rounded-xl border border-ink-100 bg-white p-4 shadow-soft transition-all hover:shadow-float hover:-translate-y-0.5"
                    >
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                        <Link2 className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-semibold text-ink-800">{l.label}</span>
                      <ExternalLink className="ml-auto w-4 h-4 text-ink-300 transition-colors group-hover:text-brand-600" />
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            <div className="card-surface p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Resumo</p>
              <dl className="mt-3 space-y-3 text-sm">
                {caseData.format && (
                  <div className="flex items-center justify-between">
                    <dt className="text-ink-500">Formato</dt>
                    <dd className="font-semibold text-ink-900">{caseData.format.name}</dd>
                  </div>
                )}
                {caseData.client && (
                  <div className="flex items-center justify-between">
                    <dt className="text-ink-500">Cliente</dt>
                    <dd className="font-semibold text-ink-900">{caseData.client}</dd>
                  </div>
                )}
                {caseData.platform && (
                  <div className="flex items-center justify-between">
                    <dt className="text-ink-500">Plataforma</dt>
                    <dd className="font-semibold text-ink-900">{caseData.platform}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <dt className="text-ink-500">Status</dt>
                  <dd><Badge variant="status" value={caseData.status}>{caseData.status}</Badge></dd>
                </div>
              </dl>
            </div>

            <div className="card-surface p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Datas</p>
              <div className="mt-3 space-y-3 text-sm">
                {caseData.publication_date && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-brand-500" />
                    <span className="text-ink-500">Publicado em</span>
                    <span className="ml-auto font-semibold text-ink-900">{formatDate(caseData.publication_date)}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-success-500" />
                  <span className="text-ink-500">Atualizado</span>
                  <span className="ml-auto font-semibold text-ink-900">{relativeDate(caseData.updated_at)}</span>
                </div>
              </div>
            </div>

            <Link
              to="/cases"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink-200 py-2.5 text-sm font-semibold text-ink-600 transition-colors hover:bg-ink-50"
            >
              <Pencil className="w-4 h-4" /> Gerenciar no portal
            </Link>
          </aside>
        </div>

        {/* Related cases */}
        {related.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-ink-900">Cases relacionados</h2>
            <p className="mt-0.5 text-sm text-ink-500">Outros cases do mesmo formato</p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r, i) => (
                <Link
                  key={r.id}
                  to={`/cases/${r.id}`}
                  className="card-surface hover-lift group overflow-hidden animate-fade-in"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="relative h-32 overflow-hidden">
                    {r.image_url ? (
                      <img src={r.image_url} alt={r.format?.name ?? 'Case'} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="h-full w-full gradient-mesh" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 to-transparent" />
                    <p className="absolute bottom-2 left-3 right-3 text-white text-sm font-semibold line-clamp-1">{r.format?.name ?? 'Case'}</p>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-ink-500 line-clamp-1">{r.client ?? 'Sem cliente'}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {lightbox.open && gallery.length > 0 && (
        <Lightbox images={gallery} startIndex={lightbox.index} onClose={() => setLightbox({ open: false, index: 0 })} />
      )}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div>
      <SkeletonBox className="h-[42vh] min-h-[320px] w-full" />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <SkeletonBox className="h-32 w-full" />
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <SkeletonBox className="h-48 w-full" />
            <SkeletonBox className="h-48 w-full" />
          </div>
          <div className="space-y-4">
            <SkeletonBox className="h-40 w-full" />
            <SkeletonBox className="h-28 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
