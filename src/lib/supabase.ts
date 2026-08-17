import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export type Platform = 'Digital' | 'TV Aberta' | 'TV Fechada' | 'Streaming';
export type Status = 'Ativo' | 'Inativo' | 'Rascunho';

export interface Format {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  platform: Platform | string;
  status: Status | string;
  media_type: string | null;
  has_case: boolean;
  thumbnail_url: string | null;
  updated_at: string;
  created_at: string;
}

export interface CaseLink {
  label: string;
  url: string;
}

export interface AdCase {
  id: string;
  title: string;
  format_id: string | null;
  client: string | null;
  description: string | null;
  image_url: string | null;
  featured: boolean;
  platform: string | null;
  status: Status | string;
  publication_date: string | null;
  gallery_images: string[];
  videos: string[];
  links: CaseLink[];
  updated_at: string;
  created_at: string;
  format?: Format | null;
}

export type CaseInput = Omit<AdCase, 'id' | 'created_at' | 'updated_at' | 'format'>;

export interface PortalUpdate {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
}

export interface TeamEvent {
  id: string;
  type: 'vacation' | 'birthday' | 'planner';
  person: string;
  event_date: string | null;
  description: string | null;
}

export interface FormatStats {
  total: number;
  active: number;
  casesThisMonth: number;
}

export type PortalRole = 'admin' | 'common';
export type PortalUserStatus = 'active' | 'inactive';

export interface PortalUser {
  id: string;
  email: string;
  name: string | null;
  role: PortalRole;
  status: PortalUserStatus;
  photo_url: string | null;
  job_title: string | null;
  area: string | null;
  join_date: string | null;
  birthday: string | null;
  created_at: string;
  updated_at: string;
}

export type NotificationType = 'format' | 'case' | 'update' | 'vacation';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  entity_id: string | null;
  entity_slug: string | null;
  target_user_id: string | null;
  read: boolean;
  created_at: string;
}

export type ApprovalStatus = 'Pendente' | 'Aprovada' | 'Recusada';

export interface Vacation {
  id: string;
  employee_name: string;
  start_date: string;
  end_date: string;
  days: number;
  notes: string | null;
  created_by: string | null;
  approval_status: ApprovalStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
}

export type VacationInput = Omit<Vacation, 'id' | 'created_by' | 'created_at' | 'updated_at' | 'approval_status' | 'reviewed_by' | 'reviewed_at' | 'review_note'>;

export type VacationStatus = 'Programadas' | 'Em andamento' | 'Finalizadas';

/* ---------- Planner ---------- */

export type TaskBucket = 'A Fazer' | 'Em Andamento' | 'Em Revisão' | 'Concluído';
export type TaskPriority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';
export type TaskRecurrence = 'daily' | 'weekly' | 'monthly';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface TaskAttachment {
  id: string;
  type: 'link' | 'document' | 'image' | 'video';
  label: string;
  url: string;
}

export interface PlannerTask {
  id: string;
  title: string;
  description: string | null;
  bucket: TaskBucket;
  priority: TaskPriority;
  assignee: string | null;
  start_date: string | null;
  due_date: string | null;
  labels: string[];
  checklist: ChecklistItem[];
  attachments: TaskAttachment[];
  recurrence: TaskRecurrence | null;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskInput = Omit<PlannerTask, 'id' | 'created_by' | 'created_at' | 'updated_at'>;

export interface TaskComment {
  id: string;
  task_id: string;
  author: string;
  body: string;
  mentions: string[];
  created_at: string;
}

export interface TaskActivity {
  id: string;
  task_id: string;
  actor: string;
  action: string;
  created_at: string;
}
