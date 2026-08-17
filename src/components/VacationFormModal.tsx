import { useEffect, useState } from 'react';
import { X, Plane, Loader2, CalendarDays } from 'lucide-react';
import { supabase, type Vacation } from '@/lib/supabase';
import { calcDays } from '@/lib/data';

interface VacationFormModalProps {
  open: boolean;
  vacation: Vacation | null;
  defaultName?: string;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  employee_name: string;
  start_date: string;
  end_date: string;
  notes: string;
}

const EMPTY: FormState = {
  employee_name: '',
  start_date: '',
  end_date: '',
  notes: '',
};

const inputCls =
  'w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition-all focus:border-brand-300 focus:ring-2 focus:ring-brand-100';

export default function VacationFormModal({ open, vacation, defaultName, onClose, onSaved }: VacationFormModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (vacation) {
      setForm({
        employee_name: vacation.employee_name,
        start_date: vacation.start_date,
        end_date: vacation.end_date,
        notes: vacation.notes ?? '',
      });
    } else {
      setForm({ ...EMPTY, employee_name: defaultName ?? '' });
    }
    setError(null);
  }, [open, vacation, defaultName]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  const computedDays = form.start_date && form.end_date ? calcDays(form.start_date, form.end_date) : 0;

  async function handleSubmit() {
    if (!form.employee_name.trim()) {
      setError('Informe o nome do colaborador.');
      return;
    }
    if (!form.start_date || !form.end_date) {
      setError('Informe as datas de início e término.');
      return;
    }
    if (form.end_date < form.start_date) {
      setError('A data de retorno não pode ser anterior à data de saída.');
      return;
    }
    const days = calcDays(form.start_date, form.end_date);
    if (days <= 0) {
      setError('O período de férias deve ter pelo menos 1 dia.');
      return;
    }

    setSaving(true);
    setError(null);
    const payload = {
      employee_name: form.employee_name.trim(),
      start_date: form.start_date,
      end_date: form.end_date,
      days,
      notes: form.notes.trim() || null,
    };
    try {
      if (vacation) {
        const { error: err } = await supabase
          .from('vacations')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', vacation.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('vacations').insert(payload);
        if (err) throw err;
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar as férias.');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="relative mx-4 w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-float animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Plane className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-ink-900">{vacation ? 'Editar férias' : 'Solicitar férias'}</h2>
          </div>
          <button onClick={onClose} className="text-ink-400 transition-colors hover:text-ink-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-700">Nome do colaborador <span className="text-error-500">*</span></label>
            <input
              value={form.employee_name}
              onChange={(e) => set('employee_name', e.target.value)}
              placeholder="Ex: João Silva"
              className={inputCls}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-700">Data de saída <span className="text-error-500">*</span></label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => set('start_date', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-700">Data de retorno <span className="text-error-500">*</span></label>
              <input
                type="date"
                value={form.end_date}
                min={form.start_date || undefined}
                onChange={(e) => set('end_date', e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-brand-50/60 px-4 py-3">
            <CalendarDays className="w-5 h-5 text-brand-600" />
            <div className="flex-1">
              <p className="text-xs font-medium text-ink-500">Quantidade de dias de férias</p>
              <p className="text-lg font-bold text-brand-700">
                {computedDays > 0 ? `${computedDays} ${computedDays === 1 ? 'dia' : 'dias'}` : '—'}
              </p>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-700">Observações <span className="text-ink-400 font-normal">(opcional)</span></label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              placeholder="Alguma observação sobre as férias..."
              className={`${inputCls} resize-none`}
            />
          </div>

          {error && (
            <div className="rounded-xl bg-error-50 px-4 py-3 text-sm text-error-700">{error}</div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-ink-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink-600 transition-colors hover:bg-ink-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plane className="w-4 h-4" />}
            {vacation ? 'Salvar' : 'Solicitar férias'}
          </button>
        </div>
      </div>
    </div>
  );
}
