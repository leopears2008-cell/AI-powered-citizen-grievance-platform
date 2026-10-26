/**
 * Tamil Nadu 38-district SLA matrix and department SLA standards.
 *
 * Source: the project's "Tamil Nadu 38 Districts SLA & 234 MLA Directory Spec" matrix.
 * Treat these as the platform's reference SLA targets and reported compliance figures,
 * not as a live government feed. Always confirm with the district's official portal.
 *
 * District names follow the constituency roster in `tnAssembly2026.ts`
 * (e.g. "Kanchipuram", "Kanyakumari", "Tirupathur") so the two datasets join cleanly.
 */

export interface DepartmentSla {
  code: string;
  department: string;
  emergency: string;
  standard: string;
  complex: string;
  l1Officer: string;
  l2Officer: string;
}

export interface DistrictSla {
  district: string;
  hq: string;
  /** Number of assembly constituencies in the district */
  acCount: number;
  /** Official district portal host */
  portal: string;
  emergency: string;
  standard: string;
  revenue: string;
  /** Reported SLA compliance, percent */
  compliance: number;
  /** Authority a citizen can escalate to when the district misses its SLA */
  escalation: string;
}

export const SLA_META = {
  source: 'Tamil Nadu 38-district SLA matrix (project specification)',
  totalDistricts: 38,
  totalConstituencies: 234,
};

export const DEPARTMENT_SLA: DepartmentSla[] = [
  { code: 'TANGEDCO', department: 'Electricity & Power Supply', emergency: '4-6 Hours', standard: '24 Hours', complex: '7 Days', l1Officer: 'Assistant Executive Engineer (AEE)', l2Officer: 'Superintending Engineer (SE)' },
  { code: 'MAWS', department: 'Municipal Admin & Water Supply', emergency: '12-24 Hours', standard: '3 Days', complex: '15 Days', l1Officer: 'Municipal Commissioner / Zonal Officer', l2Officer: 'Regional Director of Municipal Admin' },
  { code: 'PWD', department: 'Public Works & Highways', emergency: '24 Hours', standard: '7 Days', complex: '30 Days', l1Officer: 'Assistant Divisional Engineer (ADE)', l2Officer: 'Divisional Engineer / District Collector' },
  { code: 'REVENUE', department: 'Revenue & Disaster Management', emergency: '6 Hours', standard: '15 Days', complex: '30 Days', l1Officer: 'Tahsildar', l2Officer: 'Revenue Divisional Officer (RDO) / DRO' },
  { code: 'HEALTH', department: 'Health & Family Welfare', emergency: '2 Hours', standard: '24 Hours', complex: '7 Days', l1Officer: 'Block Medical Officer (BMO)', l2Officer: 'Deputy Director of Health Services' },
  { code: 'POLICE', department: 'Police & Public Safety', emergency: '30 Mins', standard: '48 Hours', complex: '15 Days', l1Officer: 'Inspector of Police', l2Officer: 'DSP / Superintendent of Police' },
  { code: 'CIVIL', department: 'Food & Civil Supplies (PDS)', emergency: '24 Hours', standard: '7 Days', complex: '15 Days', l1Officer: 'Taluk Supply Officer (TSO)', l2Officer: 'District Supply Officer (DSO)' },
  { code: 'TRANSPORT', department: 'TNSTC & Transport Dept', emergency: '24 Hours', standard: '7 Days', complex: '30 Days', l1Officer: 'Branch Manager (TNSTC)', l2Officer: 'Regional Transport Officer (RTO)' },
];

// [district, hq, acCount, portal prefix (<prefix>.nic.in), emergency, standard, revenue, compliance %]
type Row = [string, string, number, string, string, string, string, number];

const ROWS: Row[] = [
  ['Ariyalur', 'Ariyalur', 2, 'ariyalur', '6 Hrs', '48 Hrs', '15 Days', 95.8],
  ['Chengalpattu', 'Chengalpattu', 6, 'chengalpattu', '6 Hrs', '24 Hrs', '15 Days', 96.4],
  ['Chennai', 'Chennai', 22, 'chennai', '4 Hrs', '24 Hrs', '10 Days', 98.2],
  ['Coimbatore', 'Coimbatore', 10, 'coimbatore', '4 Hrs', '24 Hrs', '12 Days', 98.6],
  ['Cuddalore', 'Cuddalore', 9, 'cuddalore', '6 Hrs', '48 Hrs', '15 Days', 95.2],
  ['Dharmapuri', 'Dharmapuri', 5, 'dharmapuri', '6 Hrs', '48 Hrs', '15 Days', 94.9],
  ['Dindigul', 'Dindigul', 7, 'dindigul', '6 Hrs', '36 Hrs', '15 Days', 96.1],
  ['Erode', 'Erode', 8, 'erode', '6 Hrs', '24 Hrs', '12 Days', 97.5],
  ['Kallakurichi', 'Kallakurichi', 4, 'kallakurichi', '6 Hrs', '48 Hrs', '15 Days', 94.6],
  ['Kanchipuram', 'Kancheepuram', 3, 'kancheepuram', '6 Hrs', '24 Hrs', '12 Days', 97.1],
  ['Kanyakumari', 'Nagercoil', 6, 'kanniyakumari', '6 Hrs', '36 Hrs', '14 Days', 97.3],
  ['Karur', 'Karur', 4, 'karur', '6 Hrs', '36 Hrs', '14 Days', 96.8],
  ['Krishnagiri', 'Krishnagiri', 6, 'krishnagiri', '6 Hrs', '36 Hrs', '15 Days', 95.7],
  ['Madurai', 'Madurai', 10, 'madurai', '4 Hrs', '24 Hrs', '12 Days', 97.9],
  ['Mayiladuthurai', 'Mayiladuthurai', 3, 'mayiladuthurai', '6 Hrs', '48 Hrs', '15 Days', 95.1],
  ['Nagapattinam', 'Nagapattinam', 3, 'nagapattinam', '6 Hrs', '48 Hrs', '15 Days', 95.6],
  ['Namakkal', 'Namakkal', 6, 'namakkal', '6 Hrs', '36 Hrs', '14 Days', 97.2],
  ['Nilgiris', 'Udhagamandalam', 3, 'nilgiris', '4 Hrs', '24 Hrs', '14 Days', 96.9],
  ['Perambalur', 'Perambalur', 2, 'perambalur', '6 Hrs', '48 Hrs', '15 Days', 96.0],
  ['Pudukkottai', 'Pudukkottai', 6, 'pudukkottai', '6 Hrs', '48 Hrs', '15 Days', 95.4],
  ['Ramanathapuram', 'Ramanathapuram', 4, 'ramanathapuram', '6 Hrs', '48 Hrs', '15 Days', 94.8],
  ['Ranipet', 'Ranipet', 4, 'ranipet', '6 Hrs', '36 Hrs', '15 Days', 96.2],
  ['Salem', 'Salem', 11, 'salem', '4 Hrs', '24 Hrs', '12 Days', 98.4],
  ['Sivaganga', 'Sivaganga', 4, 'sivaganga', '6 Hrs', '48 Hrs', '15 Days', 95.5],
  ['Tenkasi', 'Tenkasi', 5, 'tenkasi', '6 Hrs', '36 Hrs', '15 Days', 96.3],
  ['Thanjavur', 'Thanjavur', 8, 'thanjavur', '6 Hrs', '36 Hrs', '14 Days', 96.7],
  ['Theni', 'Theni', 4, 'theni', '6 Hrs', '36 Hrs', '14 Days', 96.5],
  ['Thoothukudi', 'Thoothukudi', 6, 'thoothukudi', '6 Hrs', '36 Hrs', '14 Days', 97.0],
  ['Tiruchirappalli', 'Tiruchirappalli', 9, 'tiruchirappalli', '4 Hrs', '24 Hrs', '12 Days', 98.1],
  ['Tirunelveli', 'Tirunelveli', 5, 'tirunelveli', '6 Hrs', '24 Hrs', '14 Days', 97.4],
  ['Tirupathur', 'Tirupattur', 4, 'tirupathur', '6 Hrs', '48 Hrs', '15 Days', 95.3],
  ['Tiruppur', 'Tiruppur', 8, 'tiruppur', '4 Hrs', '24 Hrs', '12 Days', 97.8],
  ['Tiruvallur', 'Tiruvallur', 6, 'tiruvallur', '6 Hrs', '24 Hrs', '14 Days', 96.9],
  ['Tiruvannamalai', 'Tiruvannamalai', 8, 'tiruvannamalai', '6 Hrs', '48 Hrs', '15 Days', 95.6],
  ['Tiruvarur', 'Tiruvarur', 4, 'tiruvarur', '6 Hrs', '48 Hrs', '15 Days', 95.9],
  ['Vellore', 'Vellore', 5, 'vellore', '6 Hrs', '36 Hrs', '14 Days', 96.6],
  ['Viluppuram', 'Viluppuram', 7, 'viluppuram', '6 Hrs', '48 Hrs', '15 Days', 95.0],
  ['Virudhunagar', 'Virudhunagar', 7, 'virudhunagar', '6 Hrs', '36 Hrs', '14 Days', 96.8],
];

// The spec spells three districts differently from the constituency roster.
const SPEC_SPELLING: Record<string, string> = {
  Kanchipuram: 'Kancheepuram',
  Kanyakumari: 'Kanniyakumari',
  Tirupathur: 'Tirupattur',
};
const ESCALATION_OVERRIDES: Record<string, string> = {
  Chennai: 'Greater Chennai Corp Commissioner / Collector',
};

export const DISTRICT_SLA: DistrictSla[] = ROWS.map(
  ([district, hq, acCount, portal, emergency, standard, revenue, compliance]) => ({
    district,
    hq,
    acCount,
    portal: `${portal}.nic.in`,
    emergency,
    standard,
    revenue,
    compliance,
    escalation: ESCALATION_OVERRIDES[district] ?? `District Collector, ${SPEC_SPELLING[district] ?? district}`,
  })
);

const byDistrict = new Map(DISTRICT_SLA.map((d) => [d.district, d]));

export const getDistrictSla = (district: string): DistrictSla | undefined => byDistrict.get(district);
