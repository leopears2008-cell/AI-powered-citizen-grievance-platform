import { randomUUID } from 'node:crypto';
import type { Express, Request, RequestHandler, Response } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AuditLog,
  Department,
  Grievance,
  GrievanceStatus,
  Officer,
  StatusHistoryItem,
  UserRole,
} from '../src/types';
import { getSupabase } from './supabase';
import { canTransition } from './workflow';
import { attachmentProxyUrl, downloadEvidence, removeEvidence, storeEvidence } from './storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface AuthenticatedUser {
  uid: string;
  email?: string;
  email_verified?: boolean;
  phone_number?: string;
  isAnonymous: boolean;
}
export type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

type Attachment = Grievance['attachments'][number];

interface HistoryRow {
  id: number;
  status: GrievanceStatus;
  occurred_at: string;
  updated_by: string;
  role: UserRole;
  remarks: string;
  evidence_url: string | null;
}

interface AttachmentRow {
  attachment_id: string;
  url: string;
  name: string;
  type: Attachment['type'];
  uploaded_at: string;
  storage_path?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  malware_scan_status?: string | null;
}

interface GrievanceRow {
  id: string;
  track_id: string;
  citizen_id: string | null;
  verification_method: 'phone' | 'email' | null;
  citizen_name: string;
  citizen_phone: string;
  citizen_email: string | null;
  language: Grievance['language'];
  original_transcript: string;
  summary_en: string;
  summary_ta: string;
  category: Grievance['category'];
  department_id: string | null;
  department_name: string;
  priority: Grievance['priority'];
  priority_reason: string;
  confidence_score: number | string;
  location_address: string;
  location_landmark: string | null;
  location_district: string;
  location_constituency: string | null;
  location_ward_number: string | null;
  location_pincode: string | null;
  location_lat: number | null;
  location_lng: number | null;
  status: GrievanceStatus;
  assigned_officer_id: string | null;
  assigned_officer_name: string | null;
  assigned_officer_phone: string | null;
  assigned_at: string | null;
  target_resolution_date: string | null;
  estimated_days: number | null;
  resolved_at: string | null;
  resolution_remarks: string | null;
  resolution_evidence_url: string | null;
  feedback_rating: number | null;
  feedback_comment: string | null;
  feedback_satisfied: boolean | null;
  feedback_submitted_at: string | null;
  entities: Grievance['entities'] | null;
  is_duplicate_of: string | null;
  resolution_verified_at: string | null;
  resolution_verified_by: string | null;
  escalation_reason: string | null;
  escalated_at: string | null;
  escalated_to_department_id: string | null;
  created_at: string;
  updated_at: string;
  grievance_status_history?: HistoryRow[] | null;
  grievance_attachments?: AttachmentRow[] | null;
}

interface DepartmentRow {
  id: string;
  name: string;
  name_tamil: string;
  code: string;
  head_name: string;
  contact_number: string;
  email: string;
  total_grievances: number;
  pending_count: number;
  resolved_count: number;
  sla_days: number;
  icon_name: string;
}

interface OfficerRow {
  id: string;
  name: string;
  name_tamil: string | null;
  department_id: string;
  department_name: string;
  designation: string;
  phone: string;
  email: string;
  active_count: number;
  resolved_count: number;
  avatar: string;
  zone: string;
}

interface AuditLogRow {
  id: string;
  occurred_at: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  action: string;
  details: string;
  grievance_id: string | null;
}

// ---------------------------------------------------------------------------
// Errors + helpers
// ---------------------------------------------------------------------------
class HttpError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Log only the database error code (messages can contain citizen data) and fail safely. */
function fail(error: { code?: string }): never {
  console.error('Database request failed:', error.code ?? 'unknown');
  throw new HttpError(500, 'Database request failed.');
}

function requireDb(): SupabaseClient {
  const db = getSupabase();
  if (!db) throw new HttpError(503, 'Grievance data service is not configured.');
  return db;
}

const SELECT_GRIEVANCE = '*, grievance_status_history(*), grievance_attachments(*)';
const CATEGORIES: readonly Grievance['category'][] = [
  'Street Light', 'Water Supply', 'Roads & Potholes', 'Sanitation & Drainage',
  'Electricity & Power', 'Public Health & Fogging', 'Transport & Traffic',
  'Encroachment & Parks', 'Other',
];
const PRIORITIES: readonly Grievance['priority'][] = ['Critical', 'High', 'Medium', 'Low'];
const LANGUAGES: readonly Grievance['language'][] = ['Tamil', 'English', 'Tanglish', 'Other'];
const ROLES: readonly UserRole[] = ['CITIZEN', 'OFFICER', 'ADMIN'];
// Statuses an administrator may set (matches the previous Firestore rules).
const ADMIN_STATUSES: readonly GrievanceStatus[] = [
  'Submitted', 'AI Classified', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected',
];
const PHONE_PATTERN = /^[+]?[0-9 ()-]{7,30}$/;
const EMAIL_PATTERN = /^[^ @]+@[^ @]+[.][^ @]+$/;
const DATA_URL_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]*={0,2}$/;
const ID_PATTERN = /^[A-Za-z0-9-]{1,100}$/;

function bad(field: string): never {
  throw new HttpError(400, `Invalid value for ${field}.`);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function reqString(value: unknown, field: string, max: number, min = 1): string {
  if (typeof value !== 'string' || value.length < min || value.length > max) bad(field);
  return value;
}

function optString(value: unknown, field: string, max: number): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string' || value.length > max) bad(field);
  return value;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
  if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) bad(field);
  return value as T;
}

function numberIn(value: unknown, field: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) bad(field);
  return value;
}

function optNumberIn(value: unknown, field: string, min: number, max: number): number | undefined {
  if (value === undefined || value === null) return undefined;
  return numberIn(value, field, min, max);
}

const toIso = (value: string): string => new Date(value).toISOString();
const toOptIso = (value: string | null): string | undefined => (value ? toIso(value) : undefined);

function validateImageDataUrl(value: string): boolean {
  if (!DATA_URL_PATTERN.test(value) || value.length > 550000) return false;
  const comma = value.indexOf(',');
  if (comma < 0) return false;
  try {
    const bytes = Buffer.from(value.slice(comma + 1), 'base64');
    if (bytes.length === 0 || bytes.length > 400000) return false;
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const isPng = bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    const isWebp = bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
    return isJpeg || isPng || isWebp;
  } catch {
    return false;
  }
}

function routeId(req: Request): string {
  const id = req.params.id;
  if (typeof id !== 'string' || !ID_PATTERN.test(id)) throw new HttpError(400, 'Invalid identifier.');
  return id;
}

// ---------------------------------------------------------------------------
// Admin check (admins table, verified email) - mirrors the old Firestore isAdmin()
// ---------------------------------------------------------------------------
async function isAdmin(user: AuthenticatedUser): Promise<boolean> {
  if (user.isAnonymous || user.email_verified !== true) return false;
  const db = requireDb();
  const { data, error } = await db.from('admins').select('active').eq('id', user.uid).maybeSingle();
  if (error) fail(error);
  return data?.active === true;
}

// ---------------------------------------------------------------------------
// Row <-> API shape mapping
// ---------------------------------------------------------------------------
function toGrievance(row: GrievanceRow): Grievance {
  const history = [...(row.grievance_status_history ?? [])].sort(
    (a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime() || a.id - b.id,
  );
  const statusHistory: StatusHistoryItem[] = history.map((h) => ({
    status: h.status,
    timestamp: toIso(h.occurred_at),
    updatedBy: h.updated_by,
    role: h.role,
    remarks: h.remarks,
    ...(h.evidence_url ? { evidenceUrl: h.evidence_url } : {}),
  }));
  const attachments: Attachment[] = (row.grievance_attachments ?? []).map((a) => ({
    id: a.attachment_id,
    url: a.storage_path ? attachmentProxyUrl(row.id, a.attachment_id) : a.url,
    name: a.name,
    type: a.type,
    uploadedAt: toIso(a.uploaded_at),
  }));

  return {
    id: row.id,
    trackId: row.track_id,
    ...(row.citizen_id ? { citizenId: row.citizen_id } : {}),
    ...(row.verification_method ? { verificationMethod: row.verification_method } : {}),
    citizenName: row.citizen_name,
    citizenPhone: row.citizen_phone,
    ...(row.citizen_email ? { citizenEmail: row.citizen_email } : {}),
    language: row.language,
    originalTranscript: row.original_transcript,
    summaryEn: row.summary_en,
    summaryTa: row.summary_ta,
    category: row.category,
    departmentId: row.department_id ?? '',
    departmentName: row.department_name,
    priority: row.priority,
    priorityReason: row.priority_reason,
    confidenceScore: Number(row.confidence_score),
    location: {
      address: row.location_address,
      district: row.location_district,
      ...(row.location_landmark ? { landmark: row.location_landmark } : {}),
      ...(row.location_constituency ? { constituency: row.location_constituency } : {}),
      ...(row.location_ward_number ? { wardNumber: row.location_ward_number } : {}),
      ...(row.location_pincode ? { pincode: row.location_pincode } : {}),
      ...(row.location_lat !== null ? { lat: row.location_lat } : {}),
      ...(row.location_lng !== null ? { lng: row.location_lng } : {}),
    },
    attachments,
    status: row.status,
    ...(row.assigned_officer_id ? { assignedOfficerId: row.assigned_officer_id } : {}),
    ...(row.assigned_officer_name ? { assignedOfficerName: row.assigned_officer_name } : {}),
    ...(row.assigned_officer_phone ? { assignedOfficerPhone: row.assigned_officer_phone } : {}),
    ...(row.assigned_at ? { assignedAt: toIso(row.assigned_at) } : {}),
    targetResolutionDate: toOptIso(row.target_resolution_date) ?? toIso(row.created_at),
    ...(row.estimated_days !== null ? { estimatedDays: row.estimated_days } : {}),
    ...(row.resolved_at ? { resolvedAt: toIso(row.resolved_at) } : {}),
    ...(row.resolution_remarks ? { resolutionRemarks: row.resolution_remarks } : {}),
    ...(row.resolution_evidence_url ? { resolutionEvidenceUrl: row.resolution_evidence_url } : {}),
    ...(row.feedback_rating !== null
      ? {
          feedback: {
            rating: row.feedback_rating,
            comment: row.feedback_comment ?? '',
            isResolvedSatisfied: row.feedback_satisfied === true,
            submittedAt: toOptIso(row.feedback_submitted_at) ?? toIso(row.updated_at),
          },
        }
      : {}),
    statusHistory,
    entities: row.entities ?? {},
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    ...(row.is_duplicate_of ? { isDuplicateOf: row.is_duplicate_of } : {}),
    ...(row.resolution_verified_at ? { resolutionVerifiedAt: toIso(row.resolution_verified_at) } : {}),
    ...(row.resolution_verified_by ? { resolutionVerifiedBy: row.resolution_verified_by } : {}),
    ...(row.escalation_reason ? { escalationReason: row.escalation_reason } : {}),
    ...(row.escalated_at ? { escalatedAt: toIso(row.escalated_at) } : {}),
    ...(row.escalated_to_department_id ? { escalatedToDepartmentId: row.escalated_to_department_id } : {}),
  };
}

const toDepartment = (r: DepartmentRow): Department => ({
  id: r.id,
  name: r.name,
  nameTamil: r.name_tamil,
  code: r.code,
  headName: r.head_name,
  contactNumber: r.contact_number,
  email: r.email,
  totalGrievances: r.total_grievances,
  pendingCount: r.pending_count,
  resolvedCount: r.resolved_count,
  slaDays: r.sla_days,
  iconName: r.icon_name,
});

const toOfficer = (r: OfficerRow): Officer => ({
  id: r.id,
  name: r.name,
  ...(r.name_tamil ? { nameTamil: r.name_tamil } : {}),
  departmentId: r.department_id,
  departmentName: r.department_name,
  designation: r.designation,
  phone: r.phone,
  email: r.email,
  activeCount: r.active_count,
  resolvedCount: r.resolved_count,
  avatar: r.avatar,
  zone: r.zone,
});

const toAuditLog = (r: AuditLogRow): AuditLog => ({
  id: r.id,
  timestamp: toIso(r.occurred_at),
  userId: r.user_id,
  userName: r.user_name,
  userRole: r.user_role,
  action: r.action,
  details: r.details,
  ...(r.grievance_id ? { grievanceId: r.grievance_id } : {}),
});

// ---------------------------------------------------------------------------
// Data access
// ---------------------------------------------------------------------------
async function fetchGrievanceRow(db: SupabaseClient, id: string): Promise<GrievanceRow | null> {
  const { data, error } = await db.from('grievances').select(SELECT_GRIEVANCE).eq('id', id).maybeSingle();
  if (error) fail(error);
  return (data as GrievanceRow | null) ?? null;
}

async function loadGrievance(db: SupabaseClient, id: string): Promise<Grievance> {
  const row = await fetchGrievanceRow(db, id);
  if (!row) throw new HttpError(404, 'Grievance not found');
  return toGrievance(row);
}

/** Admins can read any grievance; citizens only their own. Unknown and forbidden look identical. */
async function loadAccessibleRow(db: SupabaseClient, user: AuthenticatedUser, id: string): Promise<GrievanceRow> {
  const row = await fetchGrievanceRow(db, id);
  if (!row || (row.citizen_id !== user.uid && !(await isAdmin(user)))) {
    throw new HttpError(404, 'Grievance not found or not accessible.');
  }
  return row;
}

async function listGrievances(db: SupabaseClient, citizenId?: string): Promise<Grievance[]> {
  const pageSize = 500;
  const rows: GrievanceRow[] = [];
  for (let from = 0; ; from += pageSize) {
    let query = db.from('grievances').select(SELECT_GRIEVANCE);
    if (citizenId) query = query.eq('citizen_id', citizenId);
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .order('id')
      .range(from, from + pageSize - 1);
    if (error) fail(error);
    const page = (data ?? []) as GrievanceRow[];
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows.map(toGrievance);
}

async function writeAudit(
  db: SupabaseClient,
  user: AuthenticatedUser,
  action: string,
  details: string,
  grievanceId?: string,
): Promise<void> {
  const { error } = await db.from('audit_logs').insert({
    id: `audit-${Date.now()}-${randomUUID().slice(0, 8)}`,
    occurred_at: new Date().toISOString(),
    user_id: user.uid,
    user_name: (user.email || 'Admin').slice(0, 254),
    user_role: 'ADMIN',
    action: action.slice(0, 100),
    details: details.slice(0, 2000),
    grievance_id: grievanceId ?? null,
  });
  if (error) fail(error);
}

// ---------------------------------------------------------------------------
// Input validation (replaces the validation that lived in firestore.rules)
// ---------------------------------------------------------------------------
function parseNewGrievance(body: unknown, user: AuthenticatedUser) {
  const b = asRecord(body);
  const loc = asRecord(b.location);
  const ent = asRecord(b.entities);

  const phone = user.phone_number ?? reqString(b.citizenPhone, 'citizenPhone', 30, 7);
  if (!PHONE_PATTERN.test(phone)) bad('citizenPhone');

  const verifiedEmail = user.email_verified === true && user.email ? user.email : undefined;
  const email = verifiedEmail ?? optString(b.citizenEmail, 'citizenEmail', 254) ?? '';
  if (email !== '' && !EMAIL_PATTERN.test(email)) bad('citizenEmail');

  const rawAttachments = b.attachments === undefined ? [] : b.attachments;
  if (!Array.isArray(rawAttachments) || rawAttachments.length > 1) bad('attachments');
  const attachments = (rawAttachments as unknown[]).map((item) => {
    const a = asRecord(item);
    const url = reqString(a.url, 'attachment url', 550000);
    if (a.type !== 'image' || !validateImageDataUrl(url)) bad('attachment');
    return {
      attachment_id: reqString(a.id, 'attachment id', 80),
      url,
      name: reqString(a.name, 'attachment name', 120, 0),
      type: 'image' as const,
    };
  });

  const rawMarkers = ent.urgencyMarkers;
  if (rawMarkers !== undefined && (!Array.isArray(rawMarkers) || rawMarkers.length > 10)) bad('entities');
  const entities: Grievance['entities'] = {};
  const duration = optString(ent.duration, 'entities.duration', 200);
  const affectedCount = optString(ent.affectedCount, 'entities.affectedCount', 100);
  const equipment = optString(ent.equipment, 'entities.equipment', 200);
  if (duration !== undefined) entities.duration = duration;
  if (affectedCount !== undefined) entities.affectedCount = affectedCount;
  if (equipment !== undefined) entities.equipment = equipment;
  if (Array.isArray(rawMarkers)) {
    entities.urgencyMarkers = rawMarkers.filter((m): m is string => typeof m === 'string').map((m) => m.slice(0, 200));
  }

  const estimatedDays =
    b.estimatedDays === undefined ? 3 : Math.round(numberIn(b.estimatedDays, 'estimatedDays', 0, 365));

  return {
    citizenName: reqString(b.citizenName, 'citizenName', 120),
    citizenPhone: phone,
    citizenEmail: email,
    language: oneOf(b.language, LANGUAGES, 'language'),
    originalTranscript: reqString(b.originalTranscript, 'originalTranscript', 10000),
    summaryEn: reqString(b.summaryEn, 'summaryEn', 2000),
    summaryTa: optString(b.summaryTa, 'summaryTa', 2000) ?? '',
    category: oneOf(b.category, CATEGORIES, 'category'),
    departmentId: reqString(b.departmentId, 'departmentId', 120, 0),
    departmentName: reqString(b.departmentName, 'departmentName', 200, 0),
    priority: oneOf(b.priority, PRIORITIES, 'priority'),
    priorityReason: optString(b.priorityReason, 'priorityReason', 1000) ?? '',
    confidenceScore: numberIn(b.confidenceScore, 'confidenceScore', 0, 1),
    estimatedDays,
    location: {
      address: reqString(loc.address, 'location.address', 500),
      district: reqString(loc.district, 'location.district', 100),
      landmark: optString(loc.landmark, 'location.landmark', 200),
      constituency: optString(loc.constituency, 'location.constituency', 120),
      wardNumber: optString(loc.wardNumber, 'location.wardNumber', 50),
      pincode: optString(loc.pincode, 'location.pincode', 12),
      lat: optNumberIn(loc.lat, 'location.lat', -90, 90),
      lng: optNumberIn(loc.lng, 'location.lng', -180, 180),
    },
    entities,
    attachments,
  };
}

// ---------------------------------------------------------------------------
// Route wiring
// ---------------------------------------------------------------------------
type Handler = (req: AuthenticatedRequest, user: AuthenticatedUser, res: Response) => Promise<void>;

function handle(fn: Handler, options: { admin?: boolean } = {}): RequestHandler {
  return (req, res) => {
    void (async () => {
      const authReq = req as AuthenticatedRequest;
      const user = authReq.user;
      if (!user) throw new HttpError(401, 'Authentication required.');
      if (options.admin && !(await isAdmin(user))) throw new HttpError(403, 'Administrator access required.');
      await fn(authReq, user, res);
    })().catch((error: unknown) => {
      if (error instanceof HttpError) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      console.error('Grievance API error:', error instanceof Error ? error.name : 'unknown');
      res.status(500).json({ error: 'Request failed.' });
    });
  };
}

export function registerGrievanceRoutes(app: Express, authenticate: RequestHandler): void {
  const DEFAULT_SITE_SETTINGS = {
    id: 'default', siteTitle: 'NivaranAI Grievance Portal', siteSubtitle: 'AI-assisted civic grievance management', announcement: '', chatbotEnabled: true, showHero: true, showAIDemo: true, showMap: true, showFAQ: true, showDirectory: true, showMinisters: true, showNews: true,
  };

  const normaliseSiteSettings = (row: Record<string, unknown> | null) => ({
    ...DEFAULT_SITE_SETTINGS,
    ...(row || {}),
    id: 'default',
    siteTitle: typeof row?.site_title === 'string' ? row.site_title.slice(0, 120) : DEFAULT_SITE_SETTINGS.siteTitle,
    siteSubtitle: typeof row?.site_subtitle === 'string' ? row.site_subtitle.slice(0, 240) : DEFAULT_SITE_SETTINGS.siteSubtitle,
    announcement: typeof row?.announcement === 'string' ? row.announcement.slice(0, 500) : '',
    chatbotEnabled: row?.chatbot_enabled !== false,
    showHero: row?.show_hero !== false,
    showAIDemo: row?.show_ai_demo !== false,
    showMap: row?.show_map !== false,
    showFAQ: row?.show_faq !== false,
    showDirectory: row?.show_directory !== false,
    showMinisters: row?.show_ministers !== false,
    showNews: row?.show_news !== false,
  });

  // Public website configuration is read-only to citizens; writes are admin-only.
  app.get('/api/site-settings', async (_req, res) => {
    try {
      const db = requireDb();
      const { data, error } = await db.from('site_settings').select('*').eq('id', 'default').maybeSingle();
      if (error) {
        console.error('Public site settings lookup failed:', error.code ?? 'unknown');
        return res.json(DEFAULT_SITE_SETTINGS);
      }
      return res.json(normaliseSiteSettings((data ?? null) as Record<string, unknown> | null));
    } catch {
      return res.json(DEFAULT_SITE_SETTINGS);
    }
  });

  app.get('/api/site-settings/admin', authenticate, handle(async (_req, _user, res) => {
    const db = requireDb();
    const { data, error } = await db.from('site_settings').select('*').eq('id', 'default').maybeSingle();
    if (error) fail(error);
    res.json(normaliseSiteSettings((data ?? null) as Record<string, unknown> | null));
  }, { admin: true }));

  app.put('/api/site-settings', authenticate, handle(async (req, user, res) => {
    const b = asRecord(req.body);
    const db = requireDb();
    const patch = {
      id: 'default',
      site_title: reqString(b.siteTitle, 'siteTitle', 120),
      site_subtitle: reqString(b.siteSubtitle, 'siteSubtitle', 240),
      announcement: optString(b.announcement, 'announcement', 500) ?? '',
      chatbot_enabled: b.chatbotEnabled !== false,
      show_hero: b.showHero !== false,
      show_ai_demo: b.showAIDemo !== false,
      show_map: b.showMap !== false,
      show_faq: b.showFAQ !== false,
      show_directory: b.showDirectory !== false,
      show_ministers: b.showMinisters !== false,
      show_news: b.showNews !== false,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await db.from('site_settings').upsert(patch, { onConflict: 'id' }).select('*').single();
    if (error) fail(error);
    await writeAudit(db, user, 'SITE_SETTINGS_UPDATE', 'Updated public website visibility and assistant settings.');
    res.json(normaliseSiteSettings((data ?? patch) as Record<string, unknown>));
  }, { admin: true }));

  // Is the signed-in user an active, verified administrator?
  app.get('/api/me/admin', authenticate, handle(async (_req, user, res) => {
    res.json({ isAdmin: await isAdmin(user) });
  }));

  // Admins receive every grievance; everyone else only their own.
  app.get('/api/grievances', authenticate, handle(async (_req, user, res) => {
    const db = requireDb();
    const admin = await isAdmin(user);
    res.json(await listGrievances(db, admin ? undefined : user.uid));
  }));

  app.get('/api/grievances/:id', authenticate, handle(async (req, user, res) => {
    const db = requireDb();
    const row = await loadAccessibleRow(db, user, routeId(req));
    res.json(toGrievance(row));
  }));

  app.post('/api/grievances', authenticate, handle(async (req, user, res) => {
    if (user.isAnonymous || (!user.phone_number && user.email_verified !== true)) {
      throw new HttpError(403, 'Verify your phone number or email before submitting a grievance.');
    }
    const db = requireDb();
    const input = parseNewGrievance(req.body, user);
    const id = `GRV-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const storedAttachments: Array<Record<string, unknown>> = [];
    const storedPaths: string[] = [];
    try {
      for (const attachment of input.attachments) {
        const stored = await storeEvidence(attachment.url, id, attachment.name, attachment.attachment_id);
        storedPaths.push(stored.storagePath);
        storedAttachments.push({
          attachment_id: attachment.attachment_id,
          url: attachmentProxyUrl(id, attachment.attachment_id),
          name: attachment.name,
          type: attachment.type,
          storage_path: stored.storagePath,
          mime_type: stored.mimeType,
          size_bytes: stored.sizeBytes,
          malware_scan_status: 'clean',
        });
      }
    } catch (error) {
      for (const storagePath of storedPaths) await removeEvidence(storagePath);
      throw new HttpError(400, error instanceof Error ? error.message : 'Evidence upload failed.');
    }
    const now = new Date();
    const nowIso = now.toISOString();

    const { error: insertError } = await db.from('grievances').insert({
      id,
      track_id: id,
      citizen_id: user.uid,
      verification_method: user.phone_number ? 'phone' : 'email',
      citizen_name: input.citizenName,
      citizen_phone: input.citizenPhone,
      citizen_email: input.citizenEmail || null,
      language: input.language,
      original_transcript: input.originalTranscript,
      summary_en: input.summaryEn,
      summary_ta: input.summaryTa,
      category: input.category,
      department_id: input.departmentId || null,
      department_name: input.departmentName,
      priority: input.priority,
      priority_reason: input.priorityReason,
      confidence_score: input.confidenceScore,
      location_address: input.location.address,
      location_landmark: input.location.landmark ?? null,
      location_district: input.location.district,
      location_constituency: input.location.constituency ?? null,
      location_ward_number: input.location.wardNumber ?? null,
      location_pincode: input.location.pincode ?? null,
      location_lat: input.location.lat ?? null,
      location_lng: input.location.lng ?? null,
      status: 'Submitted',
      target_resolution_date: new Date(now.getTime() + input.estimatedDays * 86400000).toISOString(),
      estimated_days: input.estimatedDays,
      entities: input.entities,
      created_at: nowIso,
      updated_at: nowIso,
    });
    if (insertError) fail(insertError);

    // supabase-js has no multi-statement transactions; undo the parent row if a child insert fails.
    const { error: historyError } = await db.from('grievance_status_history').insert({
      grievance_id: id,
      status: 'Submitted',
      occurred_at: nowIso,
      updated_by: 'Citizen',
      role: 'CITIZEN',
      remarks: 'Complaint registered successfully by Citizen',
    });
    if (historyError) {
      await db.from('grievances').delete().eq('id', id);
      fail(historyError);
    }

    if (input.attachments.length > 0) {
      const { error: attachmentError } = await db.from('grievance_attachments').insert(
        storedAttachments.map((a) => ({ ...a, grievance_id: id, uploaded_at: nowIso })),
      );
      if (attachmentError) {
        await db.from('grievances').delete().eq('id', id);
        for (const storagePath of storedPaths) await removeEvidence(storagePath);
        fail(attachmentError);
      }
    }

    res.status(201).json(await loadGrievance(db, id));
  }));

  app.get('/api/grievances/:id/attachments/:attachmentId', authenticate, handle(async (req, user, res) => {
    const db = requireDb();
    const grievanceId = routeId(req);
    const attachmentId = req.params.attachmentId;
    if (typeof attachmentId !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(attachmentId)) throw new HttpError(400, 'Invalid attachment identifier.');
    const row = await loadAccessibleRow(db, user, grievanceId);
    const attachment = (row.grievance_attachments ?? []).find((item) => item.attachment_id === attachmentId);
    if (!attachment) throw new HttpError(404, 'Attachment not found.');
    if (!attachment.storage_path) {
      return res.redirect(attachment.url);
    }
    try {
      const blob = await downloadEvidence(attachment.storage_path);
      res.setHeader('Content-Type', attachment.mime_type || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${attachment.name.replace(/[^A-Za-z0-9._-]/g, '_')}"`);
      res.setHeader('Cache-Control', 'private, no-store');
      res.send(Buffer.from(await blob.arrayBuffer()));
    } catch {
      throw new HttpError(404, 'Attachment could not be retrieved.');
    }
  }));

  app.post('/api/grievances/:id/status', authenticate, handle(async (req, user, res) => {
    const db = requireDb();
    const id = routeId(req);
    const b = asRecord(req.body);
    const status = oneOf(b.status, ADMIN_STATUSES, 'status');
    const remarks = reqString(b.remarks, 'remarks', 1000, 0);
    const evidenceUrl = optString(b.evidenceUrl, 'evidenceUrl', 2000);

    const current = await fetchGrievanceRow(db, id);
    if (!current) throw new HttpError(404, 'Grievance not found');
    if (!canTransition(current.status, status)) throw new HttpError(409, 'That grievance status transition is not allowed.');

    if (evidenceUrl && !/^https:\/\//i.test(evidenceUrl)) {
      throw new HttpError(400, 'Resolution evidence must use an HTTPS URL.');
    }
    if (status === 'Resolved' && !evidenceUrl) {
      throw new HttpError(400, 'Resolution evidence is required before marking a grievance resolved.');
    }

    const nowIso = new Date().toISOString();
    const patch: Record<string, unknown> = { status, updated_at: nowIso };
    if (status === 'Resolved') {
      patch.resolved_at = nowIso;
      patch.resolution_remarks = remarks;
      patch.resolution_evidence_url = evidenceUrl;
    }
    const { error: updateError } = await db.from('grievances').update(patch).eq('id', id);
    if (updateError) fail(updateError);

    const { error: historyError } = await db.from('grievance_status_history').insert({
      grievance_id: id,
      status,
      occurred_at: nowIso,
      updated_by: (user.email || 'Administrator').slice(0, 254),
      role: 'ADMIN',
      remarks,
      evidence_url: evidenceUrl ?? null,
    });
    if (historyError) fail(historyError);

    await writeAudit(db, user, 'STATUS_UPDATE', `Updated ${id} to ${status}`, id);
    res.json(await loadGrievance(db, id));
  }, { admin: true }));

  app.post('/api/grievances/:id/assign', authenticate, handle(async (req, user, res) => {
    const db = requireDb();
    const id = routeId(req);
    const b = asRecord(req.body);
    const officerId = reqString(b.officerId, 'officerId', 100);
    const adminName = optString(b.adminName, 'adminName', 120);

    if (!(await fetchGrievanceRow(db, id))) throw new HttpError(404, 'Grievance not found');
    const { data: officer, error: officerError } = await db
      .from('officers')
      .select('id, name, designation, phone')
      .eq('id', officerId)
      .maybeSingle();
    if (officerError) fail(officerError);
    if (!officer) throw new HttpError(404, 'Officer record not found.');

    const nowIso = new Date().toISOString();
    const { error: updateError } = await db.from('grievances').update({
      status: 'Assigned',
      assigned_officer_id: officerId,
      assigned_officer_name: `${officer.name} (${officer.designation})`,
      assigned_officer_phone: officer.phone,
      assigned_at: nowIso,
      updated_at: nowIso,
    }).eq('id', id);
    if (updateError) fail(updateError);

    const { error: historyError } = await db.from('grievance_status_history').insert({
      grievance_id: id,
      status: 'Assigned',
      occurred_at: nowIso,
      updated_by: adminName || 'System Admin',
      role: 'ADMIN',
      remarks: `Assigned to Field Officer ID: ${officerId}`,
    });
    if (historyError) fail(historyError);

    await writeAudit(db, user, 'OFFICER_ASSIGNMENT', `Assigned ${id} to officer ${officerId}`, id);
    res.json(await loadGrievance(db, id));
  }, { admin: true }));

  app.post('/api/grievances/:id/feedback', authenticate, handle(async (req, user, res) => {
    const db = requireDb();
    const id = routeId(req);
    const row = await fetchGrievanceRow(db, id);
    if (!row || row.citizen_id !== user.uid) {
      throw new HttpError(403, 'You can only provide feedback for your own grievance.');
    }
    const b = asRecord(req.body);
    const rating = Math.max(1, Math.min(5, Math.round(Number(b.rating) || 1)));
    const nowIso = new Date().toISOString();
    const { error } = await db.from('grievances').update({
      feedback_rating: rating,
      feedback_comment: String(b.comment ?? '').slice(0, 1000),
      feedback_satisfied: Boolean(b.isResolvedSatisfied),
      feedback_submitted_at: nowIso,
      updated_at: nowIso,
    }).eq('id', id);
    if (error) fail(error);
    res.json(await loadGrievance(db, id));
  }));

  app.get('/api/admin/departments', authenticate, handle(async (_req, _user, res) => {
    const db = requireDb();
    const { data, error } = await db.from('departments').select('*').order('name');
    if (error) fail(error);
    res.json(((data ?? []) as DepartmentRow[]).map(toDepartment));
  }, { admin: true }));

  app.get('/api/admin/officers', authenticate, handle(async (_req, _user, res) => {
    const db = requireDb();
    const { data, error } = await db.from('officers').select('*').order('name');
    if (error) fail(error);
    res.json(((data ?? []) as OfficerRow[]).map(toOfficer));
  }, { admin: true }));

  app.get('/api/admin/audit-logs', authenticate, handle(async (_req, _user, res) => {
    const db = requireDb();
    const { data, error } = await db
      .from('audit_logs')
      .select('*')
      .order('occurred_at', { ascending: false })
      .limit(200);
    if (error) fail(error);
    res.json(((data ?? []) as AuditLogRow[]).map(toAuditLog));
  }, { admin: true }));

  app.post('/api/admin/audit-logs', authenticate, handle(async (req, user, res) => {
    const db = requireDb();
    const b = asRecord(req.body);
    const action = reqString(b.action, 'action', 100);
    const details = reqString(b.details, 'details', 2000, 0);
    const grievanceId = optString(b.grievanceId, 'grievanceId', 100);
    const linked = grievanceId && (await fetchGrievanceRow(db, grievanceId)) ? grievanceId : undefined;
    await writeAudit(db, user, action, details, linked);
    res.status(201).json({ ok: true });
  }, { admin: true }));
}
