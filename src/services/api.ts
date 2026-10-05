import {
  Grievance,
  Department,
  Officer,
  NotificationItem,
  AuditLog,
  AIAnalysisResponse,
  DuplicateMatch,
  GrievanceStatus,
  GrievancePriority,
} from '../types';
import { auth } from '../lib/firebase';
import type { User } from 'firebase/auth';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

async function authHeaders() {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

async function jsonFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = { ...(await authHeaders()), ...(init.headers || {}) };
  return fetch(input, { ...init, headers });
}

/** Calls the authenticated backend API and surfaces its error message to the existing toast UI. */
async function request<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await jsonFetch(apiUrl(path), {
    method: init.method ?? 'GET',
    ...(init.body !== undefined
      ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(init.body) }
      : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed.' }));
    throw new Error(typeof err?.error === 'string' ? err.error : 'Request failed.');
  }
  return res.json() as Promise<T>;
}

/** Admin status is decided by the backend (admins table + verified email). */
async function fetchIsAdmin(user: User | null): Promise<boolean> {
  if (!user || user.isAnonymous || !user.emailVerified) return false;
  const result = await request<{ isAdmin: boolean }>('/api/me/admin');
  return result.isAdmin === true;
}

export const api = {
  async checkAdminAccess(): Promise<boolean> {
    return fetchIsAdmin(auth.currentUser);
  },

  async analyzeComplaint(text: string, languageHint?: string): Promise<AIAnalysisResponse> {
    const res = await jsonFetch(apiUrl('/api/ai/analyze-complaint'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, languageHint }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to analyze' }));
      throw new Error(err.error || 'AI Analysis failed');
    }
    return res.json();
  },

  async checkDuplicates(text: string, category: string, district?: string): Promise<DuplicateMatch[]> {
    try {
      const res = await jsonFetch(apiUrl('/api/ai/check-duplicates'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, category, district }),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.duplicates || [];
    } catch {
      return [];
    }
  },

  async suggestResolution(grievanceId: string, actionTaken?: string) {
    const res = await jsonFetch(apiUrl('/api/ai/suggest-resolution'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grievanceId, actionTaken }),
    });
    if (!res.ok) throw new Error('Failed to generate resolution');
    return res.json();
  },

  async getComplaints(params?: {
    search?: string; category?: string; status?: string; priority?: string;
    departmentId?: string; officerId?: string;
  }): Promise<Grievance[]> {
    const user = auth.currentUser;
    if (!user) return [];
    // The backend returns every grievance for administrators and only the caller's own otherwise.
    let results = await request<Grievance[]>('/api/grievances');

    if (params) {
      if (params.category) results = results.filter(r => r.category === params.category);
      if (params.status) results = results.filter(r => r.status === params.status);
      if (params.priority) results = results.filter(r => r.priority === params.priority);
      if (params.departmentId) results = results.filter(r => r.departmentId === params.departmentId);
      if (params.officerId) results = results.filter(r => r.assignedOfficerId === params.officerId);
      if (params.search) {
        const search = params.search.toLowerCase();
        results = results.filter(r =>
          r.trackId?.toLowerCase().includes(search) ||
          r.citizenName?.toLowerCase().includes(search) ||
          r.summaryEn?.toLowerCase().includes(search)
        );
      }
    }
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getComplaintById(id: string): Promise<Grievance> {
    const user = auth.currentUser;
    if (!user) throw new Error('Authentication session is not ready.');
    return request<Grievance>(`/api/grievances/${encodeURIComponent(id)}`);
  },

  async createComplaint(data: Partial<Grievance>): Promise<Grievance> {
    const user = auth.currentUser;
    if (!user) throw new Error('Authentication session is not ready.');
    if (user.isAnonymous || (!user.phoneNumber && !user.emailVerified)) {
      throw new Error('Verify your phone number or email before submitting a grievance.');
    }
    // The backend assigns the tracking ID, citizen identity, status and timestamps.
    return request<Grievance>('/api/grievances', { method: 'POST', body: data });
  },

  async updateComplaintStatus(id: string, payload: {
    status: GrievanceStatus; remarks: string; updatedBy: string;
    role: 'CITIZEN' | 'OFFICER' | 'ADMIN'; evidenceUrl?: string;
  }): Promise<Grievance> {
    return request<Grievance>(`/api/grievances/${encodeURIComponent(id)}/status`, {
      method: 'POST',
      body: payload,
    });
  },

  async assignOfficer(id: string, officerId: string, adminName?: string): Promise<Grievance> {
    return request<Grievance>(`/api/grievances/${encodeURIComponent(id)}/assign`, {
      method: 'POST',
      body: { officerId, adminName },
    });
  },

  async verifyResolution(id: string, confirmed: boolean) {
    return request<{ ok: boolean; verified: boolean; status: GrievanceStatus; updatedAt: string }>(
      `/api/grievances/${encodeURIComponent(id)}/verify-resolution`,
      { method: 'POST', body: { confirmed } }
    );
  },

  async submitFeedback(id: string, payload: { rating: number; comment: string; isResolvedSatisfied: boolean }) {
    return request<Grievance>(`/api/grievances/${encodeURIComponent(id)}/feedback`, {
      method: 'POST',
      body: payload,
    });
  },

  async addAuditLog(action: string, details: string, grievanceId?: string) {
    const user = auth.currentUser;
    if (!user || user.isAnonymous) return;
    await request<{ ok: boolean }>('/api/admin/audit-logs', {
      method: 'POST',
      body: { action, details: details.slice(0, 2000), grievanceId },
    });
  },

  async getDepartments(): Promise<Department[]> {
    const user = auth.currentUser;
    if (!user || user.isAnonymous || !user.emailVerified) throw new Error('Admin authentication required.');
    return request<Department[]>('/api/admin/departments');
  },

  async getOfficers(): Promise<Officer[]> {
    const user = auth.currentUser;
    if (!user || user.isAnonymous || !user.emailVerified) throw new Error('Admin authentication required.');
    return request<Officer[]>('/api/admin/officers');
  },

  async getOfficerProfile() {
    return request<{
      id: string; name: string; nameTamil?: string | null; departmentId: string;
      departmentName: string; designation: string; phone: string; email: string; zone: string;
    }>('/api/officer/me');
  },

  async getOfficerGrievances(): Promise<Grievance[]> {
    const rows = await request<any[]>('/api/officer/grievances');
    return rows.map((row) => ({
      id: row.id,
      trackId: row.track_id,
      citizenName: row.citizen_name,
      citizenPhone: row.citizen_phone,
      citizenEmail: row.citizen_email || undefined,
      language: row.language,
      originalTranscript: row.original_transcript,
      summaryEn: row.summary_en,
      summaryTa: row.summary_ta,
      category: row.category,
      departmentId: row.department_id || '',
      departmentName: row.department_name,
      priority: row.priority,
      priorityReason: row.priority_reason,
      confidenceScore: Number(row.confidence_score || 0),
      location: {
        address: row.location_address,
        district: row.location_district,
        landmark: row.location_landmark || undefined,
        constituency: row.location_constituency || undefined,
        wardNumber: row.location_ward_number || undefined,
        pincode: row.location_pincode || undefined,
        lat: row.location_lat ?? undefined,
        lng: row.location_lng ?? undefined,
      },
      attachments: (row.grievance_attachments || []).map((a: any) => ({
        id: a.attachment_id, url: a.url, name: a.name, type: a.type, uploadedAt: a.uploaded_at,
      })),
      status: row.status,
      assignedOfficerId: row.assigned_officer_id || undefined,
      assignedOfficerName: row.assigned_officer_name || undefined,
      assignedOfficerPhone: row.assigned_officer_phone || undefined,
      assignedAt: row.assigned_at || undefined,
      targetResolutionDate: row.target_resolution_date || row.created_at,
      estimatedDays: row.estimated_days ?? undefined,
      resolvedAt: row.resolved_at || undefined,
      resolutionRemarks: row.resolution_remarks || undefined,
      resolutionEvidenceUrl: row.resolution_evidence_url || undefined,
      statusHistory: (row.grievance_status_history || []).map((h: any) => ({
        status: h.status, timestamp: h.occurred_at, updatedBy: h.updated_by, role: h.role, remarks: h.remarks,
        evidenceUrl: h.evidence_url || undefined,
      })),
      entities: row.entities || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isDuplicateOf: row.is_duplicate_of || undefined,
      resolutionVerifiedAt: row.resolution_verified_at || undefined,
      resolutionVerifiedBy: row.resolution_verified_by || undefined,
      escalationReason: row.escalation_reason || undefined,
      escalatedAt: row.escalated_at || undefined,
      escalatedToDepartmentId: row.escalated_to_department_id || undefined,
    })) as Grievance[];
  },

  async updateOfficerStatus(id: string, payload: {
    status: GrievanceStatus; remarks: string; evidenceUrl?: string;
  }) {
    return request<{ ok: boolean; grievanceId: string; status: GrievanceStatus; updatedBy: string; updatedAt: string }>(
      `/api/officer/grievances/${encodeURIComponent(id)}/status`, { method: 'POST', body: payload }
    );
  },

  async escalateOfficerGrievance(id: string, toDepartmentId: string, reason: string) {
    return request<{ ok: boolean; grievanceId: string; status: GrievanceStatus; escalatedToDepartmentId: string; escalatedAt: string }>(
      `/api/officer/grievances/${encodeURIComponent(id)}/escalate`,
      { method: 'POST', body: { toDepartmentId, reason } }
    );
  },

  async getPublicTransparency() {
    return request<{
      generatedAt: string;
      metrics: { total:number; active:number; resolved:number; breached:number; verified:number; resolutionRate:number; averageRating:number|null };
      districts: Array<{district:string;total:number;active:number;resolved:number;lat:number|null;lng:number|null}>;
      categories: Array<{name:string;value:number}>;
      heatmap: Array<{lat:number;lng:number;count:number}>;
    }>('/api/public/transparency');
  },

  async assessComplaintQuality(payload: { text:string; category?:string; district?:string; priority?:GrievancePriority }) {
    return request<{
      completenessScore:number; qualityBand:string; missingFields:string[]; routing:string; routingReason:string;
      severity:GrievancePriority; severityReason:string; slaDays:number; duplicateProbability:number;
      duplicates:Array<{id:string;score:number;category:string;district:string;status:string}>;
    }>('/api/ai/complaint-quality',{method:'POST',body:payload});
  },

  async runEscalationScan() {
    return request<{scanned:number;escalated:number;results:Array<{id:string;level:number;reason:string}>}>(
      '/api/admin/escalation-scan',{method:'POST',body:{}}
    );
  },

  async getNotifications(): Promise<NotificationItem[]> {
    return request<NotificationItem[]>('/api/notifications');
  },

  async markNotificationRead(id: string) {
    if (!/^[0-9a-f-]{20,80}$/i.test(id)) throw new Error('Invalid notification identifier.');
    return request<NotificationItem>(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' });
  },

  async getSiteSettings(): Promise<import('../types').SiteSettings> {
    return request<import('../types').SiteSettings>('/api/site-settings');
  },

  async updateSiteSettings(settings: import('../types').SiteSettings): Promise<import('../types').SiteSettings> {
    return request<import('../types').SiteSettings>('/api/site-settings', { method: 'PUT', body: settings });
  },

  async getAnalytics() {
    if (!(await fetchIsAdmin(auth.currentUser))) throw new Error('Admin authentication required.');
    const payload = await request<{
      generatedAt: string;
      summary: {
        total: number;
        pending: number;
        resolved: number;
        in_progress: number;
        critical: number;
        high: number;
        sla_breached: number;
        average_resolution_hours: number;
        citizen_satisfaction_score: number;
      };
      categories: Array<{ name: string; value: number }>;
      priorities: Record<string, number>;
      districts: Array<{ name: string; value: number }>;
      timelineData: Array<{ day: string; submitted: number; resolved: number }>;
    }>('/api/admin/analytics');

    const feedbackScore = payload.summary.citizen_satisfaction_score || null;
    return {
      metrics: {
        total: payload.summary.total,
        resolved: payload.summary.resolved,
        pending: payload.summary.pending,
        critical: payload.summary.critical,
        high: payload.summary.high,
        inProgress: payload.summary.in_progress,
        slaBreached: payload.summary.sla_breached,
        resolutionRate: payload.summary.total ? Math.round((payload.summary.resolved / payload.summary.total) * 100) : 0,
        avgResolutionHours: payload.summary.average_resolution_hours || null,
        citizenSatisfactionScore: feedbackScore,
      },
      categoryData: payload.categories,
      priorityData: Object.entries(payload.priorities).map(([name, value]) => ({ name, value })),
      districtData: payload.districts.map(({ name, value }) => ({ district: name, total: value })),
      timelineData: payload.timelineData,
    };
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    if (!(await fetchIsAdmin(auth.currentUser))) throw new Error('Admin authentication required.');
    return request<AuditLog[]>('/api/admin/audit-logs');
  },
};
