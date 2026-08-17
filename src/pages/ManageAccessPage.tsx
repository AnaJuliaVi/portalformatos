import { useEffect, useState } from 'react';
import { UserPlus, Pencil, Trash2, ShieldCheck, User as UserIcon, Search, X, Power } from 'lucide-react';
import { supabase, type PortalUser, type PortalRole } from '@/lib/supabase';
import { formatDate } from '@/lib/data';
import Badge from '@/components/ui/Badge';
import { SkeletonBox } from '@/components/ui/Skeleton';
import UserFormModal from '@/components/UserFormModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Avatar from '@/components/ui/Avatar';

export default function ManageAccessPage() {
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PortalUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PortalUser | null>(null);
  const [toggleTarget, setToggleTarget] = useState<PortalUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    const { data, error } = await supabase.from('portal_users').select('*').order('created_at', { ascending: false });
    if (!error && data) setUsers(data);
    setLoading(false);
  }

  const filtered = keyword.trim()
    ? users.filter((u) => u.email.toLowerCase().includes(keyword.toLowerCase()))
    : users;

  function openAdd() {
    setEditTarget(null);
    setFormOpen(true);
  }
  function openEdit(user: PortalUser) {
    setEditTarget(user);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setActionLoading(true);
    const { error } = await supabase.from('portal_users').delete().eq('id', deleteTarget.id);
    if (!error) setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    setDeleteTarget(null);
    setActionLoading(false);
  }

  async function confirmToggle() {
    if (!toggleTarget) return;
    setActionLoading(true);
    const newStatus = toggleTarget.status === 'active' ? 'inactive' : 'active';
    const { data, error } = await supabase
      .from('portal_users')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', toggleTarget.id)
      .select()
      .single();
    if (!error && data) {
      setUsers((prev) => prev.map((u) => (u.id === data.id ? data : u)));
    }
    setToggleTarget(null);
    setActionLoading(false);
  }

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Gerenciar acessos</h1>
          <p className="mt-1 text-sm text-ink-500">
            {loading ? 'Carregando...' : `${filtered.length} usuário(s) autorizado(s)`}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-all hover:bg-brand-700 hover:shadow-float hover:-translate-y-0.5"
        >
          <UserPlus className="w-4 h-4" /> Adicionar usuário
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Buscar por e-mail..."
          className="w-full rounded-2xl border border-ink-200 bg-white py-3.5 pl-12 pr-4 text-sm shadow-soft placeholder:text-ink-400 transition-all focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
        />
        {keyword && (
          <button onClick={() => setKeyword('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
        {loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonBox key={i} className="h-14 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ink-50 text-ink-300">
              <UserIcon className="w-7 h-7" />
            </div>
            <p className="mt-4 text-sm font-semibold text-ink-700">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/50 text-left">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-ink-400">E-mail</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Tipo de acesso</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Cadastro</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-ink-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {filtered.map((u, i) => {
                  return (
                    <tr key={u.id} className="group transition-colors hover:bg-ink-50/40 animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar user={u} size="sm" />
                          <div>
                            <span className="text-sm font-medium text-ink-900">{u.name || u.email}</span>
                            {u.name && <span className="block text-xs text-ink-400">{u.email}</span>}
                            {u.job_title && <span className="block text-xs text-ink-400">{u.job_title}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-brand-100">
                            <ShieldCheck className="w-3 h-3" /> Administrador
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-medium text-ink-600 ring-1 ring-ink-200">
                            <UserIcon className="w-3 h-3" /> Usuário Comum
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="status" value={u.status === 'active' ? 'Ativo' : 'Inativo'}>
                          {u.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-sm text-ink-500">{formatDate(u.created_at)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(u)}
                            className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-700 transition-colors hover:bg-brand-100"
                            aria-label="Editar usuário"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setToggleTarget(u)}
                            className="grid h-8 w-8 place-items-center rounded-lg bg-warning-50 text-warning-700 transition-colors hover:bg-warning-100"
                            aria-label="Ativar/desativar"
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(u)}
                            className="grid h-8 w-8 place-items-center rounded-lg bg-error-50 text-error-600 transition-colors hover:bg-error-100"
                            aria-label="Remover usuário"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UserFormModal open={formOpen} user={editTarget} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); loadUsers(); }} />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Remover usuário"
        message={`Tem certeza que deseja remover o acesso de "${deleteTarget?.email}"? Esta ação não poderá ser desfeita.`}
        confirmLabel="Remover"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <ConfirmDialog
        open={!!toggleTarget}
        title={toggleTarget?.status === 'active' ? 'Desativar acesso' : 'Ativar acesso'}
        message={`Deseja ${toggleTarget?.status === 'active' ? 'desativar' : 'ativar'} o acesso de "${toggleTarget?.email}"?`}
        confirmLabel={toggleTarget?.status === 'active' ? 'Desativar' : 'Ativar'}
        onConfirm={confirmToggle}
        onCancel={() => setToggleTarget(null)}
      />
    </div>
  );
}
