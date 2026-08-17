import { useEffect, useRef, useState } from 'react';
import { X, UserPlus, UserCog, Loader2, Camera, Trash2 } from 'lucide-react';
import { supabase, type PortalUser, type PortalRole, type PortalUserStatus } from '@/lib/supabase';
import { uploadAvatar } from '@/lib/data';
import Avatar from '@/components/ui/Avatar';

const ALLOWED_DOMAIN = '@g.globo';

interface UserFormModalProps {
  open: boolean;
  user: PortalUser | null;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  email: string;
  name: string;
  role: PortalRole;
  status: PortalUserStatus;
  photo_url: string | null;
  job_title: string;
  area: string;
  join_date: string;
  birthday: string;
}

const EMPTY: FormState = {
  email: '',
  name: '',
  role: 'common',
  status: 'active',
  photo_url: null,
  job_title: '',
  area: '',
  join_date: '',
  birthday: '',
};

export default function UserFormModal({ open, user, onClose, onSaved }: UserFormModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (user) {
      setForm({
        email: user.email,
        name: user.name ?? '',
        role: user.role,
        status: user.status,
        photo_url: user.photo_url,
        job_title: user.job_title ?? '',
        area: user.area ?? '',
        join_date: user.join_date ?? '',
        birthday: user.birthday ?? '',
      });
    } else {
      setForm(EMPTY);
    }
    setError(null);
  }, [open, user]);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingPhoto(true);
    setError(null);
    try {
      const url = await uploadAvatar(file, user.id);
      const { error: err } = await supabase
        .from('portal_users')
        .update({ photo_url: url, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (err) throw err;
      setForm((p) => ({ ...p, photo_url: url }));
    } catch {
      setError('Não foi possível enviar a foto. Tente novamente.');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleRemovePhoto() {
    if (!user) return;
    const { error: err } = await supabase
      .from('portal_users')
      .update({ photo_url: null, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (err) {
      setError('Não foi possível remover a foto.');
      return;
    }
    setForm((p) => ({ ...p, photo_url: null }));
  }

  async function handleSubmit() {
    const normalizedEmail = form.email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('O e-mail é obrigatório.');
      return;
    }
    if (!normalizedEmail.endsWith(ALLOWED_DOMAIN)) {
      setError('O e-mail deve ser corporativo (@g.globo).');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        email: normalizedEmail,
        name: form.name.trim() || null,
        role: form.role,
        status: form.status,
        photo_url: form.photo_url,
        job_title: form.job_title.trim() || null,
        area: form.area.trim() || null,
        join_date: form.join_date || null,
        birthday: form.birthday || null,
      };
      if (user) {
        const { error: err } = await supabase
          .from('portal_users')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', user.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from('portal_users')
          .insert(payload);
        if (err) throw err;
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar usuário.');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="relative mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-float animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
              {user ? <UserCog className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <h2 className="text-lg font-bold text-ink-900">{user ? 'Editar integrante' : 'Adicionar integrante'}</h2>
          </div>
          <button onClick={onClose} className="text-ink-400 transition-colors hover:text-ink-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Avatar upload (only when editing existing user) */}
        {user && (
          <div className="mb-5 flex items-center gap-4 rounded-2xl bg-ink-50 p-4">
            <Avatar user={{ ...user, photo_url: form.photo_url }} size="xl" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink-800">Foto de perfil</p>
              <p className="mt-0.5 text-xs text-ink-400">JPG ou PNG. A foto aparece em todo o portal.</p>
              <div className="mt-3 flex items-center gap-2">
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handlePhotoUpload} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
                >
                  {uploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                  {uploadingPhoto ? 'Enviando...' : form.photo_url ? 'Trocar foto' : 'Enviar foto'}
                </button>
                {form.photo_url && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-error-50 px-3 py-1.5 text-xs font-semibold text-error-600 transition-colors hover:bg-error-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remover
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink-600">Nome completo</span>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Maria Santos"
              className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition-all focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink-600">E-mail corporativo</span>
            <input
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="nome.sobrenome@g.globo"
              className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition-all focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink-600">Cargo / Função</span>
              <input
                value={form.job_title}
                onChange={(e) => setForm((p) => ({ ...p, job_title: e.target.value }))}
                placeholder="Gerente de Formatos"
                className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition-all focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink-600">Área</span>
              <input
                value={form.area}
                onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))}
                placeholder="Digital"
                className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition-all focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink-600">Data de entrada no time</span>
              <input
                type="date"
                value={form.join_date}
                onChange={(e) => setForm((p) => ({ ...p, join_date: e.target.value }))}
                className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 transition-all focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink-600">Data de aniversário</span>
              <input
                type="date"
                value={form.birthday}
                onChange={(e) => setForm((p) => ({ ...p, birthday: e.target.value }))}
                className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 transition-all focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink-600">Tipo de acesso</span>
              <select
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as PortalRole }))}
                className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 transition-all focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
              >
                <option value="common">Usuário Comum</option>
                <option value="admin">Administrador</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink-600">Status</span>
              <select
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as PortalUserStatus }))}
                className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 transition-all focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </label>
          </div>

          {error && (
            <div className="rounded-xl bg-error-50 px-4 py-3 text-sm font-medium text-error-700 ring-1 ring-error-100">
              {error}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink-600 transition-colors hover:bg-ink-50">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {user ? 'Salvar alterações' : 'Adicionar integrante'}
          </button>
        </div>
      </div>
    </div>
  );
}
