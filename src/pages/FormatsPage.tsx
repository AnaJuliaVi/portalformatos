import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X, LayoutGrid } from 'lucide-react';
import { fetchFormats } from '@/lib/data';
import type { Format, Platform, Status } from '@/lib/supabase';
import FormatCard from '@/components/ui/FormatCard';
import Badge from '@/components/ui/Badge';
import { SkeletonGrid } from '@/components/ui/Skeleton';

const PLATFORMS: (Platform | string)[] = ['Digital', 'TV Aberta', 'TV Fechada', 'Streaming'];
const STATUSES: (Status | string)[] = ['Ativo', 'Inativo', 'Rascunho'];
const CASE_OPTIONS = ['Sim', 'Não'];

interface Filters {
  keyword: string;
  platform: string | null;
  status: string | null;
  mediaType: string | null;
  hasCase: string | null;
  sort: 'recent' | 'name';
}

const DEFAULT_FILTERS: Filters = {
  keyword: '',
  platform: null,
  status: null,
  mediaType: null,
  hasCase: null,
  sort: 'recent',
};

export default function FormatsPage() {
  const [formats, setFormats] = useState<Format[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchFormats();
        if (active) setFormats(data);
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

  const mediaTypes = useMemo(() => {
    const set = new Set<string>();
    formats.forEach((f) => f.media_type && set.add(f.media_type));
    return Array.from(set).sort();
  }, [formats]);

  const filtered = useMemo(() => {
    let list = formats;
    if (filters.keyword.trim()) {
      const q = filters.keyword.toLowerCase();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.description ?? '').toLowerCase().includes(q) ||
          (f.media_type ?? '').toLowerCase().includes(q),
      );
    }
    if (filters.platform) list = list.filter((f) => f.platform === filters.platform);
    if (filters.status) list = list.filter((f) => f.status === filters.status);
    if (filters.mediaType) list = list.filter((f) => f.media_type === filters.mediaType);
    if (filters.hasCase === 'Sim') list = list.filter((f) => f.has_case);
    if (filters.hasCase === 'Não') list = list.filter((f) => !f.has_case);

    if (filters.sort === 'name') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      list = [...list].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }
    return list;
  }, [formats, filters]);

  const activeCount = Object.entries(filters).filter(([k, v]) => k !== 'sort' && v && (typeof v !== 'string' || v.trim() !== '')).length;

  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function clearAll() {
    setFilters(DEFAULT_FILTERS);
  }

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Catálogo de formatos</h1>
          <p className="mt-1 text-sm text-ink-500">
            {loading ? 'Carregando...' : `${filtered.length} de ${formats.length} formatos`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SortToggle value={filters.sort} onChange={(v) => set('sort', v)} />
        </div>
      </div>

      {/* Keyword search bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
        <input
          value={filters.keyword}
          onChange={(e) => set('keyword', e.target.value)}
          placeholder="Pesquisar por palavra-chave..."
          className="w-full rounded-2xl border border-ink-200 bg-white py-3.5 pl-12 pr-4 text-sm shadow-soft placeholder:text-ink-400 transition-all focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-soft">
        <div className="flex items-center gap-2 pr-1 text-sm font-semibold text-ink-700">
          <SlidersHorizontal className="w-4 h-4 text-brand-600" />
          Filtros
        </div>

        <FilterSelect label="Plataforma" value={filters.platform} options={PLATFORMS} onChange={(v) => set('platform', v)} />
        <FilterSelect label="Status" value={filters.status} options={STATUSES} onChange={(v) => set('status', v)} />
        <FilterSelect label="Tipo de mídia" value={filters.mediaType} options={mediaTypes} onChange={(v) => set('mediaType', v)} />
        <FilterSelect label="Possui case" value={filters.hasCase} options={CASE_OPTIONS} onChange={(v) => set('hasCase', v)} />

        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-ink-50 px-3 py-2 text-xs font-semibold text-ink-600 transition-colors hover:bg-ink-100"
          >
            <X className="w-3.5 h-3.5" />
            Limpar ({activeCount})
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.platform && <Chip label={`Plataforma: ${filters.platform}`} onClear={() => set('platform', null)} />}
          {filters.status && <Chip label={`Status: ${filters.status}`} onClear={() => set('status', null)} />}
          {filters.mediaType && <Chip label={`Mídia: ${filters.mediaType}`} onClear={() => set('mediaType', null)} />}
          {filters.hasCase && <Chip label={`Case: ${filters.hasCase}`} onClear={() => set('hasCase', null)} />}
          {filters.keyword && <Chip label={`Busca: "${filters.keyword}"`} onClear={() => set('keyword', '')} />}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <SkeletonGrid count={8} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((f, i) => (
            <FormatCard key={f.id} format={f} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string | null; options: string[]; onChange: (v: string | null) => void }) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-xs font-medium text-ink-400">{label}</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="rounded-lg border border-ink-200 bg-white py-1.5 pl-3 pr-7 text-sm text-ink-800 transition-colors focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
      >
        <option value="">Todos</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-100">
      {label}
      <button onClick={onClear} className="text-brand-400 hover:text-brand-700">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

function SortToggle({ value, onChange }: { value: 'recent' | 'name'; onChange: (v: 'recent' | 'name') => void }) {
  return (
    <div className="inline-flex rounded-xl border border-ink-200 bg-white p-1 shadow-soft">
      <button
        onClick={() => onChange('recent')}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${value === 'recent' ? 'bg-ink-900 text-white' : 'text-ink-500 hover:text-ink-800'}`}
      >
        Recentes
      </button>
      <button
        onClick={() => onChange('name')}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${value === 'name' ? 'bg-ink-900 text-white' : 'text-ink-500 hover:text-ink-800'}`}
      >
        A–Z
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-ink-200 bg-white py-20 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-ink-50 text-ink-300">
        <LayoutGrid className="w-8 h-8" />
      </div>
      <p className="mt-4 text-sm font-semibold text-ink-700">Nenhum formato encontrado</p>
      <p className="mt-1 text-xs text-ink-400">Tente ajustar os filtros ou a palavra-chave.</p>
    </div>
  );
}
