import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Clock, Bell } from 'lucide-react';
import { LogoMark } from '@/components/Logo';
import type { ReactNode } from 'react';

interface MaintenancePageProps {
  title: string;
  subtitle?: string;
  description?: string;
  features?: { icon: ReactNode; title: string; description: string }[];
  availableDate?: string;
  backLink?: { to: string; label: string };
}

export default function MaintenancePage({
  title,
  subtitle = 'Em breve',
  description,
  features,
  availableDate,
  backLink,
}: MaintenancePageProps) {
  const defaultFeatures = [
    {
      icon: <Sparkles className="w-5 h-5 text-brand-500" />,
      title: 'Conteúdo curado',
      description: 'Informações organizadas e verificadas pelo time de formatos.',
    },
    {
      icon: <LogoMark size={20} />,
      title: 'Estrutura completa',
      description: 'Listagens, filtros e detalhes pensados para o dia a dia do time.',
    },
    {
      icon: <Clock className="w-5 h-5 text-success-500" />,
      title: 'Atualização contínua',
      description: 'Novos registros adicionados conforme as campanhas acontecem.',
    },
  ];

  return (
    <div className="relative min-h-[70vh] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 gradient-mesh opacity-70" />
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl animate-float" />
      <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-accent-200/30 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

      <div className="relative mx-auto max-w-3xl px-6 py-16 text-center animate-fade-in">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-float ring-1 ring-ink-100">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl">
            <LogoMark size={36} />
          </div>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-100 backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
          </span>
          {subtitle}
        </span>

        <h1 className="mt-5 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl text-balance">{title}</h1>

        <p className="mx-auto mt-4 max-w-xl text-ink-500 leading-relaxed text-balance">
          {description ??
            'Estamos trabalhando nesta seção para oferecer a melhor experiência. Em breve você encontrará aqui um conteúdo completo, organizado e útil para o seu dia a dia.'}
        </p>

        {availableDate && (
          <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/80 px-4 py-2 text-sm font-medium text-ink-600 ring-1 ring-ink-100 backdrop-blur">
            <Clock className="w-4 h-4 text-brand-500" />
            Previsão de lançamento: <span className="font-semibold text-ink-900">{availableDate}</span>
          </div>
        )}

        <div className="mt-12 grid gap-4 sm:grid-cols-3 text-left">
          {(features ?? defaultFeatures).map((f, i) => (
            <div
              key={i}
              className="card-surface hover-lift p-5 animate-slide-up"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-ink-50 ring-1 ring-ink-100">
                {f.icon}
              </div>
              <h3 className="text-sm font-semibold text-ink-900">{f.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-500">{f.description}</p>
            </div>
          ))}
        </div>

        {backLink && (
          <Link
            to={backLink.to}
            className="mt-10 inline-flex items-center gap-2 rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-ink-800 hover:shadow-float"
          >
            {backLink.label}
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}

        <div className="mt-10 inline-flex items-center gap-2 text-xs text-ink-400">
          <Bell className="w-3.5 h-3.5" />
          Avisaremos o time quando esta seção estiver disponível.
        </div>
      </div>
    </div>
  );
}
