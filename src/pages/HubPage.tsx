import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Activity, Award, LayoutGrid, Star, ArrowRight, Bell, Eye } from 'lucide-react';
import { fetchFormats, fetchAllCases, fetchPortalUpdates, fetchStats, relativeDate } from '@/lib/data';
import type { Format, AdCase, PortalUpdate, FormatStats } from '@/lib/supabase';
import Badge from '@/components/ui/Badge';
import { SkeletonBox, SkeletonLine } from '@/components/ui/Skeleton';

export default function HubPage() {
  const [formats, setFormats] = useState<Format[]>([]);
  const [cases, setCases] = useState<AdCase[]>([]);
  const [updates, setUpdates] = useState<PortalUpdate[]>([]);
  const [stats, setStats] = useState<FormatStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [f, c, u, s] = await Promise.all([fetchFormats(), fetchAllCases(), fetchPortalUpdates(5), fetchStats()]);
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

  const byPlatform = formats.reduce<Record<string, number>>((acc, f) => {
    acc[f.platform] = (acc[f.platform] ?? 0) + 1;
    return acc;
  }, {});
  const byMedia = formats.reduce<Record<string, number>>((acc, f) => {
    const key = f.media_type ?? 'Outros';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const casesByStatus = cases.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Hub de Formatos Publicitários</h1>
        <p className="mt-1 text-sm text-ink-500">Dashboard com estatísticas e informações do portal</p>
      </div>

      {/* Big stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonBox key={i} className="h-28 w-full" />)
        ) : (
          <>
            <StatCard icon={<LayoutGrid className="w-5 h-5" />} label="Total de formatos" value={stats?.total ?? 0} tone="bg-brand-50 text-brand-600" />
            <StatCard icon={<Activity className="w-5 h-5" />} label="Formatos ativos" value={stats?.active ?? 0} tone="bg-success-50 text-success-600" />
            <StatCard icon={<Award className="w-5 h-5" />} label="Cases no mês" value={stats?.casesThisMonth ?? 0} tone="bg-accent-50 text-accent-600" />
            <StatCard icon={<Star className="w-5 h-5" />} label="Total de cases" value={cases.length} tone="bg-ink-100 text-ink-600" />
          </>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* By platform */}
        <section className="card-surface p-6">
          <h2 className="text-lg font-bold text-ink-900">Formatos por plataforma</h2>
          <div className="mt-5 space-y-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonLine key={i} className="h-6 w-full" />)
            ) : (
              Object.entries(byPlatform).map(([platform, count]) => {
                const pct = formats.length > 0 ? (count / formats.length) * 100 : 0;
                return (
                  <div key={platform}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-ink-700">{platform}</span>
                      <span className="font-semibold text-ink-900">{count}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* By media type */}
        <section className="card-surface p-6">
          <h2 className="text-lg font-bold text-ink-900">Formatos por tipo de mídia</h2>
          <div className="mt-5 space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonLine key={i} className="h-6 w-full" />)
            ) : (
              Object.entries(byMedia).map(([media, count]) => {
                const pct = formats.length > 0 ? (count / formats.length) * 100 : 0;
                return (
                  <div key={media}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-ink-700">{media}</span>
                      <span className="font-semibold text-ink-900">{count}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-600 transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Cases by status + updates */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card-surface p-6">
          <h2 className="text-lg font-bold text-ink-900">Cases por status</h2>
          <div className="mt-5 flex flex-wrap gap-4">
            {loading ? (
              <SkeletonBox className="h-20 w-full" />
            ) : (
              Object.entries(casesByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center gap-3 rounded-xl border border-ink-100 p-4">
                  <Badge variant="status" value={status}>{status}</Badge>
                  <span className="text-2xl font-bold text-ink-900">{count}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="card-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink-900">Atualizações recentes</h2>
            <Link to="/atualizacoes" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
              Ver todas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonLine key={i} className="h-12 w-full" />)
            ) : (
              updates.map((u) => (
                <div key={u.id} className="flex items-start gap-3 rounded-xl bg-ink-50 p-3">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-800">{u.title}</p>
                    <p className="text-[10px] text-ink-400">{relativeDate(u.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Most viewed shortcut */}
      <section className="card-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-900">Formatos em destaque</h2>
          <Link to="/formatos" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
            Ver catálogo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonBox key={i} className="h-24 w-full" />)
          ) : (
            formats.slice(0, 4).map((f, i) => (
              <Link
                key={f.id}
                to={`/formatos/${f.slug}`}
                className="group flex items-center gap-3 rounded-2xl border border-ink-100 p-4 transition-all hover:-translate-y-1 hover:shadow-float animate-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600">
                  <Eye className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-900">{f.name}</p>
                  <p className="text-xs text-ink-400">{f.platform}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
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
