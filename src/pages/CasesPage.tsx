import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, SlidersHorizontal, X, Star } from 'lucide-react';
import { fetchAllCases, fetchFormats, deleteCase } from '@/lib/data';
import type { AdCase, Format } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import CaseCard from '@/components/ui/CaseCard';
import CaseFormModal from '@/components/CaseFormModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { SkeletonCard } from '@/components/ui/Skeleton';

const STATUSES = ['Ativo', 'Inativo', 'Rascunho'];
const PLATFORMS = ['Digital', 'TV Aberta', 'TV Fechada', 'Streaming'];

interface Filters {
  keyword: string;
  format: string | null;
  status: string | null;
  platform: string | null;
}

const DEFAULT_FILTERS: Filters = { keyword: '', format: null, status: null, platform: null };

export default function CasesPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [cases, setCases] = useState<AdCase[]>([]);
  const [formats, setFormats] = useState<Format[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdCase | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdCase | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [c, f] = await Promise.all([fetchAllCases(), fetchFormats()]);
        if (active) {
          setCases(c);
          setFormats(f);
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

  const filtered = useMemo(() => {
    let list = cases;
    if (filters.keyword.trim()) {
      const q = filters.keyword.toLowerCase();
      list = list.filter(
        (c) =>
          (c.client ?? '').toLowerCase().includes(q) ||
          (c.description ?? '').toLowerCase().includes(q) ||
          (c.format?.name ?? '').toLowerCase().includes(q),
      );
    }
    if (filters.format) list = list.filter((c) => c.format_id === filters.format);
    if (filters.status) list = list.filter((c) => c.status === filters.status);
    if (filters.platform) list = list.filter((c) => c.platform === filters.platform);
    return list;
  }, [cases, filters]);

  const activeCount = Object.entries(filters).filter(([, v]) => v && (typeof v !== 'string' || v.trim() !== '')).length;

  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((p) => ({ ...p, [key]: value }));
  }

  function openAdd() {
    setEditTarget(null);
    setFormOpen(true);
  }
  function openEdit(item: AdCase) {
    setEditTarget(item);
    setFormOpen(true);
  }
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCase(deleteTarget.id);
      setCases((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      /* keep dialog open on error */
    } finally {
      setDeleting(false);
    }
  }
  function refresh() {
    setFormOpen(false);
    fetchAllCases().then(setCases).catch(() => {});
  }

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Cases de sucesso</h1>
          <p className="mt-1 text-sm text-ink-500">
            {loading ? 'Carregando...' : `${filtered.length} de ${cases.length} cases`}
          </p>
        </div>
        {isAdmin && (
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-all hover:bg-brand-700 hover:shadow-float hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          Adicionar novo case
        </button>
        )}
      </div>

      {/* Keyword search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
        <input
          value={filters.keyword}
          onChange={(e) => set('keyword', e.target.value)}
          placeholder="Buscar cases por formato, cliente..."
          className="w-full rounded-2xl border border-ink-200 bg-white py-3.5 pl-12 pr-4 text-sm shadow-soft placeholder:text-ink-400 transition-all focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-soft">
        <div className="flex items-center gap-2 pr-1 text-sm font-semibold text-ink-700">
          <SlidersHorizontal className="w-4 h-4 text-brand-600" />
          Filtros
        </div>
        <FilterSelect label="Formato" value={filters.format} options={formats.map((f) => f.name)} optionIds={formats.map((f) => f.id)} onChange={(v) => set('format', v)} />
        <FilterSelect label="Status" value={filters.status} options={STATUSES} onChange={(v) => set('status', v)} />
        <FilterSelect label="Plataforma" value={filters.platform} options={PLATFORMS} onChange={(v) => set('platform', v)} />

        {activeCount > 0 && (
          <button
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-ink-50 px-3 py-2 text-xs font-semibold text-ink-600 transition-colors hover:bg-ink-100"
          >
            <X className="w-3.5 h-3.5" /> Limpar ({activeCount})
          </button>
        )}
      </div>

      {/* Active chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.format && <Chip label={`Formato: ${formats.find((f) => f.id === filters.format)?.name ?? ''}`} onClear={() => set('format', null)} />}
          {filters.status && <Chip label={`Status: ${filters.status}`} onClear={() => set('status', null)} />}
          {filters.platform && <Chip label={`Plataforma: ${filters.platform}`} onClear={() => set('platform', null)} />}
          {filters.keyword && <Chip label={`Busca: "${filters.keyword}"`} onClear={() => set('keyword', '')} />}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState onAdd={openAdd} canAdd={isAdmin} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((c, i) => (
            <CaseCard
              key={c.id}
              item={c}
              index={i}
              canManage={isAdmin}
              onView={(id) => navigate(`/cases/${id}`)}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <CaseFormModal open={formOpen} caseData={editTarget} onClose={() => setFormOpen(false)} onSaved={refresh} />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir case"
        message={`Tem certeza que deseja excluir o case "${deleteTarget?.format?.name ?? 'Case'}"? Esta ação não poderá ser desfeita.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function FilterSelect({ label, value, options, optionIds, onChange }: { label: string; value: string | null; options: string[]; optionIds?: string[]; onChange: (v: string | null) => void }) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-xs font-medium text-ink-400">{label}</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="rounded-lg border border-ink-200 bg-white py-1.5 pl-3 pr-7 text-sm text-ink-800 transition-colors focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
      >
        <option value="">Todos</option>
        {options.map((o, i) => (
          <option key={o} value={optionIds ? optionIds[i] : o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-100">
      {label}
      <button onClick={onClear} className="text-brand-400 hover:text-brand-700"><X className="w-3 h-3" /></button>
    </span>
  );
}

function EmptyState({ onAdd, canAdd }: { onAdd: () => void; canAdd?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-ink-200 bg-white py-20 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-300">
        <Star className="w-8 h-8" />
      </div>
      <p className="mt-4 text-sm font-semibold text-ink-700">Nenhum case encontrado</p>
      <p className="mt-1 text-xs text-ink-400">{canAdd ? 'Cadastre o primeiro case do portal.' : 'Ainda não há cases cadastrados.'}</p>
      {canAdd && (
        <button onClick={onAdd} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700">
          <Plus className="w-4 h-4" /> Adicionar case
        </button>
      )}
    </div>
  );
}
