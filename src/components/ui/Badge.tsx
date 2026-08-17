import type { ReactNode } from 'react';

const statusStyles: Record<string, string> = {
  Ativo: 'bg-success-50 text-success-700 ring-success-200',
  Inativo: 'bg-ink-100 text-ink-500 ring-ink-200',
  Rascunho: 'bg-warning-50 text-warning-700 ring-warning-200',
};

const platformStyles: Record<string, string> = {
  Digital: 'bg-brand-50 text-brand-700 ring-brand-200',
  'TV Aberta': 'bg-accent-50 text-accent-700 ring-accent-200',
  'TV Fechada': 'bg-accent-50 text-accent-700 ring-accent-200',
  Streaming: 'bg-success-50 text-success-700 ring-success-200',
};

interface BadgeProps {
  children: ReactNode;
  variant?: 'status' | 'platform' | 'media' | 'case' | 'default';
  value?: string;
  className?: string;
}

export default function Badge({ children, variant = 'default', value, className = '' }: BadgeProps) {
  let cls = 'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ';
  if (variant === 'status' && value) {
    cls += statusStyles[value] ?? 'bg-ink-100 text-ink-600 ring-ink-200';
  } else if (variant === 'platform' && value) {
    cls += platformStyles[value] ?? 'bg-ink-100 text-ink-600 ring-ink-200';
  } else if (variant === 'media') {
    cls += 'bg-brand-50 text-brand-600 ring-brand-100';
  } else if (variant === 'case') {
    cls += 'bg-success-50 text-success-700 ring-success-200';
  } else {
    cls += 'bg-ink-100 text-ink-600 ring-ink-200';
  }
  return <span className={`${cls} ${className}`}>{children}</span>;
}
