import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LogoMark } from '@/components/Logo';

export default function NotFoundPage() {
  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute inset-0 gradient-mesh opacity-60" />
      <div className="pointer-events-none absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl animate-float" />

      <div className="relative text-center animate-fade-in">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-white shadow-float ring-1 ring-ink-100">
          <div className="grid h-16 w-16 place-items-center rounded-2xl">
            <LogoMark size={36} />
          </div>
        </div>
        <p className="text-6xl font-bold tracking-tight text-ink-900">404</p>
        <h1 className="mt-3 text-xl font-semibold text-ink-800">Página não encontrada</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
          A página que você procura pode ter sido movida ou não existe mais no portal.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-ink-800 hover:shadow-float"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
