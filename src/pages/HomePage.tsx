import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Star,
  Bell,
  LayoutGrid,
  TrendingUp,
  Activity,
  Award,
  Clock,
  PlayCircle,
} from 'lucide-react';
import {
  fetchFormats,
  fetchFeaturedCases,
  fetchPortalUpdates,
  fetchStats,
  formatDate,
  relativeDate,
} from '@/lib/data';
import type { Format, AdCase, PortalUpdate, FormatStats } from '@/lib/supabase';
import FormatCard from '@/components/ui/FormatCard';
import Badge from '@/components/ui/Badge';
import { SkeletonCard, SkeletonBox, SkeletonLine } from '@/components/ui/Skeleton';

export default function HomePage() {
  const [formats, setFormats] = useState<Format[]>([]);
  const [cases, setCases] = useState<AdCase[]>([]);
  const [updates, setUpdates] = useState<PortalUpdate[]>([]);
  const [stats, setStats] = useState<FormatStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [f, c, u, s] = await Promise.all([
          fetchFormats(),
          fetchFeaturedCases(3),
          fetchPortalUpdates(4),
          fetchStats(),
        ]);
        if (active) {
          setFormats(f);
          setCases(c);
          setUpdates(u);
          setStats(s);
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
  }, []);

  const recent = formats.slice(0, 8);
  const shortcuts = formats.slice(0, 6);

  return (
    <div className="space-y-10 px-6 py-8 max-w-7xl mx-auto">
      {/* Hero banner */}
      <section className="relative overflow-hidden rounded-3xl gradient-brand text-white shadow-float animate-fade-in">
        <div className="pointer-events-none absolute inset-0 gradient-mesh opacity-40" />
        <div className="pointer-events-none absolute -top-16 -right-10 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-float" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-accent-400/20 blur-3xl animate-float" style={{ animationDelay: '1.2s' }} />

        <div className="relative px-8 py-12 sm:px-12 sm:py-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur ring-1 ring-white/20">
            <Sparkles className="w-3.5 h-3.5" />
            Portal de Formatos Publicitários
          </span>
          <h1 className="mt-5 max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl text-balance">
            O centro de gestão do time de Formatos, em um só lugar.
          </h1>
          <p className="mt-4 max-w-xl text-white/80 leading-relaxed text-balance">
            Catálogo de formatos, cases, arquivos, planner, equipe e ferramentas de
            colaboração reunidos para o dia a dia do time.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/formatos"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 shadow-soft transition-all hover:shadow-float hover:-translate-y-0.5"
            >
              <LayoutGrid className="w-4 h-4" />
              Explorar formatos
            </Link>
            <Link
              to="/cases"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur transition-all hover:bg-white/20"
            >
              <Star className="w-4 h-4" />
              Ver cases
            </Link>
          </div>
        </div>
      </section>

      {/* Stats cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonBox key={i} className="h-28 w-full" />)
        ) : (
          <>
            <StatCard icon={<LayoutGrid className="w-5 h-5" />} label="Total de formatos" value={stats?.total ?? 0} tone="bg-brand-50 text-brand-600" />
            <StatCard icon={<Activity className="w-5 h-5" />} label="Formatos ativos" value={stats?.active ?? 0} tone="bg-success-50 text-success-600" />
            <StatCard icon={<Award className="w-5 h-5" />} label="Cases no mês" value={stats?.casesThisMonth ?? 0} tone="bg-accent-50 text-accent-600" />
            <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Atualizações recentes" value={updates.length} tone="bg-ink-100 text-ink-600" />
          </>
        )}
      </section>

      {/* Shortcuts */}
      <section>
        <SectionHeader title="Atalhos rápidos" subtitle="Formatos mais acessados pelo time" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonBox key={i} className="h-20 w-full" />)
          ) : (
            shortcuts.map((f, i) => (
              <Link
                key={f.id}
                to={`/formatos/${f.slug}`}
                className="group flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-soft transition-all hover:-translate-y-1 hover:shadow-float animate-fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="truncate text-sm font-medium text-ink-800">{f.name}</span>
                <ArrowUpRight className="ml-auto w-4 h-4 text-ink-300 transition-colors group-hover:text-brand-600" />
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Recent formats */}
      <section>
        <SectionHeader
          title="Formatos recentes"
          subtitle="Adicionados ou atualizados nos últimos dias"
          link={{ to: '/formatos', label: 'Ver todos' }}
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? <SkeletonGrid4 /> : recent.slice(0, 4).map((f, i) => <FormatCard key={f.id} format={f} index={i} />)}
        </div>
      </section>

      {/* Featured cases + updates */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionHeader
            title="Cases em destaque"
            subtitle="Resultados que inspiram novas campanhas"
            link={{ to: '/cases', label: 'Ver todos' }}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)
            ) : (
              cases.slice(0, 2).map((c, i) => <CaseCard key={c.id} item={c} index={i} />)
            )}
          </div>
        </div>
        <div>
          <SectionHeader title="Últimas atualizações" subtitle="Novidades do portal" />
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card-surface p-4">
                  <SkeletonLine className="h-4 w-3/4" />
                  <SkeletonLine className="mt-2 h-3 w-full" />
                </div>
              ))
            ) : (
              updates.map((u, i) => (
                <div key={u.id} className="card-surface hover-lift p-4 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink-900">{u.title}</p>
                      {u.description && <p className="mt-0.5 text-xs text-ink-500 line-clamp-2">{u.description}</p>}
                      <p className="mt-1 text-[10px] text-ink-400">{relativeDate(u.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ title, subtitle, link }: { title: string; subtitle?: string; link?: { to: string; label: string } }) {
  return (
    <div className="mb-5 flex items-end justify-between">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {link && (
        <Link to={link.to} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700">
          {link.label}
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: string }) {
  return (
    <div className="card-surface hover-lift p-5 animate-fade-in">
      <div className={`mb-3 grid h-10 w-10 place-items-center rounded-xl ${tone}`}>{icon}</div>
      <p className="text-2xl font-bold text-ink-900">{value}</p>
      <p className="mt-0.5 text-sm text-ink-500">{label}</p>
    </div>
  );
}

function CaseCard({ item, index = 0 }: { item: AdCase; index?: number }) {
  return (
    <Link
      to={`/cases/${item.id}`}
      className="card-surface hover-lift group overflow-hidden animate-slide-up block"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="relative h-44 overflow-hidden">
        {item.image_url ? (
          <img src={item.image_url} alt={item.format?.name ?? 'Case'} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="h-full w-full gradient-mesh" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-ink-900/20 to-transparent" />
        <div className="absolute top-3 left-3">
          <Badge variant="case"><Star className="w-3 h-3" /> Destaque</Badge>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-white text-sm font-semibold drop-shadow line-clamp-1">{item.format?.name ?? 'Case'}</p>
          {item.client && <p className="text-white/70 text-xs">{item.client}</p>}
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm text-ink-500 line-clamp-2 leading-relaxed">{item.description}</p>
        {item.format && (
          <div className="mt-3 flex items-center gap-2">
            <PlayCircle className="w-3.5 h-3.5 text-brand-500" />
            <span className="text-xs font-semibold text-brand-600">
              {item.format.name}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

function SkeletonGrid4() {
  return Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />);
}
