import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Sparkles, X, LogOut, Check, BookOpen, Star, RefreshCw, Cake } from 'lucide-react';
import { fetchFormats, fetchAllPortalUsers, isBirthdayToday, userDisplayName } from '@/lib/data';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/data';
import type { Format, Notification, PortalUser } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import Badge from './ui/Badge';
import Avatar from './ui/Avatar';

function notificationIcon(type: Notification['type']) {
  if (type === 'format') return <BookOpen className="w-4 h-4" />;
  if (type === 'case') return <Star className="w-4 h-4" />;
  return <RefreshCw className="w-4 h-4" />;
}

function notificationColor(type: Notification['type']) {
  if (type === 'format') return 'bg-brand-50 text-brand-600';
  if (type === 'case') return 'bg-accent-50 text-accent-600';
  return 'bg-ink-100 text-ink-600';
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  const mo = Math.floor(d / 30);
  return `${mo}mês`;
}

export default function TopBar() {
  const { email, isAdmin, signOut, profile } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Format[]>([]);
  const [open, setOpen] = useState(false);
  const [allFormats, setAllFormats] = useState<Format[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [birthdayUsers, setBirthdayUsers] = useState<PortalUser[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length + birthdayUsers.length;

  const loadNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch {
      // ignore
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFormats().then(setAllFormats).catch(() => {});
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    fetchAllPortalUsers()
      .then((users) => {
        const myEmail = email;
        setBirthdayUsers(
          users.filter(
            (u) => u.status === 'active' && isBirthdayToday(u.birthday) && u.email !== myEmail,
          ),
        );
      })
      .catch(() => {});
  }, [email]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    setResults(
      allFormats.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.description ?? '').toLowerCase().includes(q) ||
          (f.media_type ?? '').toLowerCase().includes(q) ||
          f.platform.toLowerCase().includes(q),
      ).slice(0, 6),
    );
  }, [query, allFormats]);

  function go(slug: string) {
    setOpen(false);
    setQuery('');
    navigate(`/formatos/${slug}`);
  }

  async function handleNotifClick(n: Notification) {
    if (!n.read) {
      try {
        await markNotificationRead(n.id);
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      } catch {
        // ignore
      }
    }
    if (n.type === 'format' && n.entity_slug) {
      setNotifOpen(false);
      navigate(`/formatos/${n.entity_slug}`);
    } else if (n.type === 'case' && n.entity_id) {
      setNotifOpen(false);
      navigate(`/cases/${n.entity_id}`);
    }
  }

  async function handleMarkAll() {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
    } catch {
      // ignore
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-ink-100 bg-white/80 px-6 backdrop-blur-xl">
      <div ref={boxRef} className="relative flex-1 max-w-xl">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Buscar formatos, cases, tipos de mídia..."
            className="w-full rounded-xl border border-ink-200 bg-ink-50/60 py-2.5 pl-10 pr-9 text-sm text-ink-900 placeholder:text-ink-400 transition-all focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {open && query && (
          <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-float animate-fade-in-scale">
            {results.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-ink-400">Nenhum formato encontrado para "{query}"</p>
            ) : (
              <ul className="max-h-80 overflow-y-auto py-1">
                {results.map((f) => (
                  <li key={f.id}>
                    <button
                      onClick={() => go(f.slug)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-ink-50"
                    >
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink-900">{f.name}</p>
                        <p className="truncate text-xs text-ink-400">{f.platform} · {f.media_type ?? 'Mídia'}</p>
                      </div>
                      <Badge variant="status" value={f.status}>{f.status}</Badge>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative grid h-10 w-10 place-items-center rounded-xl text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-900"
            aria-label="Notificações"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-float animate-fade-in-scale">
              <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
                <p className="text-sm font-bold text-ink-900">Notificações</p>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAll}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                  >
                    <Check className="w-3.5 h-3.5" /> Marcar todas como lidas
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {birthdayUsers.length > 0 && (
                  <div className="border-b border-ink-100">
                    {birthdayUsers.map((u) => (
                      <div
                        key={`bday-${u.id}`}
                        className="flex items-start gap-3 px-4 py-3 bg-accent-50/40"
                      >
                        <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-100 text-accent-600">
                          <Cake className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-ink-900 leading-snug">
                            Hoje é aniversário de {userDisplayName(u)}!
                          </p>
                          <p className="mt-0.5 text-xs text-ink-500 leading-relaxed">
                            Vamos desejar feliz aniversário!
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {notifLoading && notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-ink-400">Carregando...</p>
                ) : notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-ink-400">Nenhuma notificação no momento</p>
                ) : (
                  <ul className="py-1">
                    {notifications.map((n) => (
                      <li key={n.id}>
                        <button
                          onClick={() => handleNotifClick(n)}
                          className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-ink-50 ${!n.read ? 'bg-brand-50/40' : ''}`}
                        >
                          <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${notificationColor(n.type)}`}>
                            {notificationIcon(n.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-ink-900 leading-snug">{n.title}</p>
                            {n.body && <p className="mt-0.5 text-xs text-ink-500 line-clamp-2 leading-relaxed">{n.body}</p>}
                            <p className="mt-1 text-[11px] text-ink-400">{timeAgo(n.created_at)}</p>
                          </div>
                          {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent-500" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white px-3 py-1.5 shadow-soft">
          {profile ? (
            <Avatar user={profile} size="sm" />
          ) : (
            <div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white ${isAdmin ? 'bg-gradient-to-br from-brand-500 to-brand-700' : 'bg-gradient-to-br from-ink-400 to-ink-600'}`}>
              {initials(email)}
            </div>
          )}
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-ink-900 leading-tight">{profile?.name?.trim() || email}</p>
            <p className="text-[10px] text-ink-400 leading-tight">{isAdmin ? 'Administrador' : 'Usuário'}</p>
          </div>
          <button onClick={() => signOut()} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-400 transition-colors hover:bg-error-50 hover:text-error-600" aria-label="Sair">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

function initials(email: string | null): string {
  if (!email) return '?';
  const name = email.split('@')[0];
  return name.split('.').slice(0, 2).map((n) => n[0]?.toUpperCase() ?? '').join('');
}
