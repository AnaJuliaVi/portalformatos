import { useEffect, useState } from 'react';
import { Cake, Plane, CalendarClock, Users, Gift, Calendar } from 'lucide-react';
import { fetchTeamEvents, fetchAllPortalUsers, formatDate, formatBirthday, formatJoinDate, isBirthdayToday, getBirthdayMonth, userDisplayName } from '@/lib/data';
import type { TeamEvent, PortalUser } from '@/lib/supabase';
import { SkeletonBox } from '@/components/ui/Skeleton';
import Avatar from '@/components/ui/Avatar';

export default function TeamPage() {
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [team, setTeam] = useState<PortalUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [eventData, teamData] = await Promise.all([
          fetchTeamEvents(),
          fetchAllPortalUsers(),
        ]);
        if (active) {
          setEvents(eventData);
          setTeam(teamData.filter((u) => u.status === 'active'));
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

  const vacations = events.filter((e) => e.type === 'vacation');
  const planners = events.filter((e) => e.type === 'planner');
  const currentMonth = new Date().getMonth();

  const monthBirthdays = team
    .filter((u) => getBirthdayMonth(u.birthday) === currentMonth)
    .sort((a, b) => {
      const dayA = new Date(a.birthday! + 'T00:00:00').getDate();
      const dayB = new Date(b.birthday! + 'T00:00:00').getDate();
      return dayA - dayB;
    });

  const todayBirthdays = team.filter((u) => isBirthdayToday(u.birthday));

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Equipe</h1>
        <p className="mt-1 text-sm text-ink-500">Cadastro vivo do time de Formatos</p>
      </div>

      {/* Today's birthdays highlight */}
      {todayBirthdays.length > 0 && (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-accent-500 to-accent-600 p-6 shadow-float animate-fade-in">
          <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/20 backdrop-blur">
              <Gift className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white">Aniversariando hoje!</h2>
              <p className="mt-0.5 text-sm text-white/80">
                {todayBirthdays.map((u) => userDisplayName(u)).join(' e ')} faz aniversário hoje. Vamos desejar parabéns!
              </p>
            </div>
            <div className="hidden flex-col gap-2 sm:flex">
              {todayBirthdays.map((u) => (
                <div key={u.id} className="flex items-center gap-2 rounded-full bg-white/15 py-1 pl-1 pr-3 backdrop-blur">
                  <Avatar user={u} size="sm" ring />
                  <span className="text-xs font-semibold text-white">{userDisplayName(u)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Birthdays — dynamic from portal_users */}
        <section className="card-surface p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-accent-50 text-accent-600">
              <Cake className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink-900">Aniversariantes</h2>
              <p className="text-xs text-ink-400">
                {new Date().toLocaleDateString('pt-BR', { month: 'long' })}
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {loading ? (
              <SkeletonBox className="h-20 w-full" />
            ) : monthBirthdays.length === 0 ? (
              <EmptyNote text="Nenhum aniversariante neste mês." />
            ) : (
              monthBirthdays.map((u) => {
                const isToday = isBirthdayToday(u.birthday);
                return (
                  <div
                    key={u.id}
                    className={`flex items-center gap-3 rounded-xl p-4 animate-fade-in transition-all hover:shadow-soft ${
                      isToday ? 'bg-accent-50 ring-1 ring-accent-200' : 'bg-accent-50/50'
                    }`}
                  >
                    <Avatar user={u} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-900">{userDisplayName(u)}</p>
                      {u.job_title && <p className="truncate text-xs text-ink-500">{u.job_title}</p>}
                      <p className="mt-0.5 text-xs text-ink-400">{formatBirthday(u.birthday)}</p>
                    </div>
                    {isToday && (
                      <span className="shrink-0 rounded-full bg-accent-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        HOJE
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Vacations — from team_events */}
        <section className="card-surface p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink-900">Próximas férias</h2>
              <p className="text-xs text-ink-400">Quem estará ausente</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {loading ? (
              <SkeletonBox className="h-20 w-full" />
            ) : vacations.length === 0 ? (
              <EmptyNote text="Nenhuma férias programada." />
            ) : (
              vacations.map((v) => (
                <div key={v.id} className="flex items-center gap-3 rounded-xl bg-brand-50/50 p-4 animate-fade-in">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white">
                    {initials(v.person)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{v.person}</p>
                    <p className="text-xs text-ink-500">
                      {v.event_date ? formatDate(v.event_date) : ''} {v.description ? `· ${v.description}` : ''}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Planner / comms */}
        <section className="card-surface p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-success-50 text-success-600">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink-900">Planner & comunicados</h2>
              <p className="text-xs text-ink-400">Atividades e avisos do time</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {loading ? (
              <SkeletonBox className="h-20 w-full" />
            ) : planners.length === 0 ? (
              <EmptyNote text="Nenhuma atividade registrada." />
            ) : (
              planners.map((p) => (
                <div key={p.id} className="rounded-xl bg-success-50/50 p-4 animate-fade-in">
                  <p className="text-sm font-semibold text-ink-900">{p.person}</p>
                  <p className="mt-0.5 text-xs text-ink-500">{p.description}</p>
                  {p.event_date && <p className="mt-1 text-[10px] text-ink-400">{formatDate(p.event_date)}</p>}
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Team profiles grid */}
      <section className="card-surface p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-ink-100 text-ink-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink-900">Integrantes do time</h2>
            <p className="text-xs text-ink-400">
              {loading ? 'Carregando...' : `${team.length} integrante(s) ativo(s)`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonBox key={i} className="h-40 w-full" />)}
          </div>
        ) : team.length === 0 ? (
          <EmptyNote text="Nenhum integrante cadastrado." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((u, i) => (
              <div
                key={u.id}
                className="flex flex-col items-center rounded-2xl border border-ink-100 p-5 text-center transition-all hover:-translate-y-1 hover:shadow-float animate-fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <Avatar user={u} size="xl" />
                <p className="mt-3 text-sm font-bold text-ink-900">{userDisplayName(u)}</p>
                {u.job_title && <p className="mt-0.5 text-xs text-ink-500">{u.job_title}</p>}
                {u.area && (
                  <span className="mt-2 rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-semibold text-brand-700 ring-1 ring-brand-100">
                    {u.area}
                  </span>
                )}
                <div className="mt-4 flex w-full flex-col gap-2 border-t border-ink-50 pt-3 text-xs text-ink-400">
                  {u.email && (
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="truncate">{u.email}</span>
                    </div>
                  )}
                  {u.join_date && (
                    <div className="flex items-center justify-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      <span>Entrou em {formatJoinDate(u.join_date)}</span>
                    </div>
                  )}
                  {u.birthday && (
                    <div className="flex items-center justify-center gap-1.5">
                      <Cake className="w-3 h-3" />
                      <span>{formatBirthday(u.birthday)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return <p className="rounded-xl bg-ink-50 p-4 text-center text-sm text-ink-400">{text}</p>;
}

function initials(name: string): string {
  const n = name.includes('@') ? name.split('@')[0] : name;
  return n.split(/[.\s]/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');
}
