import { useCallback, useEffect, useState } from 'react';
import { ClipboardCheck, Check, X, Clock, CheckCircle2, XCircle, Loader2, Calendar } from 'lucide-react';
import { fetchAllVacations, reviewVacation } from '@/lib/data';
import type { Vacation, ApprovalStatus } from '@/lib/supabase';
import { SkeletonBox } from '@/components/ui/Skeleton';

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function approvalBadge(status: ApprovalStatus) {
  if (status === 'Aprovada')
    return <span className="inline-flex items-center gap-1 rounded-full bg-success-100 px-2.5 py-1 text-xs font-semibold text-success-700 ring-1 ring-success-200"><CheckCircle2 className="w-3 h-3" /> Aprovada</span>;
  if (status === 'Recusada')
    return <span className="inline-flex items-center gap-1 rounded-full bg-error-100 px-2.5 py-1 text-xs font-semibold text-error-700 ring-1 ring-error-200"><XCircle className="w-3 h-3" /> Recusada</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-warning-100 px-2.5 py-1 text-xs font-semibold text-warning-700 ring-1 ring-warning-200"><Clock className="w-3 h-3" /> Pendente</span>;
}

type Tab = 'pending' | 'history';

export default function VacationRequestsPage() {
  const [all, setAll] = useState<Vacation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('pending');
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchAllVacations();
      setAll(data);
    } catch {
      /* keep empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleReview(id: string, status: ApprovalStatus) {
    setReviewing(id);
    setError(null);
    try {
      await reviewVacation(id, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao revisar a solicitação.');
    } finally {
      setReviewing(null);
    }
  }

  const pending = all.filter((v) => v.approval_status === 'Pendente');
  const reviewed = all.filter((v) => v.approval_status !== 'Pendente');
  const list = tab === 'pending' ? pending : reviewed;

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
            <ClipboardCheck className="w-3.5 h-3.5" /> Área do administrador
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink-900">Solicitações de Férias</h1>
          <p className="mt-1 text-sm text-ink-500">Aprove ou recuse as solicitações de férias da equipe.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-error-50 px-4 py-3 text-sm text-error-700">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-ink-100">
        <TabBtn active={tab === 'pending'} onClick={() => setTab('pending')}>
          <Clock className="w-4 h-4" /> Pendentes
          {pending.length > 0 && <span className="ml-1 rounded-full bg-warning-200 px-1.5 py-0.5 text-[10px] font-bold text-warning-800">{pending.length}</span>}
        </TabBtn>
        <TabBtn active={tab === 'history'} onClick={() => setTab('history')}>
          <Calendar className="w-4 h-4" /> Histórico ({reviewed.length})
        </TabBtn>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonBox key={i} className="h-24 w-full" />)}
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-ink-200 bg-white py-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-300">
            {tab === 'pending' ? <Clock className="w-7 h-7" /> : <Calendar className="w-7 h-7" />}
          </div>
          <p className="mt-4 text-sm font-semibold text-ink-700">
            {tab === 'pending' ? 'Nenhuma solicitação pendente' : 'Nenhuma solicitação revisada'}
          </p>
          <p className="mt-1 text-xs text-ink-400">
            {tab === 'pending' ? 'As novas solicitações aparecerão aqui.' : 'O histórico de aprovações e recusas aparecerá aqui.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/50 text-left text-xs font-semibold uppercase tracking-wider text-ink-400">
                  <th className="px-5 py-3">Colaborador</th>
                  <th className="px-5 py-3">Início</th>
                  <th className="px-5 py-3">Término</th>
                  <th className="px-5 py-3 text-center">Dias</th>
                  <th className="px-5 py-3">Solicitada em</th>
                  <th className="px-5 py-3">Status</th>
                  {tab === 'pending' && <th className="px-5 py-3 text-right">Ações</th>}
                </tr>
              </thead>
              <tbody>
                {list.map((v, i) => (
                  <tr
                    key={v.id}
                    className="border-b border-ink-50 transition-colors last:border-0 hover:bg-ink-50/40 animate-fade-in"
                    style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-500 text-xs font-bold text-white">
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
                      <span className="inline-flex items-center gap-1 rounded-lg bg-ink-50 px-2 py-1 text-xs font-semibold text-ink-700">{v.days}d</span>
                    </td>
                    <td className="px-5 py-4 text-xs text-ink-500">{fmtDateTime(v.created_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        {approvalBadge(v.approval_status)}
                        {v.review_note && v.approval_status === 'Recusada' && (
                          <span className="text-[11px] text-error-600 line-clamp-1 max-w-[180px]">Motivo: {v.review_note}</span>
                        )}
                        {v.reviewed_at && (
                          <span className="text-[11px] text-ink-400">{fmtDateTime(v.reviewed_at)}</span>
                        )}
                      </div>
                    </td>
                    {tab === 'pending' && (
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleReview(v.id, 'Aprovada')}
                            disabled={reviewing === v.id}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-success-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-success-700 disabled:opacity-50"
                          >
                            {reviewing === v.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            Aprovar
                          </button>
                          <button
                            onClick={() => handleReview(v.id, 'Recusada')}
                            disabled={reviewing === v.id}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-error-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-error-700 disabled:opacity-50"
                          >
                            {reviewing === v.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                            Recusar
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${active ? 'text-brand-700' : 'text-ink-500 hover:text-ink-800'}`}
    >
      {children}
      {active && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-600" />}
    </button>
  );
}
