import { useEffect, useState, useRef } from 'react';
import { X, PartyPopper } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { fetchAllPortalUsers, isBirthdayToday, userDisplayName } from '@/lib/data';

/**
 * Shows confetti + birthday message ONLY for the logged-in user
 * when today is their birthday. Other users never see this.
 */
export default function BirthdayCelebration() {
  const { profile, email } = useAuth();
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!profile) return;
    if (!isBirthdayToday(profile.birthday)) return;
    if (!email || profile.email !== email) return;

    setName(userDisplayName(profile));
    setShow(true);
  }, [profile, email]);

  // Confetti animation
  useEffect(() => {
    if (!show) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#1668e0', '#10b981', '#2f86f6', '#f59e0b', '#ef4444', '#ec4899'];
    const particles: Particle[] = [];

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      rotation: number;
      vr: number;
      shape: 'rect' | 'circle';
      life: number;
    }

    // Spawn initial burst from top center
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height / 3,
        vx: (Math.random() - 0.5) * 10,
        vy: Math.random() * 6 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 4,
        rotation: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.3,
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
        life: 1,
      });
    }

    let lastTime = performance.now();

    function animate(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = 0;
      for (const p of particles) {
        if (p.life <= 0) continue;
        alive++;

        p.vy += 0.3;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vr;
        p.life -= dt * 0.15;

        if (p.y > canvas.height + 50) {
          p.life = 0;
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (alive > 0) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setShow(false);
      }
    }

    animationRef.current = requestAnimationFrame(animate);

    function handleResize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [show]);

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]">
      <canvas ref={canvasRef} className="absolute inset-0" />

      <div className="pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-fade-in-scale">
        <div className="relative rounded-3xl bg-white p-8 text-center shadow-float ring-1 ring-ink-100">
          <button
            onClick={() => setShow(false)}
            className="absolute right-4 top-4 text-ink-300 transition-colors hover:text-ink-600"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 text-white shadow-glow">
            <PartyPopper className="w-8 h-8" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            Feliz aniversário, {name.split(' ')[0]}!
          </h1>
          <p className="mt-2 text-sm text-ink-500 leading-relaxed max-w-xs">
            O time de Formatos deseja um dia maravilhoso cheio de alegria e conquistas. Que este novo ciclo seja incrível!
          </p>

          <button
            onClick={() => setShow(false)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Obrigado!
          </button>
        </div>
      </div>
    </div>
  );
}
