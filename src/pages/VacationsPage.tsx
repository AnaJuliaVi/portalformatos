import { useCallback, useEffect, useState } from 'react';
import { Plane, Plus, Pencil, Trash2, Calendar, Sun, AlertCircle, Users, Loader2, Clock, CheckCircle2, XCircle, Inbox } from 'lucide-react';
import {
  fetchVacations,
  fetchMyVacations,
  deleteVacation,
  vacationStatus,
  daysUntilVacation,
} from '@/lib/data';
import type { Vacation, VacationStatus, ApprovalStatus } from '@/lib/supabase';
import { SkeletonBox } from '@/components/ui/Skeleton';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import VacationFormModal from '@/components/VacationFormModal';
import { useAuth } from '@/lib/auth';

function statusBadge(status: VacationStatus) {
  if (status === 'Em andamento') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-success-100 px-2.5 py-1 text-xs font-semibold text-success-700 ring-1 ring-success-200">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success-500" />
        Em andamento
      </span>
    );
  }
  if (status === 'Programadas') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
        <Calendar className="w-3 h-3" />
        Programadas
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-2.5 py-1 text-xs font-semibold text-ink-500 ring-1 ring-ink-200">
      Finalizadas
    </span>
  );
}

function approvalBadge(status: ApprovalStatus) {
  if (status === 'Aprovada')
    return <span className="inline-flex items-center gap-1 rounded-full bg-success-100 px-2 py-0.5 text-[11px] font-semibold text-success-700"><CheckCircle2 className="w-3 h-3" /> Aprovada</span>;
  if (status === 'Recusada')
    return <span className="inline-flex items-center gap-1 rounded-full bg-error-100 px-2 py-0.5 text-[11px] font-semibold text-error-700"><XCircle className="w-3 h-3" /> Recusada</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-warning-100 px-2 py-0.5 text-[11px] font-semibold text-warning-700"><Clock className="w-3 h-3" /> Pendente</span>;
}

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function VacationsPage() {
  const { email } = useAuth();
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [myRequests, setMyRequests] = useState<Vacation[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vacation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vacation | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [approved, all] = await Promise.all([fetchVacations(), fetchMyVacations()]);
      setVacations(approved);
      setMyRequests(all);
    } catch {
      /* keep empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function handleEdit(v: Vacation) {
    setEditing(v);
    setModalOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteVacation(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch {
      /* keep item */
    } finally {
      setDeleting(false);
    }
  }

  const sorted = [...vacations].sort((a, b) => a.start_date.localeCompare(b.start_date));
  const onVacation = sorted.filter((v) => vacationStatus(v) === 'Em andamento');
  const upcoming = sorted.filter((v) => {
    const s = vacationStatus(v);
    return s === 'Programadas' && daysUntilVacation(v) <= 7;
  });

  const defaultName = email ? email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '';
  const myPending = myRequests.filter((r) => r.approval_status === 'Pendente');

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-success-500 p-8 text-white shadow-float animate-fade-in">
        <div className="pointer-events-none absolute -top-10 -right-10 h-52 w-52 rounded-full bg-white/10 blur-3xl animate-float" />
        <div className="pointer-events-none absolute -bottom-16 -left-8 h-60 w-60 rounded-full bg-white/10 blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur ring-1 ring-white/20">
              <Sun className="w-3.5 h-3.5" /> Agenda do time
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">Férias do time</h1>
            <p className="mt-2 max-w-lg text-white/80">
              Solicite e acompanhe as férias da equipe. As solicitações passam por aprovação antes de entrarem no calendário.
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-brand-700 shadow-soft transition-transform hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Adicionar Férias
          </button>
        </div>
      </div>

      {/* Alerts */}
      {(onVacation.length > 0 || upcoming.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {onVacation.length > 0 && (
            <div className="flex items-center gap-3 rounded-2xl border border-success-200 bg-success-50 px-5 py-4 animate-fade-in">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-success-100 text-success-700">
                <Plane className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-success-800">
                  {onVacation.length} {onVacation.length === 1 ? 'pessoa de férias' : 'pessoas de férias agora'}
                </p>
                <p className="text-xs text-success-700">
                  {onVacation.map((v) => v.employee_name).join(', ')}
                </p>
              </div>
            </div>
          )}
          {upcoming.length > 0 && (
            <div className="flex items-center gap-3 rounded-2xl border border-warning-200 bg-warning-50 px-5 py-4 animate-fade-in">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-warning-100 text-warning-700">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-warning-800">Férias próximas</p>
                <p className="text-xs text-warning-700">
                  {upcoming.map((v) => `${v.employee_name} (${daysUntilVacation(v)}d)`).join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* My requests */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Inbox className="w-5 h-5 text-brand-500" />
          <h2 className="text-xl font-bold tracking-tight text-ink-900">Minhas solicitações</h2>
          {myPending.length > 0 && (
            <span className="rounded-full bg-warning-100 px-2 py-0.5 text-[11px] font-bold text-warning-700">
              {myPending.length} pendente{myPending.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading ? (
          <SkeletonBox className="h-24 w-full" />
        ) : myRequests.length === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-ink-200 bg-white px-5 py-6">
            <Clock className="w-5 h-5 text-ink-300" />
            <p className="text-sm text-ink-400">Você ainda não solicitou férias.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {myRequests.map((r, i) => (
              <div
                key={r.id}
                className={`card-surface p-4 animate-fade-in ${r.approval_status === 'Recusada' ? 'opacity-75' : ''}`}
                style={{ animationDelay: `${Math.min(i * 40, 300)}ms` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-ink-900">{fmtDate(r.start_date)} — {fmtDate(r.end_date)}</p>
                    <p className="mt-0.5 text-xs text-ink-400">{r.days} {r.days === 1 ? 'dia' : 'dias'}</p>
                  </div>
                  {approvalBadge(r.approval_status)}
                </div>
                {r.notes && <p className="mt-2 text-xs text-ink-500 line-clamp-2">{r.notes}</p>}
                {r.review_note && r.approval_status === 'Recusada' && (
                  <p className="mt-2 rounded-lg bg-error-50 px-2.5 py-1.5 text-xs text-error-700">Motivo: {r.review_note}</p>
                )}
                {(r.approval_status === 'Pendente') && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleEdit(r)}
                      className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100"
                    >
                      <Pencil className="w-3 h-3" /> Editar
                    </button>
                    <button
                      onClick={() => setDeleteTarget(r)}
                      className="inline-flex items-center gap-1 rounded-lg bg-error-50 px-2.5 py-1.5 text-xs font-semibold text-error-600 transition-colors hover:bg-error-100"
                    >
                      <Trash2 className="w-3 h-3" /> Excluir
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Approved vacations stats + table */}
      <section>
        <div className="mb-5 flex items-center gap-2">
          <Users className="w-5 h-5 text-success-500" />
          <h2 className="text-xl font-bold tracking-tight text-ink-900">Férias aprovadas do time</h2>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total" value={sorted.length} icon={<Calendar className="w-4 h-4" />} tone="brand" />
          <StatCard label="Em andamento" value={onVacation.length} icon={<Plane className="w-4 h-4" />} tone="success" />
          <StatCard label="Programadas" value={sorted.filter((v) => vacationStatus(v) === 'Programadas').length} icon={<Calendar className="w-4 h-4" />} tone="brand" />
          <StatCard label="Finalizadas" value={sorted.filter((v) => vacationStatus(v) === 'Finalizadas').length} icon={<Users className="w-4 h-4" />} tone="ink" />
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonBox key={i} className="h-20 w-full" />)}
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-ink-200 bg-white py-16 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-300">
              <Plane className="w-7 h-7" />
            </div>
            <p className="mt-4 text-sm font-semibold text-ink-700">Nenhuma férias aprovada</p>
            <p className="mt-1 text-xs text-ink-400">Solicite férias para que apareçam aqui após aprovação.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-100 bg-ink-50/50 text-left text-xs font-semibold uppercase tracking-wider text-ink-400">
                    <th className="px-5 py-3">Colaborador</th>
                    <th className="px-5 py-3">Saída</th>
                    <th className="px-5 py-3">Retorno</th>
                    <th className="px-5 py-3 text-center">Dias</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((v, i) => {
                    const status = vacationStatus(v);
                    const daysLeft = daysUntilVacation(v);
                    const isOngoing = status === 'Em andamento';
                    const isNear = status === 'Programadas' && daysLeft <= 7;
                    return (
                      <tr
                        key={v.id}
                        className={`group border-b border-ink-50 transition-colors last:border-0 hover:bg-ink-50/40 animate-fade-in ${isOngoing ? 'bg-success-50/40' : isNear ? 'bg-warning-50/30' : ''}`}
                        style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${isOngoing ? 'bg-success-500' : 'bg-brand-500'}`}>
                              {v.employee_name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-ink-900">{v.employee_name}</p>
                              {v.notes && <p className="text-xs text-ink-400 line-clamp-1 max-w-xs">{v.notes}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-ink-600">{fmtDate(v.start_date)}</td>
                        <td className="px-5 py-4 text-ink-600">{fmtDate(v.end_date)}</td>
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-ink-50 px-2 py-1 text-xs font-semibold text-ink-700">
                            {v.days}d
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1">
                            {statusBadge(status)}
                            {isNear && (
                              <span className="text-[11px] font-medium text-warning-600">
                                Em {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <VacationFormModal
        open={modalOpen}
        vacation={editing}
        defaultName={defaultName}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          load();
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir solicitação"
        message={`Deseja remover a solicitação de férias de "${deleteTarget?.employee_name}"? Esta ação não pode ser desfeita.`}
        confirmLabel={deleting ? 'Excluindo...' : 'Excluir'}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />

      {deleting && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-medium text-white shadow-float">
          <Loader2 className="mr-2 inline-block w-4 h-4 animate-spin" />
          Excluindo...
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: 'brand' | 'success' | 'ink' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    success: 'bg-success-50 text-success-600',
    ink: 'bg-ink-100 text-ink-600',
  };
  return (
    <div className="card-surface flex items-center gap-3 p-4 animate-fade-in">
      <div className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-ink-900">{value}</p>
        <p className="text-xs text-ink-400">{label}</p>
      </div>
    </div>
  );
}
