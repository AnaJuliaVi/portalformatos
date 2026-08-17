import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, Sparkles, ArrowRight, Clock } from 'lucide-react';
import { fetchFormats, relativeDate } from '@/lib/data';
import type { Format } from '@/lib/supabase';
import FormatCard from '@/components/ui/FormatCard';
import Badge from '@/components/ui/Badge';
import { SkeletonGrid } from '@/components/ui/Skeleton';

export default function NewFormatsPage() {
  const [formats, setFormats] = useState<Format[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchFormats();
        if (active) setFormats(data);
      } catch {
        /* keep empty */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const recent = formats.slice(0, 8);

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 p-8 text-white shadow-float animate-fade-in">
        <div className="pointer-events-none absolute -top-12 -right-8 h-56 w-56 rounded-full bg-white/10 blur-3xl animate-float" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur ring-1 ring-white/20">
            <Lightbulb className="w-3.5 h-3.5" /> Novidades do portal
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Novos formatos</h1>
          <p className="mt-2 max-w-lg text-white/80">
            Os formatos adicionados recentemente ao portal, com as últimas atualizações e especificações.
          </p>
        </div>
      </div>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-ink-900">Recentemente adicionados</h2>
            <p className="mt-0.5 text-sm text-ink-500">Os formatos mais novos do portal</p>
          </div>
          <Link to="/formatos" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
            Ver catálogo completo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <SkeletonGrid count={8} />
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((f, i) => <FormatCard key={f.id} format={f} index={i} />)}
          </div>
        )}
      </section>

      {/* Highlights list */}
      <section className="card-surface p-6">
        <h2 className="text-lg font-bold text-ink-900">Destaques da semana</h2>
        <div className="mt-4 space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 w-full rounded-xl bg-ink-50 animate-pulse" />)
          ) : (
            recent.slice(0, 5).map((f, i) => (
              <Link
                key={f.id}
                to={`/formatos/${f.slug}`}
                className="group flex items-center gap-4 rounded-xl border border-ink-100 p-4 transition-all hover:-translate-y-0.5 hover:shadow-float animate-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-50 text-accent-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">{f.name}</p>
                  <p className="truncate text-xs text-ink-400">{f.platform} · {f.media_type}</p>
                </div>
                <Badge variant="status" value={f.status}>{f.status}</Badge>
                <span className="hidden items-center gap-1 text-xs text-ink-400 sm:flex">
                  <Clock className="w-3 h-3" /> {relativeDate(f.updated_at)}
                </span>
                <ArrowRight className="w-4 h-4 text-ink-300 transition-colors group-hover:text-brand-600" />
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
