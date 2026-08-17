import { useEffect, useState } from 'react';
import { X, Loader2, Plus, Trash2, Link2 } from 'lucide-react';
import { supabase, type PlannerTask, type TaskBucket, type TaskPriority, type TaskRecurrence, type TaskInput, type ChecklistItem, type TaskAttachment, type PortalUser } from '@/lib/supabase';

interface TaskFormModalProps {
  open: boolean;
  task: PlannerTask | null;
  defaultBucket?: TaskBucket;
  users: PortalUser[];
  onClose: () => void;
  onSaved: () => void;
}

const BUCKETS: TaskBucket[] = ['A Fazer', 'Em Andamento', 'Em Revisão', 'Concluído'];
const PRIORITIES: TaskPriority[] = ['Baixa', 'Média', 'Alta', 'Urgente'];
const RECURRENCES: { value: TaskRecurrence; label: string }[] = [
  { value: 'daily', label: 'Diária' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
];

const LABEL_COLORS = ['#2f86f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const LABEL_NAMES = ['Azul', 'Verde', 'Amarelo', 'Vermelho', 'Roxo', 'Rosa', 'Turquesa', 'Laranja'];

interface FormState {
  title: string;
  description: string;
  bucket: TaskBucket;
  priority: TaskPriority;
  assignee: string;
  start_date: string;
  due_date: string;
  labels: string[];
  checklist: ChecklistItem[];
  attachments: TaskAttachment[];
  recurrence: TaskRecurrence | '';
}

const EMPTY: FormState = {
  title: '',
  description: '',
  bucket: 'A Fazer',
  priority: 'Média',
  assignee: '',
  start_date: '',
  due_date: '',
  labels: [],
  checklist: [],
  attachments: [],
  recurrence: '',
};

const inputCls =
  'w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition-all focus:border-brand-300 focus:ring-2 focus:ring-brand-100';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function TaskFormModal({ open, task, defaultBucket, users, onClose, onSaved }: TaskFormModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newAttach, setNewAttach] = useState<TaskAttachment>({ id: '', type: 'link', label: '', url: '' });

  useEffect(() => {
    if (!open) return;
    if (task) {
      setForm({
        title: task.title,
        description: task.description ?? '',
        bucket: task.bucket,
        priority: task.priority,
        assignee: task.assignee ?? '',
        start_date: task.start_date ?? '',
        due_date: task.due_date ?? '',
        labels: task.labels ?? [],
        checklist: task.checklist ?? [],
        attachments: task.attachments ?? [],
        recurrence: task.recurrence ?? '',
      });
    } else {
      setForm({ ...EMPTY, bucket: defaultBucket ?? 'A Fazer' });
    }
    setError(null);
  }, [open, task, defaultBucket]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function addChecklistItem() {
    if (!newChecklistText.trim()) return;
    set('checklist', [...form.checklist, { id: uid(), text: newChecklistText.trim(), done: false }]);
    setNewChecklistText('');
  }

  function removeChecklistItem(id: string) {
    set('checklist', form.checklist.filter((c) => c.id !== id));
  }

  function toggleChecklistItem(id: string) {
    set('checklist', form.checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c)));
  }

  function addAttachment() {
    if (!newAttach.url.trim()) return;
    set('attachments', [...form.attachments, { ...newAttach, id: uid() }]);
    setNewAttach({ id: '', type: 'link', label: '', url: '' });
  }

  function removeAttachment(id: string) {
    set('attachments', form.attachments.filter((a) => a.id !== id));
  }

  async function handleSubmit() {
    if (!form.title.trim()) {
      setError('Informe o título da tarefa.');
      return;
    }
    setSaving(true);
    setError(null);
    const payload: TaskInput = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      bucket: form.bucket,
      priority: form.priority,
      assignee: form.assignee || null,
      start_date: form.start_date || null,
      due_date: form.due_date || null,
      labels: form.labels,
      checklist: form.checklist,
      attachments: form.attachments,
      recurrence: form.recurrence || null,
      sort_order: task?.sort_order ?? 0,
    };
    try {
      if (task) {
        const { error: err } = await supabase
          .from('planner_tasks')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', task.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('planner_tasks').insert(payload);
        if (err) throw err;
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar a tarefa.');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="relative mx-4 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-float animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
          <h2 className="text-lg font-bold text-ink-900">{task ? 'Editar tarefa' : 'Nova tarefa'}</h2>
          <button onClick={onClose} className="text-ink-400 transition-colors hover:text-ink-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-700">Título <span className="text-error-500">*</span></label>
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Ex: Produzir vídeo institucional"
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-700">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              placeholder="Descreva a tarefa..."
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-700">Responsável</label>
              <select value={form.assignee} onChange={(e) => set('assignee', e.target.value)} className={inputCls}>
                <option value="">Sem responsável</option>
                {users.map((u) => (
                  <option key={u.id} value={u.email}>{u.name || u.email}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-700">Prioridade</label>
              <select value={form.priority} onChange={(e) => set('priority', e.target.value as TaskPriority)} className={inputCls}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-700">Data de início</label>
              <input type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-700">Prazo de entrega</label>
              <input type="date" value={form.due_date} min={form.start_date || undefined} onChange={(e) => set('due_date', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-700">Recorrência</label>
              <select value={form.recurrence} onChange={(e) => set('recurrence', e.target.value as TaskRecurrence | '')} className={inputCls}>
                <option value="">Não repete</option>
                {RECURRENCES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-700">Etiquetas</label>
            <div className="flex flex-wrap gap-2">
              {LABEL_COLORS.map((color, i) => {
                const label = `${LABEL_NAMES[i]}:${color}`;
                const selected = form.labels.includes(label);
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      if (selected) set('labels', form.labels.filter((l) => l !== label));
                      else set('labels', [...form.labels, label]);
                    }}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${selected ? 'ring-2 ring-offset-1 ring-ink-300' : 'opacity-50 hover:opacity-100'}`}
                    style={{ backgroundColor: color + '20', color }}
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                    {LABEL_NAMES[i]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Checklist */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-700">Checklist de subtarefas</label>
            <div className="space-y-2">
              {form.checklist.map((c) => (
                <div key={c.id} className="flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={c.done}
                    onChange={() => toggleChecklistItem(c.id)}
                    className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-300"
                  />
                  <span className={`flex-1 text-sm ${c.done ? 'text-ink-400 line-through' : 'text-ink-700'}`}>{c.text}</span>
                  <button onClick={() => removeChecklistItem(c.id)} className="text-ink-400 hover:text-error-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                  placeholder="Adicionar item..."
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={addChecklistItem}
                  className="shrink-0 rounded-xl bg-brand-50 px-3 text-brand-600 transition-colors hover:bg-brand-100"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-700">Anexos (links, documentos, imagens, vídeos)</label>
            <div className="space-y-2">
              {form.attachments.map((a) => (
                <div key={a.id} className="flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-2">
                  <Link2 className="w-4 h-4 shrink-0 text-brand-500" />
                  <span className="flex-1 truncate text-sm text-ink-700">{a.label || a.url}</span>
                  <span className="text-xs text-ink-400">{a.type}</span>
                  <button onClick={() => removeAttachment(a.id)} className="text-ink-400 hover:text-error-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  value={newAttach.type}
                  onChange={(e) => setNewAttach({ ...newAttach, type: e.target.value as TaskAttachment['type'] })}
                  className={`${inputCls} sm:w-32`}
                >
                  <option value="link">Link</option>
                  <option value="document">Documento</option>
                  <option value="image">Imagem</option>
                  <option value="video">Vídeo</option>
                </select>
                <input
                  value={newAttach.label}
                  onChange={(e) => setNewAttach({ ...newAttach, label: e.target.value })}
                  placeholder="Rótulo (opcional)"
                  className={`${inputCls} flex-1`}
                />
                <input
                  value={newAttach.url}
                  onChange={(e) => setNewAttach({ ...newAttach, url: e.target.value })}
                  placeholder="URL"
                  className={`${inputCls} flex-1`}
                />
                <button
                  type="button"
                  onClick={addAttachment}
                  className="shrink-0 rounded-xl bg-brand-50 px-3 text-brand-600 transition-colors hover:bg-brand-100"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {error && <div className="rounded-xl bg-error-50 px-4 py-3 text-sm text-error-700">{error}</div>}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-ink-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-ink-400">Status:</span>
            <select
              value={form.bucket}
              onChange={(e) => set('bucket', e.target.value as TaskBucket)}
              className="rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs font-semibold text-ink-700"
            >
              {BUCKETS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink-600 transition-colors hover:bg-ink-50">
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {task ? 'Salvar' : 'Criar tarefa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
