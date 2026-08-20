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

export const api = {
  // AI Analysis
  async analyzeComplaint(text: string, languageHint?: string): Promise<AIAnalysisResponse> {
    const res = await fetch('/api/ai/analyze-complaint', {
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

  // Duplicate Check
  async checkDuplicates(text: string, category: string, district?: string): Promise<DuplicateMatch[]> {
    try {
      const res = await fetch('/api/ai/check-duplicates', {
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

  // AI Resolution Suggestions
  async suggestResolution(grievanceId: string, actionTaken?: string) {
    const res = await fetch('/api/ai/suggest-resolution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grievanceId, actionTaken }),
    });
    if (!res.ok) throw new Error('Failed to generate resolution');
    return res.json();
  },

  async draftResolution(category: string, summary: string, actionTaken?: string): Promise<{ resolutionEn: string; resolutionTa: string }> {
    try {
      const res = await fetch('/api/ai/suggest-resolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, summary, actionTaken }),
      });
      if (!res.ok) throw new Error('Failed to draft');
      return res.json();
    } catch {
      return {
        resolutionEn: 'Issue rectified on-site by zonal maintenance unit. Functionality restored and verified.',
        resolutionTa: 'கள பராமரிப்பு குழுவால் பிரச்சனை சரிசெய்யப்பட்டு செயல்பாடுகள் உறுதி செய்யப்பட்டன.',
      };
    }
  },

  // Complaints
  async getComplaints(params?: {
    search?: string;
    category?: string;
    status?: string;
    priority?: string;
    departmentId?: string;
    officerId?: string;
  }): Promise<Grievance[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.category) query.append('category', params.category);
    if (params?.status) query.append('status', params.status);
    if (params?.priority) query.append('priority', params.priority);
    if (params?.departmentId) query.append('departmentId', params.departmentId);
    if (params?.officerId) query.append('officerId', params.officerId);

    const res = await fetch(`/api/complaints?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch complaints');
    return res.json();
  },

  async getComplaintById(id: string): Promise<Grievance> {
    const res = await fetch(`/api/complaints/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Complaint not found');
    return res.json();
  },

  async createComplaint(data: Partial<Grievance>): Promise<Grievance> {
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create' }));
      throw new Error(err.error || 'Failed to submit grievance');
    }
    return res.json();
  },

  async updateComplaintStatus(
    id: string,
    payload: {
      status: GrievanceStatus;
      remarks: string;
      updatedBy: string;
      role: 'CITIZEN' | 'OFFICER' | 'ADMIN';
      evidenceUrl?: string;
    }
  ): Promise<Grievance> {
    const res = await fetch(`/api/complaints/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  },

  async assignOfficer(id: string, officerId: string, adminName?: string): Promise<Grievance> {
    const res = await fetch(`/api/complaints/${encodeURIComponent(id)}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ officerId, adminName }),
    });
    if (!res.ok) throw new Error('Failed to assign officer');
    return res.json();
  },

  async submitFeedback(
    id: string,
    payload: { rating: number; comment: string; isResolvedSatisfied: boolean }
  ): Promise<Grievance> {
    const res = await fetch(`/api/complaints/${encodeURIComponent(id)}/feedback`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to submit feedback');
    return res.json();
  },

  // Departments & Officers
  async getDepartments(): Promise<Department[]> {
    const res = await fetch('/api/departments');
    if (!res.ok) throw new Error('Failed to fetch departments');
    return res.json();
  },

  async getOfficers(): Promise<Officer[]> {
    const res = await fetch('/api/officers');
    if (!res.ok) throw new Error('Failed to fetch officers');
    return res.json();
  },

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    const res = await fetch('/api/notifications');
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  async markNotificationRead(id: string): Promise<void> {
    await fetch(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' });
  },

  // Analytics & Audit
  async getAnalytics() {
    const res = await fetch('/api/analytics');
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch('/api/audit-logs');
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },
};
