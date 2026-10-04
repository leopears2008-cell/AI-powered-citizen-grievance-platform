import type { Express, RequestHandler } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { analyzeGrievance, scoreDuplicate } from './grievanceIntelligence';
import { getSupabase } from './supabase';

type AuthenticatedRequest = Request & { user?: { uid: string; email?: string; email_verified?: boolean; isAnonymous: boolean } };

const ACTIVE = ['Submitted','AI Classified','Under Review','Assigned','In Progress','Reopened'] as const;

function dbOrNull() { return getSupabase(); }

function clamp(n:number,min=0,max=1){return Math.max(min,Math.min(max,n));}

function publicDistrictName(value: unknown){ return typeof value === 'string' && value.trim() ? value.trim().slice(0,80) : 'Unknown'; }

export async function buildPublicTransparency(db: SupabaseClient) {
  const rows: any[] = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await db.from('grievances')
      .select('id,category,priority,status,location_district,location_lat,location_lng,created_at,resolved_at,target_resolution_date,feedback_rating,feedback_satisfied')
      .range(from, from + 499);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 500 || rows.length >= 10000) break;
  }
  const total = rows.length;
  const resolved = rows.filter(r => r.status === 'Resolved').length;
  const active = rows.filter(r => r.status !== 'Resolved' && r.status !== 'Rejected').length;
  const breached = rows.filter(r => r.status !== 'Resolved' && r.status !== 'Rejected' && r.target_resolution_date && new Date(r.target_resolution_date).getTime() < Date.now()).length;
  const verified = rows.filter(r => r.status === 'Resolved' && r.feedback_satisfied === true).length;

  const districtMap = new Map<string,{district:string,total:number,active:number,resolved:number,lat:number|null,lng:number|null}>();
  const cells = new Map<string,{lat:number,lng:number,count:number}>();
  const categoryMap = new Map<string,number>();
  for (const r of rows) {
    const district = publicDistrictName(r.location_district);
    const existing = districtMap.get(district) ?? { district,total:0,active:0,resolved:0,lat:null,lng:null };
    existing.total++;
    if (r.status === 'Resolved') existing.resolved++; else if (r.status !== 'Rejected') existing.active++;
    if (typeof r.location_lat === 'number' && typeof r.location_lng === 'number') {
      existing.lat = existing.lat ?? r.location_lat; existing.lng = existing.lng ?? r.location_lng;
      const lat = Math.round(r.location_lat * 100) / 100;
      const lng = Math.round(r.location_lng * 100) / 100;
      const key = lat + ':' + lng;
      const cell = cells.get(key) ?? { lat, lng, count:0 };
      cell.count++; cells.set(key, cell);
    }
    const category = typeof r.category === 'string' ? r.category : 'Other';
    categoryMap.set(category,(categoryMap.get(category) ?? 0)+1);
    districtMap.set(district,existing);
  }
  const feedback = rows.filter(r => typeof r.feedback_rating === 'number');
  const avgRating = feedback.length ? Number((feedback.reduce((s,r)=>s+Number(r.feedback_rating),0)/feedback.length).toFixed(1)) : null;
  return {
    generatedAt: new Date().toISOString(),
    metrics: { total, active, resolved, breached, verified, resolutionRate: total ? Math.round(resolved/total*100) : 0, averageRating: avgRating },
    districts: [...districtMap.values()].sort((a,b)=>b.total-a.total).slice(0,50),
    categories: [...categoryMap.entries()].map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value),
    heatmap: [...cells.values()].filter(c=>c.count >= 2).slice(0,500),
  };
}

export async function runAutomaticEscalationScan(db: SupabaseClient) {
  const now = Date.now();
  const { data, error } = await db.from('grievances')
    .select('id,department_id,department_name,status,created_at,target_resolution_date,escalated_at')
    .in('status', [...ACTIVE])
    .not('target_resolution_date','is',null)
    .limit(1000);
  if (error) throw error;
  let escalated = 0;
  const results: Array<{id:string;level:number;reason:string}> = [];
  for (const row of data ?? []) {
    const target = new Date(row.target_resolution_date).getTime();
    const created = new Date(row.created_at).getTime();
    if (!Number.isFinite(target) || !Number.isFinite(created) || target <= created) continue;
    const progress = clamp((now-created)/(target-created),0,2);
    const level = progress >= 1 ? 3 : progress >= .9 ? 2 : progress >= .75 ? 1 : 0;
    if (!level || !row.department_id) continue;
    const lastEscalated = row.escalated_at ? new Date(row.escalated_at).getTime() : 0;
    if (lastEscalated && now-lastEscalated < 24*60*60*1000) continue;
    const reason = level === 3 ? 'Automatic SLA breach escalation: resolution target has passed.' : level === 2 ? 'Automatic SLA escalation: 90% of the resolution window has elapsed.' : 'Automatic SLA warning escalation: 75% of the resolution window has elapsed.';
    const { error: insertError } = await db.from('grievance_escalations').insert({
      id: randomUUID(), grievance_id: row.id, from_department_id: row.department_id, to_department_id: row.department_id,
      reason, created_by: 'system:sla-engine', created_at: new Date(now).toISOString(),
    });
    if (insertError) continue;
    const patch:any = { escalation_reason: reason, escalated_at: new Date(now).toISOString(), escalated_to_department_id: row.department_id, updated_at: new Date(now).toISOString() };
    if (level >= 2 && row.status !== 'Under Review') patch.status = 'Under Review';
    const { error: updateError } = await db.from('grievances').update(patch).eq('id',row.id);
    if (!updateError) { escalated++; results.push({id:String(row.id),level,reason}); }
  }
  return { scanned:(data ?? []).length, escalated, results };
}

export function registerCivicFeatureRoutes(app: Express, authenticate: RequestHandler) {
  app.get('/api/public/transparency', async (_req,res) => {
    const db = dbOrNull();
    if (!db) return res.status(503).json({error:'Grievance data service is not configured.'});
    try {
      const payload = await buildPublicTransparency(db);
      res.setHeader('Cache-Control','public, max-age=30, stale-while-revalidate=60');
      return res.json(payload);
    } catch { return res.status(503).json({error:'Public transparency data is temporarily unavailable.'}); }
  });

  app.post('/api/ai/complaint-quality', authenticate, async (req,res) => {
    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    const category = typeof req.body?.category === 'string' ? req.body.category : undefined;
    const district = typeof req.body?.district === 'string' ? req.body.district : undefined;
    const priority = ['Critical','High','Medium','Low'].includes(req.body?.priority) ? req.body.priority : undefined;
    if (!text || text.length > 10000) return res.status(400).json({error:'Complaint text is required and must be <= 10000 characters.'});
    const base = analyzeGrievance({text,category,district,priority});
    const signals = [
      {name:'description', ok:text.length >= 60, points:25, message:'Add a little more detail about the issue.'},
      {name:'location', ok:!!district || /chennai|madurai|salem|coimbatore|trichy|tiruch|thanjavur|tirunelveli/i.test(text), points:20, message:'Mention the affected area or district.'},
      {name:'impact', ok:/affect|people|house|street|school|hospital|traffic|daily|days|hours|குடும்பம்|மக்கள்|நாள்|மணி/i.test(text), points:15, message:'Explain who or what is affected.'},
      {name:'duration', ok:/day|days|week|month|hour|since|நாள்|வாரம்|மாதம்|மணி/i.test(text), points:15, message:'Mention how long the issue has existed.'},
      {name:'specificity', ok:base.tokens.length >= 5, points:15, message:'Use specific details such as object, service or symptom.'},
      {name:'category', ok:!!category, points:10, message:'Confirm the suggested category.'},
    ];
    const completeness = signals.reduce((s,x)=>s+(x.ok?x.points:0),0);
    const { data: candidates } = dbOrNull() ? await dbOrNull()!.from('grievances').select('id,summary_en,category,location_district,status').in('status',[...ACTIVE]).limit(300) : {data:[]};
    const scored = (candidates ?? [])
      .filter(c => !category || c.category === category || !district || String(c.location_district).toLowerCase() === district.toLowerCase())
      .map(c => ({id:String(c.id),score:scoreDuplicate(text,String(c.summary_en ?? '')),category:String(c.category),district:String(c.location_district),status:String(c.status)}))
      .filter(c=>c.score>=0.25).sort((a,b)=>b.score-a.score).slice(0,5);
    const duplicateProbability = scored.length ? Number(clamp(scored[0].score).toFixed(2)) : 0;
    return res.json({
      completenessScore: completeness,
      qualityBand: completeness >= 85 ? 'Ready' : completeness >= 65 ? 'Needs minor details' : 'Needs more detail',
      missingFields: signals.filter(x=>!x.ok).map(x=>x.message),
      routing: base.departmentId,
      routingReason: base.departmentReason,
      severity: base.severity,
      severityReason: base.severityReason,
      slaDays: base.slaDays,
      duplicateProbability,
      duplicates: scored,
    });
  });

  app.post('/api/admin/escalation-scan', authenticate, async (req,res) => {
    const user=(req as unknown as AuthenticatedRequest).user;
    const db=dbOrNull();
    if (!user || user.isAnonymous || user.email_verified !== true || !db) return res.status(403).json({error:'Administrator access required.'});
    const {data:admin}=await db.from('admins').select('active').eq('id',user.uid).maybeSingle();
    if (admin?.active !== true) return res.status(403).json({error:'Administrator access required.'});
    try { return res.json(await runAutomaticEscalationScan(db)); } catch { return res.status(500).json({error:'Escalation scan failed.'}); }
  });
}
