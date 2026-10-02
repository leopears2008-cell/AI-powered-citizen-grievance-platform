import {
  Grievance,
  Department,
  Officer,
  NotificationItem,
  AuditLog,
  AIAnalysisResponse,
  DuplicateMatch,
  GrievanceStatus,
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

  async getNotifications(): Promise<NotificationItem[]> {
    // Notifications are intentionally disabled until a persistent, access-controlled
    // notification store is configured for production.
    return [];
  },

  async markNotificationRead(_id: string) {
    return;
  },

  async getSiteSettings(): Promise<import('../types').SiteSettings> {
    return request<import('../types').SiteSettings>('/api/site-settings');
  },

  async updateSiteSettings(settings: import('../types').SiteSettings): Promise<import('../types').SiteSettings> {
    return request<import('../types').SiteSettings>('/api/site-settings', { method: 'PUT', body: settings });
  },

  async getAnalytics() {
    if (!(await fetchIsAdmin(auth.currentUser))) throw new Error('Admin authentication required.');
    const complaints = await this.getComplaints();
    const resolved = complaints.filter((c) => c.status === 'Resolved').length;
    const pending = complaints.length - resolved;
    const critical = complaints.filter((c) => c.priority === 'Critical' && c.status !== 'Resolved').length;
    const high = complaints.filter((c) => c.priority === 'High' && c.status !== 'Resolved').length;
    const inProgress = complaints.filter((c) => c.status === 'In Progress' || c.status === 'Under Review').length;

    const categoryMap: Record<string, number> = {};
    const priorityMap: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    const districtMap: Record<string, number> = {};
    complaints.forEach((c) => {
      categoryMap[c.category] = (categoryMap[c.category] || 0) + 1;
      priorityMap[c.priority] = (priorityMap[c.priority] || 0) + 1;
      districtMap[c.location?.district || 'Unknown'] = (districtMap[c.location?.district || 'Unknown'] || 0) + 1;
    });

    const durations = complaints.filter((c) => c.resolvedAt).map((c) =>
      new Date(c.resolvedAt!).getTime() - new Date(c.createdAt).getTime()
    ).filter((value) => Number.isFinite(value) && value >= 0);
    const feedback = complaints.map((c) => c.feedback).filter(Boolean) as NonNullable<Grievance['feedback']>[];

    const timelineData = Array.from({ length: 7 }, (_, index) => {
      const start = new Date(Date.now() - (6 - index) * 86400000);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start.getTime() + 86400000);
      return {
        day: start.toLocaleDateString('en-IN', { weekday: 'short' }),
        submitted: complaints.filter((c) => {
          const value = new Date(c.createdAt).getTime();
          return value >= start.getTime() && value < end.getTime();
        }).length,
        resolved: complaints.filter((c) => {
          const value = c.resolvedAt ? new Date(c.resolvedAt).getTime() : NaN;
          return Number.isFinite(value) && value >= start.getTime() && value < end.getTime();
        }).length,
      };
    });

    return {
      metrics: {
        total: complaints.length,
        resolved,
        pending,
        critical,
        high,
        inProgress,
        resolutionRate: complaints.length ? Math.round((resolved / complaints.length) * 100) : 0,
        avgResolutionHours: durations.length ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length / 3600000) * 10) / 10 : null,
        citizenSatisfactionScore: feedback.length ? Math.round((feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length) * 10) / 10 : null,
      },
      categoryData: Object.entries(categoryMap).map(([name, value]) => ({ name, value })),
      priorityData: Object.entries(priorityMap).map(([name, value]) => ({ name, value })),
      districtData: Object.entries(districtMap).map(([district, total]) => ({ district, total })),
      timelineData,
    };
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    if (!(await fetchIsAdmin(auth.currentUser))) throw new Error('Admin authentication required.');
    return request<AuditLog[]>('/api/admin/audit-logs');
  },
};
