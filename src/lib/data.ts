import { supabase, type Format, type AdCase, type CaseInput, type CaseLink, type PortalUpdate, type TeamEvent, type FormatStats, type Notification, type Vacation, type VacationInput, type VacationStatus, type ApprovalStatus, type PlannerTask, type TaskInput, type TaskComment, type TaskActivity, type PortalUser } from './supabase';

export async function fetchFormats(): Promise<Format[]> {
  const { data, error } = await supabase
    .from('formats')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchFormatBySlug(slug: string): Promise<Format | null> {
  const { data, error } = await supabase
    .from('formats')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchFeaturedCases(limit = 6): Promise<AdCase[]> {
  const { data, error } = await supabase
    .from('cases')
    .select('*, format:formats(*)')
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchRecentCases(limit = 12): Promise<AdCase[]> {
  const { data, error } = await supabase
    .from('cases')
    .select('*, format:formats(*)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllCases(): Promise<AdCase[]> {
  const { data, error } = await supabase
    .from('cases')
    .select('*, format:formats(*)')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchCaseById(id: string): Promise<AdCase | null> {
  const { data, error } = await supabase
    .from('cases')
    .select('*, format:formats(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchRelatedCases(formatId: string, excludeId: string, limit = 3): Promise<AdCase[]> {
  const { data, error } = await supabase
    .from('cases')
    .select('*, format:formats(*)')
    .eq('format_id', formatId)
    .neq('id', excludeId)
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchCasesForFormat(formatId: string): Promise<AdCase[]> {
  const { data, error } = await supabase
    .from('cases')
    .select('*, format:formats(*)')
    .eq('format_id', formatId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchPortalUpdates(limit = 6): Promise<PortalUpdate[]> {
  const { data, error } = await supabase
    .from('portal_updates')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchTeamEvents(): Promise<TeamEvent[]> {
  const { data, error } = await supabase
    .from('team_events')
    .select('*')
    .order('event_date', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchStats(): Promise<FormatStats> {
  const [{ count: total }, { count: active }, casesRes] = await Promise.all([
    supabase.from('formats').select('*', { count: 'exact', head: true }),
    supabase.from('formats').select('*', { count: 'exact', head: true }).eq('status', 'Ativo'),
    supabase.from('cases').select('created_at').gte('created_at', startOfMonth()),
  ]);
  return {
    total: total ?? 0,
    active: active ?? 0,
    casesThisMonth: casesRes.data?.length ?? 0,
  };
}

function startOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days <= 0) return 'hoje';
  if (days === 1) return 'ontem';
  if (days < 7) return `há ${days} dias`;
  if (days < 30) return `há ${Math.floor(days / 7)} sem.`;
  return formatDate(iso);
}

/* ---------- Case CRUD ---------- */

export async function createCase(input: CaseInput): Promise<AdCase> {
  const { data, error } = await supabase.from('cases').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateCase(id: string, input: Partial<CaseInput>): Promise<AdCase> {
  const { data, error } = await supabase
    .from('cases')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCase(id: string): Promise<void> {
  const { error } = await supabase.from('cases').delete().eq('id', id);
  if (error) throw error;
}

/* ---------- Storage upload ---------- */

export async function uploadCaseImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const path = `case-images/${fileName}`;
  const { error } = await supabase.storage.from('cases').upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  const { data: pub } = supabase.storage.from('cases').getPublicUrl(path);
  return pub.publicUrl;
}

export function parseLinks(raw: string): CaseLink[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

/* ---------- Notifications ---------- */

export async function fetchNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead(): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('read', false);
  if (error) throw error;
}

/* ---------- Vacations ---------- */

export async function fetchVacations(): Promise<Vacation[]> {
  const { data, error } = await supabase
    .from('vacations')
    .select('*')
    .eq('approval_status', 'Aprovada')
    .order('start_date', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllVacations(): Promise<Vacation[]> {
  const { data, error } = await supabase
    .from('vacations')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchMyVacations(): Promise<Vacation[]> {
  const { data, error } = await supabase
    .from('vacations')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createVacation(input: VacationInput): Promise<Vacation> {
  const { data, error } = await supabase.from('vacations').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateVacation(id: string, input: VacationInput): Promise<Vacation> {
  const { data, error } = await supabase
    .from('vacations')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteVacation(id: string): Promise<void> {
  const { error } = await supabase.from('vacations').delete().eq('id', id);
  if (error) throw error;
}

export async function reviewVacation(id: string, status: ApprovalStatus, note?: string): Promise<Vacation> {
  const { data, error } = await supabase.rpc('review_vacation', { p_id: id, p_status: status, p_note: note ?? null });
  if (error) throw error;
  return data as Vacation;
}

export function vacationStatus(v: Vacation): VacationStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(v.start_date + 'T00:00:00');
  const end = new Date(v.end_date + 'T00:00:00');
  if (today < start) return 'Programadas';
  if (today > end) return 'Finalizadas';
  return 'Em andamento';
}

export function daysUntilVacation(v: Vacation): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(v.start_date + 'T00:00:00');
  return Math.round((start.getTime() - today.getTime()) / 86_400_000);
}

export function calcDays(start: string, end: string): number {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  return Math.round((e.getTime() - s.getTime()) / 86_400_000);
}

/* ---------- Planner Tasks ---------- */

export async function fetchTasks(): Promise<PlannerTask[]> {
  const { data, error } = await supabase
    .from('planner_tasks')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createTask(input: TaskInput): Promise<PlannerTask> {
  const { data, error } = await supabase.from('planner_tasks').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateTask(id: string, patch: Partial<TaskInput>): Promise<PlannerTask> {
  const { data, error } = await supabase
    .from('planner_tasks')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('planner_tasks').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchTaskComments(taskId: string): Promise<TaskComment[]> {
  const { data, error } = await supabase
    .from('planner_comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addTaskComment(taskId: string, body: string, mentions: string[]): Promise<TaskComment> {
  const { data, error } = await supabase
    .from('planner_comments')
    .insert({ task_id: taskId, body, mentions })
    .select()
    .single();
  if (error) throw error;
  if (mentions.length > 0) {
    await supabase.rpc('notify_task_mention', { p_task_id: taskId, p_body: body, p_emails: mentions });
  }
  return data;
}

export async function deleteTaskComment(id: string): Promise<void> {
  const { error } = await supabase.from('planner_comments').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchTaskActivity(taskId: string): Promise<TaskActivity[]> {
  const { data, error } = await supabase
    .from('planner_activity')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export function checklistProgress(task: PlannerTask): number {
  if (!task.checklist || task.checklist.length === 0) return 0;
  const done = task.checklist.filter((c) => c.done).length;
  return Math.round((done / task.checklist.length) * 100);
}

export function isTaskOverdue(task: PlannerTask): boolean {
  if (!task.due_date || task.bucket === 'Concluído') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(task.due_date + 'T00:00:00') < today;
}

export function daysUntilDue(task: PlannerTask): number | null {
  if (!task.due_date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(task.due_date + 'T00:00:00').getTime() - today.getTime()) / 86_400_000);
}

export function isTaskNearDue(task: PlannerTask): boolean {
  const d = daysUntilDue(task);
  return d !== null && d >= 0 && d <= 3 && task.bucket !== 'Concluído';
}

export async function fetchPortalUsers(): Promise<PortalUser[]> {
  const { data, error } = await supabase
    .from('portal_users')
    .select('*')
    .eq('status', 'active')
    .order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllPortalUsers(): Promise<PortalUser[]> {
  const { data, error } = await supabase
    .from('portal_users')
    .select('*')
    .order('name', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchPortalUserByEmail(email: string): Promise<PortalUser | null> {
  const { data, error } = await supabase
    .from('portal_users')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const fileName = `${userId}.${ext}`;
  const path = `${fileName}`;
  const { error } = await supabase.storage.from('avatars').upload(path, file, {
    contentType: file.type,
    upsert: true,
  });
  if (error) throw error;
  const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
  return pub.publicUrl;
}

export function userDisplayName(user: { name: string | null; email: string }): string {
  return user.name?.trim() || user.email;
}

export function userInitials(user: { name: string | null; email: string }): string {
  const name = user.name?.trim() || user.email.split('@')[0];
  return name.split(/[.\s]/).slice(0, 2).map((n) => n[0]?.toUpperCase() ?? '').join('');
}

/* ---------- Birthday utilities ---------- */

export function isBirthdayToday(birthday: string | null): boolean {
  if (!birthday) return false;
  const today = new Date();
  const bd = new Date(birthday + 'T00:00:00');
  return bd.getMonth() === today.getMonth() && bd.getDate() === today.getDate();
}

export function getBirthdayMonth(birthday: string | null): number | null {
  if (!birthday) return null;
  return new Date(birthday + 'T00:00:00').getMonth();
}

export function formatBirthday(birthday: string | null): string {
  if (!birthday) return '';
  const bd = new Date(birthday + 'T00:00:00');
  return bd.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
}

export function formatJoinDate(joinDate: string | null): string {
  if (!joinDate) return '';
  return new Date(joinDate + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
