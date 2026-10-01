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
}

interface GrievanceRow {
  id: string;
  track_id: string;
  title: string;
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
  resolution_verification_token: string | null;
  feedback_rating: number | null;
  feedback_comment: string | null;
  feedback_satisfied: boolean | null;
  feedback_submitted_at: string | null;
  entities: Grievance['entities'] | null;
  is_duplicate_of: string | null;
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
  'Submitted', 'AI Classified', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Reopened', 'Rejected',
];
const PHONE_PATTERN = /^[+]?[0-9 ()-]{7,30}$/;
const EMAIL_PATTERN = /^[^ @]+@[^ @]+[.][^ @]+$/;
const DATA_URL_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]*={0,2}$/;
const PDF_DATA_URL_PATTERN = /^data:application\/pdf;base64,[A-Za-z0-9+/]*={0,2}$/;
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
    url: a.url,
    name: a.name,
    type: a.type,
    uploadedAt: toIso(a.uploaded_at),
  }));

  return {
    id: row.id,
    trackId: row.track_id,
    ...(row.citizen_id ? { citizenId: row.citizen_id } : {}),
    ...(row.verification_method ? { verificationMethod: row.verification_method } : {}),
    title: row.title,
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
    ...(row.resolution_verification_token ? { resolutionVerificationToken: row.resolution_verification_token } : {}),
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

async function createNotification(
  db: SupabaseClient,
  grievance: { id: string; citizen_id: string | null },
  type: string,
  title: string,
  message: string,
  deterministicId?: string,
): Promise<void> {
  if (!grievance.citizen_id) return;
  const { error } = await db.from('grievance_notifications').insert({
    id: deterministicId ?? `notif-${Date.now()}-${randomUUID().slice(0, 10)}`,
    grievance_id: grievance.id,
    citizen_id: grievance.citizen_id,
    type,
    title: title.slice(0, 200),
    message: message.slice(0, 1000),
  });
  if (error && error.code !== '23505') fail(error);
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
    const type = a.type;
    if ((type === 'image' && !DATA_URL_PATTERN.test(url)) || (type === 'document' && !PDF_DATA_URL_PATTERN.test(url))) {
      bad('attachment');
    }
    if (type !== 'image' && type !== 'document') bad('attachment');
    return {
      attachment_id: reqString(a.id, 'attachment id', 80),
      url,
      name: reqString(a.name, 'attachment name', 120, 0),
      type: type as 'image' | 'document',
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
    title: reqString(b.title ?? b.summaryEn ?? 'Citizen Grievance', 'title', 200),
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
    const now = new Date();
    const nowIso = now.toISOString();

    // Department SLA is the authoritative configurable target; AI's estimate is only a fallback.
    let slaDays = input.estimatedDays;
    if (input.departmentId) {
      const { data: department, error: departmentError } = await db
        .from('departments')
        .select('sla_days')
        .eq('id', input.departmentId)
        .maybeSingle();
      if (departmentError) fail(departmentError);
      if (department?.sla_days && Number(department.sla_days) > 0) {
        slaDays = Math.min(365, Math.max(0, Number(department.sla_days)));
      }
    }

    const { error: insertError } = await db.from('grievances').insert({
      id,
      track_id: id,
      citizen_id: user.uid,
      verification_method: user.phone_number ? 'phone' : 'email',
      title: input.title,
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
      target_resolution_date: new Date(now.getTime() + slaDays * 86400000).toISOString(),
      estimated_days: slaDays,
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
        input.attachments.map((a) => ({ ...a, grievance_id: id, uploaded_at: nowIso })),
      );
      if (attachmentError) {
        await db.from('grievances').delete().eq('id', id);
        fail(attachmentError);
      }
    }

    await createNotification(
      db,
      { id, citizen_id: user.uid },
      'info',
      'Grievance submitted',
      `Your grievance ${id} was registered successfully.`,
    );

    res.status(201).json(await loadGrievance(db, id));
  }));

  app.post('/api/grievances/:id/status', authenticate, handle(async (req, user, res) => {
    const db = requireDb();
    const id = routeId(req);
    const b = asRecord(req.body);
    const status = oneOf(b.status, ADMIN_STATUSES, 'status');
    const remarks = reqString(b.remarks, 'remarks', 1000, 0);
    const updatedBy = reqString(b.updatedBy, 'updatedBy', 254, 0);
    const role = oneOf(b.role ?? 'ADMIN', ROLES, 'role');
    const evidenceUrl = optString(b.evidenceUrl, 'evidenceUrl', 600000);

    if (!(await fetchGrievanceRow(db, id))) throw new HttpError(404, 'Grievance not found');

    const nowIso = new Date().toISOString();
    const patch: Record<string, unknown> = { status, updated_at: nowIso };
    if (status === 'Resolved') {
      patch.resolved_at = nowIso;
      patch.resolution_remarks = remarks;
      patch.resolution_verification_token = randomUUID();
      if (evidenceUrl) patch.resolution_evidence_url = evidenceUrl;
    }
    const { error: updateError } = await db.from('grievances').update(patch).eq('id', id);
    if (updateError) fail(updateError);

    const { error: historyError } = await db.from('grievance_status_history').insert({
      grievance_id: id,
      status,
      occurred_at: nowIso,
      updated_by: updatedBy,
      role,
      remarks,
      evidence_url: evidenceUrl ?? null,
    });
    if (historyError) fail(historyError);

    const current = await fetchGrievanceRow(db, id);
    if (current?.citizen_id) {
      await createNotification(
        db,
        current,
        status === 'Resolved' ? 'resolution' : 'status_update',
        status === 'Resolved' ? 'Grievance resolved' : 'Grievance status updated',
        status === 'Resolved'
          ? `Your grievance ${id} has been resolved. You can verify the resolution record.`
          : `Your grievance ${id} is now ${status}.`,
      );
    }
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

    const assignedRow = await fetchGrievanceRow(db, id);
    if (assignedRow) {
      await createNotification(db, assignedRow, 'assignment', 'Officer assigned', `A handling officer has been assigned to grievance ${id}.`);
    }
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

  // Public verification endpoint exposes only non-sensitive resolution metadata.
  app.get('/api/verify/:token', async (req, res) => {
    try {
      const token = typeof req.params.token === 'string' ? req.params.token : '';
      if (!/^[0-9a-f-]{36}$/i.test(token)) {
        res.status(400).json({ verified: false, error: 'Invalid verification token.' });
        return;
      }
      const db = requireDb();
      const { data, error } = await db.from('grievances')
        .select('id, track_id, title, department_name, status, resolved_at, resolution_remarks, assigned_officer_name')
        .eq('resolution_verification_token', token)
        .maybeSingle();
      if (error) fail(error);
      if (!data || data.status !== 'Resolved') {
        res.status(404).json({ verified: false });
        return;
      }
      res.json({
        verified: true,
        grievanceId: data.track_id,
        title: data.title,
        department: data.department_name,
        status: data.status,
        resolvedAt: data.resolved_at,
        resolutionSummary: data.resolution_remarks,
        officerDesignation: data.assigned_officer_name,
      });
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      res.status(status).json({ verified: false, error: error instanceof HttpError ? error.message : 'Verification failed.' });
    }
  });

  app.get('/api/notifications', authenticate, handle(async (_req, user, res) => {
    const db = requireDb();
    const grievances = await listGrievances(db, user.uid);
    const now = Date.now();
    for (const grievance of grievances) {
      if (grievance.status === 'Resolved' || grievance.status === 'Rejected') continue;
      const target = new Date(grievance.targetResolutionDate).getTime();
      const remaining = target - now;
      const warningId = `sla-warning-${grievance.id}`;
      const breachId = `sla-breached-${grievance.id}`;
      if (remaining <= 48 * 3600000 && remaining > 0) {
        await createNotification(db, { id: grievance.id, citizen_id: user.uid }, 'sla_warning', 'SLA approaching', `Your grievance ${grievance.id} is approaching its expected resolution date.`, warningId);
      }
      if (remaining <= 0) {
        await createNotification(db, { id: grievance.id, citizen_id: user.uid }, 'sla_breached', 'SLA breached', `The expected resolution date for grievance ${grievance.id} has passed.`, breachId);
      }
    }
    const { data, error } = await db.from('grievance_notifications')
      .select('*')
      .eq('citizen_id', user.uid)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) fail(error);
    res.json((data ?? []).map((n: any) => ({
      id: n.id, grievanceId: n.grievance_id, title: n.title, titleTa: n.title,
      message: n.message, messageTa: n.message, type: n.type, read: n.read, createdAt: n.created_at,
    })));
  }));

  app.post('/api/notifications/:id/read', authenticate, handle(async (req, user, res) => {
    const db = requireDb();
    const id = routeId(req);
    const { error } = await db.from('grievance_notifications').update({ read: true }).eq('id', id).eq('citizen_id', user.uid);
    if (error) fail(error);
    res.json({ ok: true });
  }));

  app.post('/api/grievances/:id/accept', authenticate, handle(async (req, user, res) => {
    const db = requireDb();
    const id = routeId(req);
    const row = await fetchGrievanceRow(db, id);
    if (!row || row.citizen_id !== user.uid) throw new HttpError(404, 'Grievance not found.');
    if (row.status !== 'Resolved') throw new HttpError(409, 'Only resolved grievances can be accepted.');
    const nowIso = new Date().toISOString();
    const { error } = await db.from('grievances').update({
      feedback_satisfied: true,
      feedback_submitted_at: nowIso,
      updated_at: nowIso,
    }).eq('id', id);
    if (error) fail(error);
    res.json(await loadGrievance(db, id));
  }));

  app.post('/api/grievances/:id/appeal', authenticate, handle(async (req, user, res) => {
    const db = requireDb();
    const id = routeId(req);
    const row = await fetchGrievanceRow(db, id);
    if (!row || row.citizen_id !== user.uid) throw new HttpError(404, 'Grievance not found.');
    if (row.status !== 'Resolved') throw new HttpError(409, 'Only resolved grievances can be appealed.');
    const reason = reqString(asRecord(req.body).reason, 'reason', 2000);
    const appealId = `APL-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const nowIso = new Date().toISOString();
    const { error: appealError } = await db.from('grievance_appeals').insert({
      id: appealId, grievance_id: id, citizen_id: user.uid, reason, status: 'Submitted',
      created_at: nowIso, updated_at: nowIso,
    });
    if (appealError) fail(appealError);
    const { error: updateError } = await db.from('grievances').update({ status: 'Reopened', updated_at: nowIso }).eq('id', id);
    if (updateError) fail(updateError);
    const { error: historyError } = await db.from('grievance_status_history').insert({
      grievance_id: id, status: 'Reopened', occurred_at: nowIso, updated_by: 'Citizen',
      role: 'CITIZEN', remarks: `Appeal submitted: ${reason.slice(0, 500)}`,
    });
    if (historyError) fail(historyError);
    await createNotification(db, row, 'appeal', 'Appeal submitted', `Your appeal for grievance ${id} was submitted.`);
    res.status(201).json(await loadGrievance(db, id));
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
