import { useEffect, useRef, useState } from 'react';
import { X, Upload, Trash2, Plus, Link2, ImagePlus, Video, Loader2 } from 'lucide-react';
import { supabase, type AdCase, type CaseLink, type Format, type Status } from '@/lib/supabase';
import { fetchFormats, uploadCaseImage } from '@/lib/data';

const PLATFORMS = ['Digital', 'TV Aberta', 'TV Fechada', 'Streaming'];
const STATUSES: Status[] = ['Ativo', 'Inativo', 'Rascunho'];

interface CaseFormModalProps {
  open: boolean;
  caseData: AdCase | null;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  format_id: string;
  client: string;
  platform: string;
  description: string;
  image_url: string;
  gallery_images: string[];
  videos: string[];
  links: CaseLink[];
  publication_date: string;
  status: string;
}

const EMPTY: FormState = {
  format_id: '',
  client: '',
  platform: 'Digital',
  description: '',
  image_url: '',
  gallery_images: [],
  videos: [],
  links: [],
  publication_date: '',
  status: 'Ativo',
};

export default function CaseFormModal({ open, caseData, onClose, onSaved }: CaseFormModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [formats, setFormats] = useState<Format[]>([]);
  const [loadingFormats, setLoadingFormats] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'info' | 'media' | 'extras'>('info');
  const fileRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    fetchFormats()
      .then(setFormats)
      .catch(() => {})
      .finally(() => setLoadingFormats(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (caseData) {
      setForm({
        format_id: caseData.format_id ?? '',
        client: caseData.client ?? '',
        platform: caseData.platform ?? 'Digital',
        description: caseData.description ?? '',
        image_url: caseData.image_url ?? '',
        gallery_images: caseData.gallery_images ?? [],
        videos: caseData.videos ?? [],
        links: caseData.links ?? [],
        publication_date: caseData.publication_date ?? '',
        status: caseData.status ?? 'Ativo',
      });
    } else {
      setForm(EMPTY);
    }
    setError(null);
    setTab('info');
  }, [open, caseData]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadCaseImage(file);
      set('image_url', url);
    } catch {
      setError('Falha ao enviar a imagem de capa.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const urls = await Promise.all(files.map(uploadCaseImage));
      set('gallery_images', [...form.gallery_images, ...urls]);
    } catch {
      setError('Falha ao enviar uma ou mais imagens.');
    } finally {
      setUploading(false);
      if (galleryRef.current) galleryRef.current.value = '';
    }
  }

  function removeGalleryImage(idx: number) {
    set('gallery_images', form.gallery_images.filter((_, i) => i !== idx));
  }

  function addVideo() {
    set('videos', [...form.videos, '']);
  }
  function updateVideo(idx: number, val: string) {
    set('videos', form.videos.map((v, i) => (i === idx ? val : v)));
  }
  function removeVideo(idx: number) {
    set('videos', form.videos.filter((_, i) => i !== idx));
  }

  function addLink() {
    set('links', [...form.links, { label: '', url: '' }]);
  }
  function updateLink(idx: number, field: keyof CaseLink, val: string) {
    set('links', form.links.map((l, i) => (i === idx ? { ...l, [field]: val } : l)));
  }
  function removeLink(idx: number) {
    set('links', form.links.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    if (!form.format_id) {
      setError('Selecione o formato publicitário.');
      setTab('info');
      return;
    }
    const selectedFormat = formats.find((f) => f.id === form.format_id);
    const derivedTitle = selectedFormat?.name ?? 'Case';
    setSaving(true);
    setError(null);
    const payload = {
      title: derivedTitle,
      format_id: form.format_id,
      client: form.client.trim() || null,
      platform: form.platform,
      description: form.description.trim() || null,
      image_url: form.image_url || null,
      gallery_images: form.gallery_images,
      videos: form.videos.filter((v) => v.trim() !== ''),
      links: form.links.filter((l) => l.label.trim() && l.url.trim()),
      publication_date: form.publication_date || null,
      status: form.status,
    };
    try {
      if (caseData) {
        const { error: err } = await supabase.from('cases').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', caseData.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('cases').insert(payload);
        if (err) throw err;
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar o case.');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const tabs = [
    { id: 'info' as const, label: 'Informações' },
    { id: 'media' as const, label: 'Mídia' },
    { id: 'extras' as const, label: 'Vídeos e Links' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="relative mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-float animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
          <h2 className="text-lg font-bold text-ink-900">{caseData ? 'Editar case' : 'Adicionar novo case'}</h2>
          <button onClick={onClose} className="text-ink-400 transition-colors hover:text-ink-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-ink-100 px-6 pt-3">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${tab === t.id ? 'text-brand-700' : 'text-ink-500 hover:text-ink-800'}`}
            >
              {t.label}
              {tab === t.id && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-600" />}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === 'info' && (
            <div className="space-y-4">
              <Field label="Formato publicitário" required>
                <select
                  value={form.format_id}
                  onChange={(e) => set('format_id', e.target.value)}
                  disabled={loadingFormats}
                  className={inputCls}
                >
                  <option value="">{loadingFormats ? 'Carregando formatos...' : 'Selecione um formato'}</option>
                  {formats.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
                {form.format_id && (
                  <p className="mt-1.5 text-xs text-ink-400">
                    O nome do formato será usado como identificação do case.
                  </p>
                )}
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Cliente">
                  <input
                    value={form.client}
                    onChange={(e) => set('client', e.target.value)}
                    placeholder="Ex: Bebidas Frutas"
                    className={inputCls}
                  />
                </Field>
                <Field label="Plataforma">
                  <select value={form.platform} onChange={(e) => set('platform', e.target.value)} className={inputCls}>
                    {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Descrição do case">
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  rows={4}
                  placeholder="Descreva o projeto, os resultados e os aprendizados..."
                  className={`${inputCls} resize-none`}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Data de publicação">
                  <input
                    type="date"
                    value={form.publication_date}
                    onChange={(e) => set('publication_date', e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Status">
                  <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputCls}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
            </div>
          )}

          {tab === 'media' && (
            <div className="space-y-5">
              <Field label="Imagem de capa">
                <div className="flex items-center gap-4">
                  <div className="h-24 w-32 shrink-0 overflow-hidden rounded-xl border border-ink-200 bg-ink-50">
                    {form.image_url ? (
                      <img src={form.image_url} alt="Capa" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-ink-300">
                        <ImagePlus className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="inline-flex items-center gap-2 rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-50 disabled:opacity-50"
                    >
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Enviar capa
                    </button>
                    {form.image_url && (
                      <button type="button" onClick={() => set('image_url', '')} className="ml-2 text-xs text-error-600 hover:underline">
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </Field>

              <Field label="Galeria de imagens">
                <input ref={galleryRef} type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
                <button
                  type="button"
                  onClick={() => galleryRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-xl border border-dashed border-ink-300 px-4 py-2.5 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-50 disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Adicionar imagens
                </button>
                {form.gallery_images.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
                    {form.gallery_images.map((url, i) => (
                      <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-ink-200">
                        <img src={url} alt={`Galeria ${i + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(i)}
                          className="absolute inset-0 grid place-items-center bg-ink-950/60 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Field>
            </div>
          )}

          {tab === 'extras' && (
            <div className="space-y-5">
              <Field label="Vídeos do case">
                <div className="space-y-2">
                  {form.videos.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Video className="w-4 h-4 shrink-0 text-ink-400" />
                      <input
                        value={v}
                        onChange={(e) => updateVideo(i, e.target.value)}
                        placeholder="https://..."
                        className={inputCls}
                      />
                      <button type="button" onClick={() => removeVideo(i)} className="shrink-0 text-ink-400 hover:text-error-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addVideo} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700">
                    <Plus className="w-4 h-4" /> Adicionar vídeo
                  </button>
                </div>
              </Field>

              <Field label="Links complementares">
                <div className="space-y-2">
                  {form.links.map((l, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Link2 className="w-4 h-4 shrink-0 text-ink-400" />
                      <input
                        value={l.label}
                        onChange={(e) => updateLink(i, 'label', e.target.value)}
                        placeholder="Rótulo (ex: Apresentação)"
                        className={`${inputCls} w-40`}
                      />
                      <input
                        value={l.url}
                        onChange={(e) => updateLink(i, 'url', e.target.value)}
                        placeholder="https://..."
                        className={inputCls}
                      />
                      <button type="button" onClick={() => removeLink(i)} className="shrink-0 text-ink-400 hover:text-error-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addLink} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700">
                    <Plus className="w-4 h-4" /> Adicionar link
                  </button>
                </div>
              </Field>
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-xl bg-error-50 px-4 py-3 text-sm font-medium text-error-700 ring-1 ring-error-100">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-ink-100 px-6 py-4">
          <button onClick={onClose} className="rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink-600 transition-colors hover:bg-ink-50">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {caseData ? 'Salvar alterações' : 'Cadastrar case'}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls = 'w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition-all focus:border-brand-300 focus:ring-2 focus:ring-brand-100';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-ink-600">
        {label}
        {required && <span className="ml-0.5 text-error-500">*</span>}
      </span>
      {children}
    </label>
  );
}
