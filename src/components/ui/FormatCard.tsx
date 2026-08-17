import { Link } from 'react-router-dom';
import { ArrowUpRight, PlayCircle, Image as ImageIcon, LayoutGrid, Sparkles, Monitor, Tv } from 'lucide-react';
import type { Format } from '@/lib/supabase';
import Badge from './Badge';

function mediaIcon(media: string | null) {
  if (!media) return <LayoutGrid className="w-3 h-3" />;
  const m = media.toLowerCase();
  if (m.includes('vídeo') || m.includes('video')) return <PlayCircle className="w-3 h-3" />;
  if (m.includes('native')) return <Sparkles className="w-3 h-3" />;
  if (m.includes('display')) return <LayoutGrid className="w-3 h-3" />;
  return <ImageIcon className="w-3 h-3" />;
}

function platformGlyph(platform: string) {
  if (platform === 'Streaming') return <Monitor className="w-3 h-3" />;
  if (platform.startsWith('TV')) return <Tv className="w-3 h-3" />;
  return <LayoutGrid className="w-3 h-3" />;
}

export default function FormatCard({ format, index = 0 }: { format: Format; index?: number }) {
  return (
    <Link
      to={`/formatos/${format.slug}`}
      className="card-surface hover-lift group overflow-hidden animate-slide-up"
      style={{ animationDelay: `${Math.min(index * 60, 480)}ms` }}
    >
      <div className="relative h-40 overflow-hidden">
        {format.thumbnail_url ? (
          <img
            src={format.thumbnail_url}
            alt={format.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full gradient-mesh" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-ink-900/10 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant="status" value={format.status}>{format.status}</Badge>
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <span className="text-white text-sm font-semibold drop-shadow">{format.name}</span>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-white/20 text-white opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100">
            <ArrowUpRight className="w-4 h-4" />
          </span>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-sm text-ink-500 line-clamp-2 leading-relaxed">{format.description}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="platform" value={format.platform}>
            {platformGlyph(format.platform)}
            {format.platform}
          </Badge>
          {format.media_type && (
            <Badge variant="media">
              {mediaIcon(format.media_type)}
              {format.media_type}
            </Badge>
          )}
          {format.has_case && <Badge variant="case">Case</Badge>}
        </div>
      </div>
    </Link>
  );
}
