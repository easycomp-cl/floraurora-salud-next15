export type AdminRole = "admin" | "professional" | "patient";

export type AdminUserStatus = "active" | "inactive" | "blocked" | "pending";

export interface AdminUser {
  id: number;
  user_id: string;
  name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  role: AdminRole;
  role_id: number;
  is_active: boolean;
  status: AdminUserStatus;
  blocked_until: string | null;
  blocked_reason: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface AdminUserFilters {
  search?: string;
  role?: AdminRole | "all";
  status?: AdminUserStatus | "all";
  page?: number;
  pageSize?: number;
}

export interface AdminUserListResponse {
  data: AdminUser[];
  page: number;
  pageSize: number;
  total: number;
}

export interface CreateAdminUserPayload {
  email: string;
  password: string;
  name?: string;
  last_name?: string;
  phone_number?: string;
  rut?: string;
  role: AdminRole;
}

export interface UpdateAdminUserPayload {
  name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  rut?: string | null;
  is_active?: boolean;
  status?: AdminUserStatus;
  blocked_until?: string | null;
  blocked_reason?: string | null;
}

export interface AdminProfessional {
  id: number;
  user_id: string;
  name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  is_active: boolean;
  title_id: number | null;
  title_name: string | null;
  profile_description: string | null;
  resume_url: string | null;
  specialties: string[];
  services: AdminServiceSummary[];
}

export interface AdminServiceSummary {
  id: number;
  name: string;
  minimum_amount: number | null;
  maximum_amount: number | null;
  duration_minutes: number;
  is_active: boolean;
}

export interface AdminServicePayload {
  name: string;
  slug?: string;
  description?: string;
  minimum_amount?: number | null;
  maximum_amount?: number | null;
  duration_minutes?: number;
  is_active?: boolean;
  title_id?: number | null;
  title_name?: string | null;
}

export interface AdminService extends AdminServicePayload {
  id: number;
  title_id?: number | null;
  title_name?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface AdminServicesResponse {
  data: AdminService[];
  total: number;
}

export interface AssignProfessionalPayload {
  professionalId: number;
  serviceIds: number[];
}

