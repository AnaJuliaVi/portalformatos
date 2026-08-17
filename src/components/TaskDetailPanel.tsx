import { useCallback, useEffect, useState } from 'react';
import { X, Trash2, Send, History, MessageSquare, Paperclip, CheckSquare, Pencil, Loader2, Plus, Clock } from 'lucide-react';
import {
  updateTask,
  deleteTask,
  fetchTaskComments,
  addTaskComment,
  deleteTaskComment,
  fetchTaskActivity,
  checklistProgress,
  isTaskOverdue,
  daysUntilDue,
  userDisplayName,
} from '@/lib/data';
import type { PlannerTask, TaskComment, TaskActivity, PortalUser, ChecklistItem, TaskBucket } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

interface TaskDetailPanelProps {
  open: boolean;
  task: PlannerTask | null;
  users: PortalUser[];
  onClose: () => void;
  onEdit: (task: PlannerTask) => void;
  onUpdated: () => void;
  onDeleted: () => void;
}

const BUCKETS: TaskBucket[] = ['A Fazer', 'Em Andamento', 'Em Revisão', 'Concluído'];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') ? iso : iso + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

const priorityColors: Record<string, string> = {
  Baixa: 'bg-ink-100 text-ink-600',
  Média: 'bg-brand-100 text-brand-700',
  Alta: 'bg-warning-100 text-warning-700',
  Urgente: 'bg-error-100 text-error-700',
};

export default function TaskDetailPanel({ open, task, users, onClose, onEdit, onUpdated, onDeleted }: TaskDetailPanelProps) {
  const { email } = useAuth();
  const [local, setLocal] = useState<PlannerTask | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [activity, setActivity] = useState<TaskActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [tab, setTab] = useState<'comments' | 'activity'>('comments');

  const loadExtras = useCallback(async (taskId: string) => {
    setLoading(true);
    try {
      const [c, a] = await Promise.all([fetchTaskComments(taskId), fetchTaskActivity(taskId)]);
      setComments(c);
      setActivity(a);
    } catch {
      /* keep empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !task) return;
    setLocal(task);
    loadExtras(task.id);
    setTab('comments');
  }, [open, task, loadExtras]);

  async function patchTask(patch: Partial<PlannerTask>) {
    if (!local) return;
    const optimistic = { ...local, ...patch };
    setLocal(optimistic);
    try {
      await updateTask(local.id, patch);
      onUpdated();
    } catch {
      setLocal(local);
    }
  }

  async function handleToggleChecklist(id: string) {
    if (!local) return;
    const checklist = local.checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c));
    await patchTask({ checklist });
  }

  async function handleAddChecklist() {
    if (!local || !newChecklistText.trim()) return;
    const item: ChecklistItem = { id: uid(), text: newChecklistText.trim(), done: false };
    await patchTask({ checklist: [...local.checklist, item] });
    setNewChecklistText('');
  }

  async function handleRemoveChecklist(id: string) {
    if (!local) return;
    await patchTask({ checklist: local.checklist.filter((c) => c.id !== id) });
  }

  async function handleDelete() {
    if (!local) return;
    await deleteTask(local.id);
    onDeleted();
  }

  function extractMentions(text: string): { emails: string[] } {
    const matches = text.match(/@[\w.]+@[\w.]+/g) ?? [];
    const emails = matches.map((m) => m.slice(1).toLowerCase());
    return { emails: [...new Set(emails)] };
  }

  async function handleAddComment() {
    if (!local || !newComment.trim()) return;
    setSavingComment(true);
    const { emails } = extractMentions(newComment);
    try {
      const c = await addTaskComment(local.id, newComment.trim(), emails);
      setComments((prev) => [...prev, c]);
      setNewComment('');
    } catch {
      /* keep */
    } finally {
      setSavingComment(false);
    }
  }

  async function handleDeleteComment(id: string) {
    try {
      await deleteTaskComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch {
      /* keep */
    }
  }

  if (!open || !local) return null;

  const progress = checklistProgress(local);
  const overdue = isTaskOverdue(local);
  const dueIn = daysUntilDue(local);
  const assigneeUser = users.find((u) => u.email === local.assignee);
  const creatorMatch = users.find((u) => u.email === email);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink-950/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-float animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'slide-in-right 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-ink-100 px-6 py-4">
          <div className="flex-1 pr-4">
            <h2 className="text-lg font-bold text-ink-900">{local.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <select
                value={local.bucket}
                onChange={(e) => patchTask({ bucket: e.target.value as TaskBucket })}
                className="rounded-lg border border-ink-200 px-2.5 py-1 text-xs font-semibold text-ink-700"
              >
                {BUCKETS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityColors[local.priority]}`}>
                {local.priority}
              </span>
              {overdue && (
                <span className="inline-flex items-center gap-1 rounded-full bg-error-100 px-2.5 py-1 text-xs font-semibold text-error-700">
                  <Clock className="w-3 h-3" /> Atrasada
                </span>
              )}
              {!overdue && dueIn !== null && dueIn >= 0 && dueIn <= 3 && local.bucket !== 'Concluído' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning-100 px-2.5 py-1 text-xs font-semibold text-warning-700">
                  <Clock className="w-3 h-3" /> Vence em {dueIn}d
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onEdit(local)} className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-700 transition-colors hover:bg-brand-100">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={handleDelete} className="grid h-8 w-8 place-items-center rounded-lg bg-error-50 text-error-600 transition-colors hover:bg-error-100">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition-colors hover:bg-ink-50">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase text-ink-400">Responsável</p>
              <p className="mt-1 font-medium text-ink-700">{assigneeUser ? userDisplayName(assigneeUser) : local.assignee ?? 'Sem responsável'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-ink-400">Criado por</p>
              <p className="mt-1 font-medium text-ink-700">{creatorMatch ? userDisplayName(creatorMatch) : email ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-ink-400">Data de início</p>
              <p className="mt-1 font-medium text-ink-700">{fmtDate(local.start_date)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-ink-400">Prazo</p>
              <p className={`mt-1 font-medium ${overdue ? 'text-error-600' : 'text-ink-700'}`}>{fmtDate(local.due_date)}</p>
            </div>
          </div>

          {/* Description */}
          {local.description && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase text-ink-400">Descrição</p>
              <p className="text-sm leading-relaxed text-ink-600 whitespace-pre-wrap">{local.description}</p>
            </div>
          )}

          {/* Labels */}
          {local.labels.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {local.labels.map((label) => {
                const color = label.split(':')[1] ?? '#2f86f6';
                return (
                  <span key={label} className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ backgroundColor: color + '20', color }}>
                    <span className="mr-1 inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: color }} />
                    {label.split(':')[0]}
                  </span>
                );
              })}
            </div>
          )}

          {/* Checklist */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-brand-500" />
                <p className="text-sm font-semibold text-ink-700">Checklist</p>
              </div>
              {local.checklist.length > 0 && (
                <span className="text-xs font-medium text-ink-400">
                  {local.checklist.filter((c) => c.done).length}/{local.checklist.length} · {progress}%
                </span>
              )}
            </div>
            {local.checklist.length > 0 && (
              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-ink-100">
                <div className="h-full rounded-full bg-success-500 transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            )}
            <div className="space-y-1.5">
              {local.checklist.map((c) => (
                <div key={c.id} className="group flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={c.done}
                    onChange={() => handleToggleChecklist(c.id)}
                    className="h-4 w-4 rounded border-ink-300 text-success-600 focus:ring-success-300"
                  />
                  <span className={`flex-1 text-sm ${c.done ? 'text-ink-400 line-through' : 'text-ink-700'}`}>{c.text}</span>
                  <button onClick={() => handleRemoveChecklist(c.id)} className="text-ink-300 opacity-0 transition-opacity hover:text-error-500 group-hover:opacity-100">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddChecklist())}
                  placeholder="Adicionar subtarefa..."
                  className="flex-1 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                />
                <button onClick={handleAddChecklist} className="shrink-0 rounded-xl bg-brand-50 px-3 text-brand-600 transition-colors hover:bg-brand-100">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Attachments */}
          {local.attachments.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-brand-500" />
                <p className="text-sm font-semibold text-ink-700">Anexos</p>
              </div>
              <div className="space-y-1.5">
                {local.attachments.map((a) => (
                  <a
                    key={a.id}
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-ink-100 px-3 py-2 text-sm text-ink-700 transition-colors hover:bg-ink-50"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-brand-500" />
                    <span className="flex-1 truncate">{a.label || a.url}</span>
                    <span className="text-xs text-ink-400">{a.type}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Tabs: Comments / Activity */}
          <div>
            <div className="flex gap-1 border-b border-ink-100">
              <button
                onClick={() => setTab('comments')}
                className={`relative flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${tab === 'comments' ? 'text-brand-700' : 'text-ink-500 hover:text-ink-800'}`}
              >
                <MessageSquare className="w-4 h-4" /> Comentários
                {tab === 'comments' && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-600" />}
              </button>
              <button
                onClick={() => setTab('activity')}
                className={`relative flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${tab === 'activity' ? 'text-brand-700' : 'text-ink-500 hover:text-ink-800'}`}
              >
                <History className="w-4 h-4" /> Histórico
                {tab === 'activity' && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-600" />}
              </button>
            </div>

            <div className="pt-3">
              {tab === 'comments' ? (
                <div className="space-y-3">
                  {loading ? (
                    <div className="flex items-center gap-2 text-sm text-ink-400"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</div>
                  ) : comments.length === 0 ? (
                    <p className="py-4 text-center text-sm text-ink-400">Nenhum comentário ainda.</p>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="group rounded-xl bg-ink-50 px-4 py-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-ink-700">{c.author}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-ink-400">{fmtDateTime(c.created_at)}</span>
                            <button onClick={() => handleDeleteComment(c.id)} className="text-ink-300 opacity-0 transition-opacity hover:text-error-500 group-hover:opacity-100">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="mt-1 text-sm text-ink-600 whitespace-pre-wrap">
                          {renderCommentWithMentions(c.body)}
                        </p>
                      </div>
                    ))
                  )}
                  <div className="flex gap-2 pt-2">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={2}
                      placeholder="Escreva um comentário... Use @email para mencionar alguém."
                      className="flex-1 resize-none rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={savingComment || !newComment.trim()}
                      className="shrink-0 self-end rounded-xl bg-brand-600 px-3 py-2.5 text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
                    >
                      {savingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {loading ? (
                    <div className="flex items-center gap-2 text-sm text-ink-400"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</div>
                  ) : activity.length === 0 ? (
                    <p className="py-4 text-center text-sm text-ink-400">Sem histórico de alterações.</p>
                  ) : (
                    activity.map((a) => (
                      <div key={a.id} className="flex items-start gap-3 rounded-lg bg-ink-50/50 px-3 py-2">
                        <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-brand-400" />
                        <div>
                          <p className="text-sm text-ink-700"><span className="font-semibold">{a.actor}</span> {a.action}</p>
                          <p className="text-xs text-ink-400">{fmtDateTime(a.created_at)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderCommentWithMentions(body: string): React.ReactNode {
  const parts = body.split(/(@[\w.]+@[\w.]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@') && part.includes('@', 1)) {
      return <span key={i} className="font-semibold text-brand-600">{part}</span>;
    }
    return part;
  });
}
