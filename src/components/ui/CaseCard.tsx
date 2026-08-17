import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2, Star, Calendar } from 'lucide-react';
import type { AdCase } from '@/lib/supabase';
import Badge from '@/components/ui/Badge';
import { relativeDate } from '@/lib/data';

interface CaseCardProps {
  item: AdCase;
  index?: number;
  canManage?: boolean;
  onView?: (id: string) => void;
  onEdit: (item: AdCase) => void;
  onDelete: (item: AdCase) => void;
}

export default function CaseCard({ item, index = 0, canManage = true, onEdit, onDelete }: CaseCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/cases/${item.id}`)}
      className="card-surface hover-lift group overflow-hidden animate-slide-up cursor-pointer"
      style={{ animationDelay: `${Math.min(index * 60, 480)}ms` }}
    >
      <div className="relative h-44 overflow-hidden">
        {item.image_url ? (
          <img src={item.image_url} alt={item.format?.name ?? 'Case'} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="h-full w-full gradient-mesh" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-ink-900/10 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant="status" value={item.status}>{item.status}</Badge>
          {item.featured && <Badge variant="case"><Star className="w-3 h-3" /> Destaque</Badge>}
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-white text-sm font-semibold drop-shadow line-clamp-1">{item.format?.name ?? 'Case'}</p>
          {item.client && <p className="text-white/70 text-xs">{item.client}</p>}
        </div>
      </div>

      <div className="p-4">
        <p className="mt-1 text-sm text-ink-500 line-clamp-2 leading-relaxed">{item.description}</p>

        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-ink-400">
          <Calendar className="w-3 h-3" />
          {relativeDate(item.updated_at)}
        </div>

        {canManage && (
          <div className="mt-3 flex items-center gap-2 border-t border-ink-100 pt-3" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onEdit(item)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-50 py-2 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100"
            >
              <Pencil className="w-3.5 h-3.5" /> Editar
            </button>
            <button
              onClick={() => onDelete(item)}
              className="grid place-items-center rounded-lg bg-error-50 py-2 px-2.5 text-error-600 transition-colors hover:bg-error-100"
              aria-label="Excluir case"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
