import { useState } from 'react';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';
import { LogoMark } from '@/components/Logo';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError('Informe o seu e-mail corporativo.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error: err } = await signInWithEmail(email);
    if (err) setError(err);
    setLoading(false);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-950 px-4 py-10">
      <div className="pointer-events-none absolute inset-0 gradient-brand opacity-90" />
      <div className="pointer-events-none absolute inset-0 gradient-mesh opacity-40" />
      <div className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-brand-400/30 blur-3xl animate-float" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-[28rem] w-[28rem] rounded-full bg-accent-500/20 blur-3xl animate-float" style={{ animationDelay: '1.2s' }} />

      <div className="relative w-full max-w-md animate-fade-in-scale">
        {/* Identidade institucional */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 grid h-18 w-18 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur p-4.5" style={{ width: '72px', height: '72px' }}>
            <LogoMark size={40} className="drop-shadow-lg" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Portal de Formatos Globo</h1>
          <p className="mt-1.5 text-sm text-white/70 font-medium">Gestão, organização e colaboração do time de Formatos</p>
        </div>

        {/* Cartão de acesso */}
        <div className="rounded-3xl bg-white/95 p-8 shadow-float backdrop-blur-xl ring-1 ring-white/20">
          <div className="mb-6 text-center">
            <h2 className="text-lg font-bold text-ink-900">Acessar o portal</h2>
            <p className="mt-1 text-sm text-ink-500">Use o seu e-mail corporativo para entrar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-600">E-mail corporativo</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.nome@g.globo"
                  autoComplete="email"
                  autoFocus
                  className="w-full rounded-xl border border-ink-200 bg-white py-3.5 pl-11 pr-4 text-sm text-ink-900 placeholder:text-ink-400 transition-all focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-error-50 px-4 py-3 text-sm font-medium text-error-700 ring-1 ring-error-100 animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white transition-all hover:bg-brand-700 hover:shadow-float disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {loading ? 'Verificando acesso...' : 'Entrar'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-ink-400">
            O acesso é liberado automaticamente para e-mails autorizados.
          </p>
        </div>

        {/* Rodapé institucional */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-white/40">
          <span className="h-1 w-1 rounded-full bg-white/30" />
          <span>Plataforma oficial do time de Formatos · Globo</span>
          <span className="h-1 w-1 rounded-full bg-white/30" />
        </div>
      </div>
    </div>
  );
}
