import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus, Search, LayoutGrid, List, Calendar, CheckCircle2, Clock, AlertCircle, TrendingUp,
  CalendarDays, X,
} from 'lucide-react';
import {
  fetchTasks, createTask, updateTask, deleteTask,
  fetchPortalUsers, checklistProgress, isTaskOverdue, isTaskNearDue, daysUntilDue,
  userDisplayName,
} from '@/lib/data';
import type { PlannerTask, TaskBucket, TaskPriority, PortalUser } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { SkeletonBox } from '@/components/ui/Skeleton';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import TaskFormModal from '@/components/TaskFormModal';
import TaskDetailPanel from '@/components/TaskDetailPanel';

const BUCKETS: TaskBucket[] = ['A Fazer', 'Em Andamento', 'Em Revisão', 'Concluído'];
const PRIORITIES: TaskPriority[] = ['Baixa', 'Média', 'Alta', 'Urgente'];

type ViewMode = 'kanban' | 'list' | 'calendar';

const bucketColors: Record<TaskBucket, string> = {
  'A Fazer': 'border-t-ink-400',
  'Em Andamento': 'border-t-brand-500',
  'Em Revisão': 'border-t-warning-500',
  'Concluído': 'border-t-success-500',
};

const priorityColors: Record<TaskPriority, string> = {
  Baixa: 'bg-ink-100 text-ink-600',
  Média: 'bg-brand-100 text-brand-700',
  Alta: 'bg-warning-100 text-warning-700',
  Urgente: 'bg-error-100 text-error-700',
};

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') ? iso : iso + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase();
}

export default function PlannerPage() {
  const { email } = useAuth();
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('kanban');
  const [search, setSearch] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterBucket, setFilterBucket] = useState('');
  const [filterLabel, setFilterLabel] = useState('');
  const [filterDue, setFilterDue] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PlannerTask | null>(null);
  const [defaultBucket, setDefaultBucket] = useState<TaskBucket | undefined>(undefined);
  const [detailTask, setDetailTask] = useState<PlannerTask | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PlannerTask | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverBucket, setDragOverBucket] = useState<TaskBucket | null>(null);

  const load = useCallback(async () => {
    try {
      const [t, u] = await Promise.all([fetchTasks(), fetchPortalUsers()]);
      setTasks(t);
      setUsers(u);
    } catch {
      /* keep empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const allLabels = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => t.labels.forEach((l) => set.add(l)));
    return Array.from(set);
  }, [tasks]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (search) {
        const q = search.toLowerCase();
        if (!t.title.toLowerCase().includes(q) && !(t.description ?? '').toLowerCase().includes(q)) return false;
      }
      if (filterAssignee && t.assignee !== filterAssignee) return false;
      if (filterPriority && t.priority !== filterPriority) return false;
      if (filterBucket && t.bucket !== filterBucket) return false;
      if (filterLabel && !t.labels.includes(filterLabel)) return false;
      if (filterDue) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (filterDue === 'overdue' && !isTaskOverdue(t)) return false;
        if (filterDue === 'near' && !isTaskNearDue(t)) return false;
        if (filterDue === 'done' && t.bucket !== 'Concluído') return false;
      }
      return true;
    });
  }, [tasks, search, filterAssignee, filterPriority, filterBucket, filterLabel, filterDue]);

  const metrics = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.bucket === 'Concluído').length;
    const ongoing = tasks.filter((t) => t.bucket === 'Em Andamento').length;
    const overdue = tasks.filter((t) => isTaskOverdue(t)).length;
    const near = tasks.filter((t) => isTaskNearDue(t)).length;
    return { total, done, ongoing, overdue, near };
  }, [tasks]);

  function handleAdd(bucket?: TaskBucket) {
    setEditing(null);
    setDefaultBucket(bucket);
    setFormOpen(true);
  }

  function handleEdit(task: PlannerTask) {
    setEditing(task);
    setFormOpen(true);
    setDetailOpen(false);
  }

  function handleOpenDetail(task: PlannerTask) {
    setDetailTask(task);
    setDetailOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTask(deleteTarget.id);
      setTasks((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      /* keep */
    } finally {
      setDeleting(false);
    }
  }

  async function handleDragDrop(bucket: TaskBucket) {
    if (!dragId) return;
    const task = tasks.find((t) => t.id === dragId);
    if (!task || task.bucket === bucket) {
      setDragId(null);
      setDragOverBucket(null);
      return;
    }
    const targetTasks = tasks.filter((t) => t.bucket === bucket);
    const sortOrder = targetTasks.length;
    const updated = { ...task, bucket, sort_order: sortOrder };
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    setDragId(null);
    setDragOverBucket(null);
    try {
      await updateTask(task.id, { bucket, sort_order: sortOrder });
      load();
    } catch {
      load();
    }
  }

  const hasFilters = search || filterAssignee || filterPriority || filterBucket || filterLabel || filterDue;

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-success-600 to-brand-600 p-8 text-white shadow-float animate-fade-in">
        <div className="pointer-events-none absolute -top-10 -right-8 h-52 w-52 rounded-full bg-white/10 blur-3xl animate-float" />
        <div className="pointer-events-none absolute -bottom-16 -left-8 h-60 w-60 rounded-full bg-white/10 blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur ring-1 ring-white/20">
              <TrendingUp className="w-3.5 h-3.5" /> Gestão de tarefas
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">Planner do time</h1>
            <p className="mt-2 max-w-lg text-white/80">
              Organize, atribua e acompanhe as tarefas da equipe em tempo real.
            </p>
          </div>
          <button
            onClick={() => handleAdd()}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-brand-700 shadow-soft transition-transform hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Nova tarefa
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard label="Total" value={metrics.total} icon={<LayoutGrid className="w-4 h-4" />} tone="brand" />
        <MetricCard label="Em andamento" value={metrics.ongoing} icon={<Clock className="w-4 h-4" />} tone="warning" />
        <MetricCard label="Concluídas" value={metrics.done} icon={<CheckCircle2 className="w-4 h-4" />} tone="success" />
        <MetricCard label="Atrasadas" value={metrics.overdue} icon={<AlertCircle className="w-4 h-4" />} tone="error" />
        <MetricCard label="Próximas do prazo" value={metrics.near} icon={<CalendarDays className="w-4 h-4" />} tone="brand" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-soft">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar tarefas..."
              className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-10 pr-4 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="flex items-center gap-1 rounded-xl bg-ink-50 p-1">
            {(['kanban', 'list', 'calendar'] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${view === v ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-500 hover:text-ink-800'}`}
              >
                {v === 'kanban' && <LayoutGrid className="w-4 h-4" />}
                {v === 'list' && <List className="w-4 h-4" />}
                {v === 'calendar' && <Calendar className="w-4 h-4" />}
                <span className="hidden sm:inline">{v === 'kanban' ? 'Kanban' : v === 'list' ? 'Lista' : 'Calendário'}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect value={filterAssignee} onChange={setFilterAssignee} placeholder="Responsável" options={users.map((u) => ({ value: u.email, label: u.name || u.email }))} />
          <FilterSelect value={filterPriority} onChange={setFilterPriority} placeholder="Prioridade" options={PRIORITIES.map((p) => ({ value: p, label: p }))} />
          <FilterSelect value={filterBucket} onChange={setFilterBucket} placeholder="Status" options={BUCKETS.map((b) => ({ value: b, label: b }))} />
          <FilterSelect value={filterLabel} onChange={setFilterLabel} placeholder="Etiqueta" options={allLabels.map((l) => ({ value: l, label: l.split(':')[0] }))} />
          <FilterSelect
            value={filterDue}
            onChange={setFilterDue}
            placeholder="Prazo"
            options={[
              { value: 'overdue', label: 'Atrasadas' },
              { value: 'near', label: 'Próximas (3 dias)' },
              { value: 'done', label: 'Concluídas' },
            ]}
          />
          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setFilterAssignee(''); setFilterPriority(''); setFilterBucket(''); setFilterLabel(''); setFilterDue(''); }}
              className="inline-flex items-center gap-1 rounded-lg bg-error-50 px-2.5 py-2 text-xs font-semibold text-error-600 transition-colors hover:bg-error-100"
            >
              <X className="w-3 h-3" /> Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonBox key={i} className="h-28 w-full" />)}
        </div>
      ) : filtered.length === 0 && !hasFilters ? (
        <EmptyState onAdd={() => handleAdd()} />
      ) : view === 'kanban' ? (
        <KanbanView
          tasks={filtered}
          users={users}
          dragId={dragId}
          dragOverBucket={dragOverBucket}
          onDragStart={setDragId}
          onDragOverBucket={setDragOverBucket}
          onDrop={handleDragDrop}
          onAddBucket={handleAdd}
          onOpenDetail={handleOpenDetail}
        />
      ) : view === 'list' ? (
        <ListView tasks={filtered} users={users} onOpenDetail={handleOpenDetail} />
      ) : (
        <CalendarView tasks={filtered} onOpenDetail={handleOpenDetail} />
      )}

      {/* Modals */}
      <TaskFormModal
        open={formOpen}
        task={editing}
        defaultBucket={defaultBucket}
        users={users}
        onClose={() => setFormOpen(false)}
        onSaved={() => { setFormOpen(false); load(); }}
      />

      <TaskDetailPanel
        open={detailOpen}
        task={detailTask ? tasks.find((t) => t.id === detailTask.id) ?? detailTask : null}
        users={users}
        onClose={() => setDetailOpen(false)}
        onEdit={handleEdit}
        onUpdated={load}
        onDeleted={() => { setDetailOpen(false); load(); }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir tarefa"
        message={`Deseja excluir "${deleteTarget?.title}"? Esta ação não pode ser desfeita.`}
        confirmLabel={deleting ? 'Excluindo...' : 'Excluir'}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />
    </div>
  );
}

/* ---------- Sub-components ---------- */

function MetricCard({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: 'brand' | 'success' | 'warning' | 'error' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    error: 'bg-error-50 text-error-600',
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

function FilterSelect({ value, onChange, placeholder, options }: { value: string; onChange: (v: string) => void; placeholder: string; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-xs font-medium text-ink-600 focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-ink-200 bg-white py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-300">
        <LayoutGrid className="w-7 h-7" />
      </div>
      <p className="mt-4 text-sm font-semibold text-ink-700">Nenhuma tarefa criada</p>
      <p className="mt-1 text-xs text-ink-400">Crie a primeira tarefa para organizar o trabalho da equipe.</p>
      <button onClick={onAdd} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700">
        <Plus className="w-4 h-4" /> Nova tarefa
      </button>
    </div>
  );
}

function TaskCard({ task, users, onDragStart, onClick }: { task: PlannerTask; users: PortalUser[]; onDragStart: () => void; onClick: () => void }) {
  const progress = checklistProgress(task);
  const overdue = isTaskOverdue(task);
  const near = isTaskNearDue(task);
  const assigneeUser = users.find((u) => u.email === task.assignee);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={`group cursor-pointer rounded-xl border border-ink-100 bg-white p-3.5 shadow-soft transition-all hover:shadow-float hover:-translate-y-0.5 ${overdue ? 'ring-1 ring-error-200' : near ? 'ring-1 ring-warning-200' : ''}`}
    >
      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {task.labels.slice(0, 4).map((label) => {
            const color = label.split(':')[1] ?? '#2f86f6';
            return <span key={label} className="h-2 w-6 rounded-full" style={{ backgroundColor: color }} />;
          })}
        </div>
      )}

      <p className="text-sm font-semibold text-ink-900 line-clamp-2">{task.title}</p>

      {task.description && <p className="mt-1 text-xs text-ink-400 line-clamp-2">{task.description}</p>}

      {/* Progress */}
      {task.checklist.length > 0 && (
        <div className="mt-2.5">
          <div className="mb-1 flex items-center justify-between text-[10px] font-medium text-ink-400">
            <span>{task.checklist.filter((c) => c.done).length}/{task.checklist.length}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-ink-100">
            <div className="h-full rounded-full bg-success-500 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>
          {overdue ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-error-600">
              <AlertCircle className="w-3 h-3" /> Atrasada
            </span>
          ) : near ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-warning-600">
              <Clock className="w-3 h-3" /> {daysUntilDue(task)}d
            </span>
          ) : task.due_date ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-ink-400">
              <CalendarDays className="w-3 h-3" /> {fmtDate(task.due_date)}
            </span>
          ) : null}
        </div>
        {assigneeUser && (
          <div className="grid h-6 w-6 place-items-center rounded-full bg-brand-500 text-[10px] font-bold text-white" title={userDisplayName(assigneeUser)}>
            {initials(userDisplayName(assigneeUser))}
          </div>
        )}
      </div>
    </div>
  );
}

function KanbanView({
  tasks, users, dragId, dragOverBucket, onDragStart, onDragOverBucket, onDrop, onAddBucket, onOpenDetail,
}: {
  tasks: PlannerTask[];
  users: PortalUser[];
  dragId: string | null;
  dragOverBucket: TaskBucket | null;
  onDragStart: (id: string) => void;
  onDragOverBucket: (bucket: TaskBucket) => void;
  onDrop: (bucket: TaskBucket) => void;
  onAddBucket: (bucket: TaskBucket) => void;
  onOpenDetail: (task: PlannerTask) => void;
}) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {BUCKETS.map((bucket) => {
        const bucketTasks = tasks.filter((t) => t.bucket === bucket).sort((a, b) => a.sort_order - b.sort_order);
        const isOver = dragOverBucket === bucket;
        return (
          <div
            key={bucket}
            onDragOver={(e) => { e.preventDefault(); onDragOverBucket(bucket); }}
            onDrop={() => onDrop(bucket)}
            className={`flex w-72 shrink-0 flex-col rounded-2xl border-t-4 ${bucketColors[bucket]} bg-ink-50/60 p-3 transition-all ${isOver ? 'ring-2 ring-brand-300 bg-brand-50/40' : ''}`}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-ink-800">{bucket}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-ink-500">{bucketTasks.length}</span>
              </div>
              <button onClick={() => onAddBucket(bucket)} className="grid h-6 w-6 place-items-center rounded-lg text-ink-400 transition-colors hover:bg-white hover:text-brand-600">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-2 min-h-[100px]">
              {bucketTasks.map((task) => (
                <div key={task.id} className={dragId === task.id ? 'opacity-40' : ''}>
                  <TaskCard
                    task={task}
                    users={users}
                    onDragStart={() => onDragStart(task.id)}
                    onClick={() => onOpenDetail(task)}
                  />
                </div>
              ))}
              {bucketTasks.length === 0 && (
                <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-ink-200 py-8 text-xs text-ink-400">
                  Arraste tarefas para cá
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ListView({ tasks, users, onOpenDetail }: { tasks: PlannerTask[]; users: PortalUser[]; onOpenDetail: (task: PlannerTask) => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/50 text-left text-xs font-semibold uppercase tracking-wider text-ink-400">
              <th className="px-4 py-3">Tarefa</th>
              <th className="px-4 py-3">Responsável</th>
              <th className="px-4 py-3">Prioridade</th>
              <th className="px-4 py-3">Prazo</th>
              <th className="px-4 py-3">Progresso</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, i) => {
              const assigneeUser = users.find((u) => u.email === task.assignee);
              const overdue = isTaskOverdue(task);
              const progress = checklistProgress(task);
              return (
                <tr
                  key={task.id}
                  onClick={() => onOpenDetail(task)}
                  className="cursor-pointer border-b border-ink-50 transition-colors last:border-0 hover:bg-ink-50/40 animate-fade-in"
                  style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {task.labels.length > 0 && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: task.labels[0].split(':')[1] ?? '#2f86f6' }} />}
                      <span className="font-medium text-ink-900 line-clamp-1">{task.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{assigneeUser ? userDisplayName(assigneeUser) : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${priorityColors[task.priority]}`}>{task.priority}</span>
                  </td>
                  <td className={`px-4 py-3 text-xs ${overdue ? 'font-semibold text-error-600' : 'text-ink-500'}`}>
                    {fmtDate(task.due_date)}
                    {overdue && ' (atrasada)'}
                  </td>
                  <td className="px-4 py-3">
                    {task.checklist.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-ink-100">
                          <div className="h-full rounded-full bg-success-500" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs text-ink-400">{progress}%</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-ink-600">{task.bucket}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CalendarView({ tasks, onOpenDetail }: { tasks: PlannerTask[]; onOpenDetail: (task: PlannerTask) => void }) {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const startPad = (first.getDay() + 6) % 7;
    const total = last.getDate() + startPad;
    const rows = Math.ceil(total / 7);
    const cells: { date: Date | null }[] = [];
    for (let i = 0; i < rows * 7; i++) {
      const dayNum = i - startPad + 1;
      if (dayNum < 1 || dayNum > last.getDate()) cells.push({ date: null });
      else cells.push({ date: new Date(month.getFullYear(), month.getMonth(), dayNum) });
    }
    return cells;
  }, [month]);

  function tasksOnDay(date: Date): PlannerTask[] {
    const iso = date.toISOString().slice(0, 10);
    return tasks.filter((t) => t.due_date === iso);
  }

  const monthLabel = month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold capitalize text-ink-900">{monthLabel}</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="grid h-8 w-8 place-items-center rounded-lg bg-ink-50 text-ink-600 transition-colors hover:bg-ink-100">
            <span className="text-lg">‹</span>
          </button>
          <button onClick={() => { const d = new Date(); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); }} className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100">
            Hoje
          </button>
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="grid h-8 w-8 place-items-center rounded-lg bg-ink-50 text-ink-600 transition-colors hover:bg-ink-100">
            <span className="text-lg">›</span>
          </button>
        </div>
      </div>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-ink-400">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => <div key={d} className="py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((cell, i) => {
          if (!cell.date) return <div key={i} className="min-h-[80px] rounded-lg bg-ink-50/30" />;
          const dayTasks = tasksOnDay(cell.date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const isToday = cell.date.getTime() === today.getTime();
          return (
            <div key={i} className={`min-h-[80px] rounded-lg border p-1.5 transition-colors ${isToday ? 'border-brand-300 bg-brand-50/30' : 'border-ink-100 bg-white'}`}>
              <span className={`text-xs font-semibold ${isToday ? 'text-brand-700' : 'text-ink-400'}`}>{cell.date.getDate()}</span>
              <div className="mt-1 space-y-1">
                {dayTasks.slice(0, 3).map((t) => {
                  const overdue = isTaskOverdue(t);
                  return (
                    <button
                      key={t.id}
                      onClick={() => onOpenDetail(t)}
                      className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[10px] font-medium transition-colors ${overdue ? 'bg-error-100 text-error-700' : t.bucket === 'Concluído' ? 'bg-success-100 text-success-700' : 'bg-brand-100 text-brand-700'}`}
                    >
                      {t.title}
                    </button>
                  );
                })}
                {dayTasks.length > 3 && <span className="text-[10px] text-ink-400">+{dayTasks.length - 3} mais</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
