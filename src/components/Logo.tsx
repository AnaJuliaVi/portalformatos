interface LogoProps {
  className?: string;
  size?: number;
  monochrome?: boolean;
}

/**
 * Portal de Formatos — logo símbolo.
 * Quatro módulos geométricos interconectados representando
 * diferentes formatos de mídia que se conectam em um mesmo portal.
 * Usa a paleta brand/success/accent do site.
 */
export function LogoMark({ className, size = 40, monochrome = false }: LogoProps) {
  const c1 = monochrome ? 'currentColor' : '#163e77';
  const c2 = monochrome ? 'currentColor' : '#1668e0';
  const c3 = monochrome ? 'currentColor' : '#2f86f6';
  const c4 = monochrome ? 'currentColor' : '#10b981';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      role="img"
      aria-label="Portal de Formatos"
    >
      {/* Tile base — módulo maior, canto inferior esquerdo */}
      <rect x="6" y="26" width="16" height="16" rx="4" fill={c1} />
      {/* Tile vertical — módulo alto, centro-esquerda */}
      <rect x="13" y="6" width="12" height="16" rx="4" fill={c2} />
      {/* Tile horizontal — módulo largo, topo direita */}
      <rect x="26" y="6" width="16" height="11" rx="4" fill={c3} />
      {/* Tile acento — módulo menor, canto inferior direito */}
      <rect x="26" y="21" width="16" height="16" rx="4" fill={c4} fillOpacity={monochrome ? 0.5 : 0.85} />
      {/* Conector — linha sutil entre os módulos */}
      <path d="M19 22 L19 26" stroke={c2} strokeWidth="2.5" strokeLinecap="round" opacity={monochrome ? 0 : 0.4} />
      <path d="M25 12 L26 12" stroke={c3} strokeWidth="2.5" strokeLinecap="round" opacity={monochrome ? 0 : 0.4} />
    </svg>
  );
}

interface LogoFullProps {
  className?: string;
  size?: number;
}

/**
 * Versão completa: símbolo + nome "Portal de Formatos"
 */
export function LogoFull({ className, size = 40 }: LogoFullProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ''}`}>
      <LogoMark size={size} />
      <div className="leading-tight">
        <p className="text-sm font-bold text-ink-900">Portal de Formatos</p>
        <p className="text-[11px] text-ink-400">Globo</p>
      </div>
    </div>
  );
}

export default LogoMark;
