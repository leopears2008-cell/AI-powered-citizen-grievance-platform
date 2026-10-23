/**
 * Pure domain helpers for civic evidence, SLA escalation, duplicate grouping,
 * citizen resolution feedback, and Tamil/Tanglish petition drafting.
 *
 * These helpers intentionally do not perform database writes or authenticate
 * users. Call them only from authenticated server routes and persist results
 * with the trusted server-side Supabase client.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type SlaLevel = 1 | 2 | 3;

export interface SlaPolicy {
  level: SlaLevel;
  label: string;
  dueHours: number;
}

export const DEFAULT_SLA_POLICY: readonly SlaPolicy[] = [
  { level: 1, label: 'Ward / Assistant Engineer', dueHours: 24 },
  { level: 2, label: 'Zonal / District Collectorate', dueHours: 48 },
  { level: 3, label: 'State Nodal Officer / CM Special Cell', dueHours: 72 },
] as const;

export function isValidCoordinates(point: Coordinates): boolean {
  return Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    point.latitude >= -90 && point.latitude <= 90 &&
    point.longitude >= -180 && point.longitude <= 180;
}

/** Great-circle distance in metres (Haversine formula). */
export function distanceMetres(a: Coordinates, b: Coordinates): number {
  if (!isValidCoordinates(a) || !isValidCoordinates(b)) {
    throw new RangeError('Both coordinate pairs must be valid latitude/longitude values.');
  }
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(b.latitude - a.latitude);
  const dLon = radians(b.longitude - a.longitude);
  const lat1 = radians(a.latitude);
  const lat2 = radians(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}

/**
 * Checks reported GPS coordinates only. EXIF and browser coordinates are
 * untrusted client evidence; production routes must also authenticate the
 * uploader and validate uploaded file type/size before accepting evidence.
 */
export function isWithinEvidenceRadius(
  before: Coordinates,
  after: Coordinates,
  maxMetres = 50,
): boolean {
  if (!Number.isFinite(maxMetres) || maxMetres < 0) {
    throw new RangeError('maxMetres must be a non-negative finite number.');
  }
  return distanceMetres(before, after) <= maxMetres;
}

export function nextSlaLevel(current: SlaLevel): SlaLevel | null {
  return current < 3 ? (current + 1) as SlaLevel : null;
}

export function escalationTarget(level: SlaLevel): string {
  const policy = DEFAULT_SLA_POLICY.find((item) => item.level === level);
  if (!policy) throw new RangeError('Unknown SLA level.');
  return policy.label;
}

/** Conservative text normalization for candidate matching, not an AI verdict. */
export function normalizeIncidentText(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('en-IN')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenSimilarity(a: string, b: string): number {
  const left = new Set(normalizeIncidentText(a).split(' ').filter((token) => token.length > 2));
  const right = new Set(normalizeIncidentText(b).split(' ').filter((token) => token.length > 2));
  if (left.size === 0 || right.size === 0) return 0;
  let intersection = 0;
  for (const token of left) if (right.has(token)) intersection += 1;
  return intersection / (left.size + right.size - intersection);
}

export interface ResolutionDecision {
  reopen: boolean;
  escalateTo: 'District Collectorate' | null;
  reason: string;
}

export function decideResolutionFeedback(
  rating: number,
  resolved: boolean,
  minimumSatisfiedRating = 3,
): ResolutionDecision {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new RangeError('rating must be an integer from 1 to 5.');
  }
  const reopen = !resolved || rating < minimumSatisfiedRating;
  return {
    reopen,
    escalateTo: reopen ? 'District Collectorate' : null,
    reason: reopen
      ? (!resolved ? 'Citizen reported the issue is not resolved.' : 'Citizen satisfaction rating is below threshold.')
      : 'Citizen confirmed resolution.',
  };
}

export const TAMIL_TANGLISH_PETITION_PROMPT = [
  'Convert the citizen report into a clear, formal Tamil Nadu government grievance.',
  'Input may be Tamil script, colloquial Tamil, Tanglish, or mixed Tamil and English.',
  'Preserve the citizen-provided facts; never invent dates, addresses, evidence, or impacts.',
  'Return structured fields: language, formalTamil, formalEnglish, category, locationIfProvided, urgencyReason, missingDetails.',
  'If a detail is uncertain, put it in missingDetails instead of guessing.',
  'Return a draft for citizen review; do not submit the petition without explicit confirmation.',
].join(' ');
