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
import { db, auth } from '../lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';

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

export const api = {
  async analyzeComplaint(text: string, languageHint?: string): Promise<AIAnalysisResponse> {
    const res = await jsonFetch('/api/ai/analyze-complaint', {
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
      const res = await jsonFetch('/api/ai/check-duplicates', {
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

  // NOTE: there used to be a second function here, draftResolution(category,
  // summary, actionTaken), calling this same endpoint with a different request
  // shape than the backend expects (it expects { grievanceId, actionTaken } --
  // see server.ts). It was unused by any component and would have 404'd every
  // time it was actually wired up, so rather than leave two competing
  // contracts for the same operation, it has been removed. suggestResolution
  // below is the one canonical way to call this endpoint.
  async suggestResolution(grievanceId: string, actionTaken?: string) {
    const res = await jsonFetch('/api/ai/suggest-resolution', {
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
    const base = collection(db, 'grievances');
    const q = user.isAnonymous
      ? query(base, where('citizenId', '==', user.uid))
      : query(base);
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map((d) => d.data() as Grievance);

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
          (user.isAnonymous ? false : r.citizenName?.toLowerCase().includes(search)) ||
          r.summaryEn?.toLowerCase().includes(search)
        );
      }
    }
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getComplaintById(id: string): Promise<Grievance> {
    const user = auth.currentUser;
    if (!user) throw new Error('Authentication session is not ready.');

    if (user.isAnonymous) {
      const q = query(collection(db, 'grievances'), where('id', '==', id), where('citizenId', '==', user.uid));
      const snapshot = await getDocs(q);
      if (snapshot.empty) throw new Error('Grievance not found or not accessible.');
      return snapshot.docs[0].data() as Grievance;
    }

    const snap = await getDoc(doc(db, 'grievances', id));
    if (!snap.exists()) throw new Error('Grievance not found');
    return snap.data() as Grievance;
  },

  async createComplaint(data: Partial<Grievance>): Promise<Grievance> {
    const user = auth.currentUser;
    if (!user) throw new Error('Authentication session is not ready.');

    const trackId = `GRV-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const now = new Date().toISOString();
    const newGrievance = {
      ...data,
      id: trackId,
      trackId,
      citizenId: user.uid,
      status: 'Submitted' as GrievanceStatus,
      createdAt: now,
      updatedAt: now,
      statusHistory: [{
        status: 'Submitted',
        timestamp: now,
        remarks: 'Complaint registered successfully by Citizen',
        updatedBy: 'Citizen',
        role: 'CITIZEN',
      }],
    };
    await setDoc(doc(db, 'grievances', trackId), newGrievance);
    return newGrievance as Grievance;
  },

  async updateComplaintStatus(id: string, payload: {
    status: GrievanceStatus; remarks: string; updatedBy: string;
    role: 'CITIZEN' | 'OFFICER' | 'ADMIN'; evidenceUrl?: string;
  }): Promise<Grievance> {
    if (auth.currentUser?.isAnonymous) throw new Error('Only authorized staff can change grievance status.');
    const grievance = await this.getComplaintById(id);
    const updatedHistory = [...grievance.statusHistory, {
      status: payload.status, timestamp: new Date().toISOString(),
      remarks: payload.remarks, updatedBy: payload.updatedBy, role: payload.role,
      evidenceUrl: payload.evidenceUrl,
    }];
    await updateDoc(doc(db, 'grievances', id), {
      status: payload.status,
      statusHistory: updatedHistory,
      updatedAt: new Date().toISOString(),
      ...(payload.status === 'Resolved' ? {
        resolvedAt: new Date().toISOString(),
        resolutionRemarks: payload.remarks,
        ...(payload.evidenceUrl ? { resolutionEvidenceUrl: payload.evidenceUrl } : {}),
      } : {}),
    });
    await this.addAuditLog('STATUS_UPDATE', `Updated ${id} to ${payload.status}`, id);
    return this.getComplaintById(id);
  },

  async assignOfficer(id: string, officerId: string, adminName?: string): Promise<Grievance> {
    if (auth.currentUser?.isAnonymous) throw new Error('Admin authentication required.');
    const grievance = await this.getComplaintById(id);
    const now = new Date().toISOString();
    await updateDoc(doc(db, 'grievances', id), {
      status: 'Assigned',
      assignedOfficerId: officerId,
      assignedAt: now,
      statusHistory: [...grievance.statusHistory, {
        status: 'Assigned',
        timestamp: now,
        remarks: `Assigned to Field Officer ID: ${officerId}`,
        updatedBy: adminName || 'System Admin',
        role: 'ADMIN',
      }],
      updatedAt: now,
    });
    await this.addAuditLog('OFFICER_ASSIGNMENT', `Assigned ${id} to officer ${officerId}`, id);
    return this.getComplaintById(id);
  },

  async submitFeedback(id: string, payload: { rating: number; comment: string; isResolvedSatisfied: boolean }) {
    const grievance = await this.getComplaintById(id);
    if (grievance.citizenId !== auth.currentUser?.uid) throw new Error('You can only provide feedback for your own grievance.');
    await updateDoc(doc(db, 'grievances', id), {
      resolutionFeedback: {
        rating: Math.max(1, Math.min(5, Number(payload.rating) || 1)),
        comment: String(payload.comment || '').slice(0, 1000),
        isResolvedSatisfied: Boolean(payload.isResolvedSatisfied),
        submittedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    });
    return this.getComplaintById(id);
  },

  async addAuditLog(action: string, details: string, grievanceId?: string) {
    const user = auth.currentUser;
    if (!user || user.isAnonymous) return;
    const id = `audit-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    await setDoc(doc(db, 'auditLogs', id), {
      id,
      timestamp: new Date().toISOString(),
      userId: user.uid,
      userName: user.email || 'Admin',
      userRole: 'ADMIN',
      action,
      details: details.slice(0, 2000),
      grievanceId,
    });
  },

  async getDepartments(): Promise<Department[]> {
    const res = await jsonFetch('/api/departments');
    if (!res.ok) throw new Error('Failed to fetch departments');
    return res.json();
  },

  async getOfficers(): Promise<Officer[]> {
    const res = await jsonFetch('/api/officers');
    if (!res.ok) throw new Error('Failed to fetch officers');
    return res.json();
  },

  async getNotifications(): Promise<NotificationItem[]> {
    // Notifications are intentionally disabled until a persistent, access-controlled
    // notification store is configured for production.
    return [];
  },

  async markNotificationRead(_id: string) {
    return;
  },

  async getAnalytics() {
    if (auth.currentUser?.isAnonymous) throw new Error('Admin authentication required.');
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
    if (auth.currentUser?.isAnonymous) throw new Error('Admin authentication required.');
    const snapshot = await getDocs(collection(db, 'auditLogs'));
    return snapshot.docs
      .map((item) => item.data() as AuditLog)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 200);
  },
};
