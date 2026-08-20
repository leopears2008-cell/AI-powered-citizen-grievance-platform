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
import { db } from '../lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';

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
    const grievancesRef = collection(db, 'grievances');
    const q = query(grievancesRef);
    // Applying local filtering for simplicity since Firestore indexes might not exist for complex querying
    const snapshot = await getDocs(q);
    let results: Grievance[] = [];
    snapshot.forEach((doc) => {
      results.push(doc.data() as Grievance);
    });

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
          r.summaryEn?.toLowerCase().includes(search)
        );
      }
    }
    // sort by creation date descending
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return results;
  },

  async getComplaintById(id: string): Promise<Grievance> {
    const docRef = doc(db, 'grievances', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Grievance;
    }
    
    // Fallback to fetch from mock api just in case we are looking for seeded data
    const res = await fetch(`/api/complaints/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Complaint not found');
    return res.json();
  },

  async createComplaint(data: Partial<Grievance>): Promise<Grievance> {
    const trackId = `GRV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const docRef = doc(db, 'grievances', trackId);
    const newGrievance = {
      ...data,
      id: trackId,
      status: 'Submitted' as GrievanceStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: [{
        status: 'Submitted',
        timestamp: new Date().toISOString(),
        remarks: 'Complaint registered successfully by Citizen',
        updatedBy: 'Citizen',
        role: 'CITIZEN'
      }]
    };
    await setDoc(docRef, newGrievance);
    return newGrievance as Grievance;
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
    const grievance = await this.getComplaintById(id);
    const updatedHistory = [
      ...grievance.statusHistory,
      {
        status: payload.status,
        timestamp: new Date().toISOString(),
        remarks: payload.remarks,
        updatedBy: payload.updatedBy,
        role: payload.role,
        evidenceUrl: payload.evidenceUrl
      }
    ];

    const docRef = doc(db, 'grievances', grievance.id);
    await updateDoc(docRef, {
      status: payload.status,
      statusHistory: updatedHistory,
      updatedAt: new Date().toISOString()
    });
    return this.getComplaintById(id);
  },

  async assignOfficer(id: string, officerId: string, adminName?: string): Promise<Grievance> {
    const grievance = await this.getComplaintById(id);
    const docRef = doc(db, 'grievances', grievance.id);
    const newHistory = [
      ...grievance.statusHistory,
      {
        status: 'Assigned',
        timestamp: new Date().toISOString(),
        remarks: `Assigned to Field Officer ID: ${officerId}`,
        updatedBy: adminName || 'System Admin',
        role: 'ADMIN'
      }
    ];
    await updateDoc(docRef, {
      status: 'Assigned',
      assignedOfficerId: officerId,
      statusHistory: newHistory,
      updatedAt: new Date().toISOString()
    });
    return this.getComplaintById(id);
  },

  async submitFeedback(
    id: string,
    payload: { rating: number; comment: string; isResolvedSatisfied: boolean }
  ): Promise<Grievance> {
    const grievance = await this.getComplaintById(id);
    const docRef = doc(db, 'grievances', grievance.id);
    
    if (payload.isResolvedSatisfied) {
      await updateDoc(docRef, {
        resolutionFeedback: {
          rating: payload.rating,
          comment: payload.comment,
          submittedAt: new Date().toISOString()
        }
      });
    } else {
      const newHistory = [
        ...grievance.statusHistory,
        {
          status: 'Reopened',
          timestamp: new Date().toISOString(),
          remarks: `Citizen unsatisfied. Reason: ${payload.comment}`,
          updatedBy: 'Citizen',
          role: 'CITIZEN'
        }
      ];
      await updateDoc(docRef, {
        status: 'Reopened',
        statusHistory: newHistory,
        updatedAt: new Date().toISOString()
      });
    }
    return this.getComplaintById(id);
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
