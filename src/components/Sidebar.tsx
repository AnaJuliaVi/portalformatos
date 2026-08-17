import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FolderOpen,
  Star,
  Eye,
  BookOpen,
  Users,
  Network,
  CalendarCheck,
  Lightbulb,
  Plane,
  Home,
  Plus,
  Plane as PlaneIcon,
  Cake,
  CalendarClock,
  Activity,
  Award,
  Bell,
  ShieldCheck,
  LogOut,
  ClipboardCheck,
} from 'lucide-react';
import { fetchTeamEvents, fetchPortalUpdates, fetchStats, relativeDate } from '@/lib/data';
import type { TeamEvent, PortalUpdate, FormatStats } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { SkeletonBox } from '@/components/ui/Skeleton';
import { LogoMark } from '@/components/Logo';

const navItems = [
  { to: '/', label: 'Início', icon: Home },
  { to: '/formatos', label: 'Catálogo de Formatos', icon: BookOpen },
  { to: '/arquivos', label: 'Arquivos', icon: FolderOpen },
  { to: '/bbb', label: 'BBB', icon: Eye },
  { to: '/cases', label: 'Cases', icon: Star, badge: 'novo' },
  { to: '/equipe', label: 'Equipe', icon: Users },
  { to: '/hub', label: 'Hub de Formatos', icon: Network },
  { to: '/planner', label: 'Planner', icon: CalendarCheck },
  { to: '/novos-formatos', label: 'Novos Formatos', icon: Lightbulb, badge: 'atualizado' },
  { to: '/ferias', label: 'Férias', icon: Plane },
];

const adminNavItems = [
  { to: '/solicitacoes-ferias', label: 'Solicitações de Férias', icon: ClipboardCheck, badge: 'admin' },
];

function monthOf(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr).getMonth() === new Date().getMonth();
}

export default function Sidebar() {
  const location = useLocation();
  const { email, isAdmin, signOut } = useAuth();
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [updates, setUpdates] = useState<PortalUpdate[]>([]);
  const [stats, setStats] = useState<FormatStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [e, u, s] = await Promise.all([fetchTeamEvents(), fetchPortalUpdates(3), fetchStats()]);
        if (active) {
          setEvents(e);
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

  const vacations = events.filter((e) => e.type === 'vacation').slice(0, 2);
  const birthdays = events.filter((e) => e.type === 'birthday' && monthOf(e.event_date)).slice(0, 2);
  const planner = events.filter((e) => e.type === 'planner').slice(0, 1);
  const latest = updates[0];

  const isActive = (to: string) => (to === '/' ? location.pathname === '/' : location.pathname.startsWith(to));

  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col border-r border-ink-100 bg-white/80 backdrop-blur-xl">
      <Link to="/" className="group flex items-center gap-3 px-5 py-5 transition-transform duration-200 hover:scale-[1.02]">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-glow ring-1 ring-brand-100 transition-all duration-200 group-hover:shadow-float group-hover:ring-brand-200">
          <LogoMark size={26} className="transition-transform duration-200 group-hover:scale-105" />
        </div>
        <div>
          <p className="text-sm font-bold text-ink-900">Portal de Formatos</p>
          <p className="text-xs text-ink-400">Globo</p>
        </div>
      </Link>

      <nav className="px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.to} {...item} active={isActive(item.to)} />
        ))}
        {isAdmin && (
          <>
            <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-400">Administração</p>
            {adminNavItems.map((item) => (
              <NavLink key={item.to} {...item} active={isActive(item.to)} />
            ))}
          </>
        )}
      </nav>

      <div className="mt-2 flex-1 space-y-4 overflow-y-auto px-4 pb-4">
        <p className="px-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-ink-400">Painel do time</p>

        {loading ? (
          <div className="space-y-3">
            <SkeletonBox className="h-20 w-full" />
            <SkeletonBox className="h-20 w-full" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <MiniStat icon={<Activity className="w-4 h-4" />} label="Ativos" value={stats?.active ?? 0} tone="text-success-600 bg-success-50" />
              <MiniStat icon={<Award className="w-4 h-4" />} label="Cases / mês" value={stats?.casesThisMonth ?? 0} tone="text-brand-600 bg-brand-50" />
            </div>

            {vacations.length > 0 && (
              <Section title="Próximas férias" icon={<PlaneIcon className="w-3 h-3 text-brand-500" />}>
                {vacations.map((v) => (
                  <EventRow key={v.id} icon={<Plane className="w-3.5 h-3.5 text-brand-600" />} person={v.person} detail={v.event_date ? `${formatShort(v.event_date)} · ${v.description ?? ''}` : v.description ?? ''} tone="bg-brand-50" />
                ))}
              </Section>
            )}

            {birthdays.length > 0 && (
              <Section title="Aniversariantes" icon={<Cake className="w-3 h-3 text-accent-500" />}>
                {birthdays.map((b) => (
                  <EventRow key={b.id} icon={<Cake className="w-3.5 h-3.5 text-accent-600" />} person={b.person} detail={b.event_date ? formatShort(b.event_date) : b.description ?? ''} tone="bg-accent-50" />
                ))}
              </Section>
            )}

            {planner.length > 0 && (
              <Section title="Planner da semana" icon={<CalendarClock className="w-3 h-3 text-success-500" />}>
                {planner.map((p) => (
                  <EventRow key={p.id} icon={<CalendarClock className="w-3.5 h-3.5 text-success-600" />} person={p.person} detail={p.description ?? ''} tone="bg-success-50" />
                ))}
              </Section>
            )}

            {latest && (
              <Section title="Última atualização" icon={<Bell className="w-3 h-3 text-ink-400" />}>
                <div className="rounded-xl bg-ink-50 p-3">
                  <p className="text-sm font-medium text-ink-800">{latest.title}</p>
                  {latest.description && <p className="mt-0.5 text-xs text-ink-500 line-clamp-2">{latest.description}</p>}
                  <p className="mt-1 text-[10px] text-ink-400">{relativeDate(latest.created_at)}</p>
                </div>
              </Section>
            )}
          </>
        )}
      </div>

      <div className="border-t border-ink-100 px-4 py-3 space-y-3">
        {isAdmin && (
          <Link to="/gerenciar-acessos" className="flex w-full items-center gap-2 rounded-xl bg-ink-900 px-3 py-2 text-sm font-semibold text-white transition-all hover:bg-ink-800 hover:shadow-soft">
            <Plus className="w-4 h-4" />
            Gerenciar acessos
          </Link>
        )}
        <div className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white px-3 py-2">
          <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${isAdmin ? 'bg-gradient-to-br from-brand-500 to-brand-700' : 'bg-gradient-to-br from-ink-400 to-ink-600'}`}>
            {initials(email)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-ink-900">{email}</p>
            <p className="text-[10px] text-ink-400">{isAdmin ? 'Administrador' : 'Usuário'}</p>
          </div>
          <button onClick={() => signOut()} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-400 transition-colors hover:bg-error-50 hover:text-error-600" aria-label="Sair">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavLink({ to, label, icon: Icon, active, badge }: { to: string; label: string; icon: typeof Home; active: boolean; badge?: string }) {
  return (
    <Link
      to={to}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        active ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
      }`}
    >
      {active && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-600" />}
      <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${active ? 'text-brand-600' : 'text-ink-400 group-hover:text-brand-600'}`} />
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span className="rounded-full bg-accent-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-accent-700">
          {badge}
        </span>
      )}
    </Link>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-3 shadow-soft">
      <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
        {icon}
        {title}
      </p>
      {children}
    </div>
  );
}

function EventRow({ icon, person, detail, tone }: { icon: React.ReactNode; person: string; detail: string; tone: string }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${tone}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink-800">{person}</p>
        <p className="truncate text-xs text-ink-500">{detail}</p>
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-3 shadow-soft">
      <div className={`mb-1.5 grid h-7 w-7 place-items-center rounded-lg ${tone}`}>{icon}</div>
      <p className="text-lg font-bold text-ink-900">{value}</p>
      <p className="text-[10px] text-ink-400">{label}</p>
    </div>
  );
}

function formatShort(d: string): string {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function initials(email: string | null): string {
  if (!email) return '?';
  const name = email.split('@')[0];
  return name.split('.').slice(0, 2).map((n) => n[0]?.toUpperCase() ?? '').join('');
}
