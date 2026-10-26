/**
 * Overlay from the project's "Tamil Nadu 38 Districts SLA & 234 MLA Directory Spec".
 *
 * `tnAssembly2026.ts` is the sourced base roster (ECI results, snapshot of 19 Sep 2026).
 * This overlay layers on top of it, keyed by constituency number (AC):
 *   - `role`   portfolio / office from the spec (Chief Minister, Cabinet Minister (...), Speaker, ...)
 *   - `label`  official constituency spelling / reservation suffix where the spec differs from the base roster
 *   - `name`   MLA name form used in the spec where it differs from the base roster
 *   - AC 35 and AC 101: filled by the 6 Oct 2026 by-election (TVK won both; counted 9 Oct 2026),
 *     which post-dates the base snapshot. Vacancies for the other seats are unchanged.
 */

export interface SeatOverlay {
  label?: string;
  name?: string;
  party?: string;
  role?: string;
  status?: 'Elected' | 'Vacant';
  note?: string;
}

export const DIRECTORY_AS_OF =
  'Base roster: ECI 2026 results as tracked on 19 September 2026, updated for the 6 October 2026 by-election results (counted 9 October 2026)';

export const SEAT_OVERLAY: Record<number, SeatOverlay> = {
  2: { label: 'Ponneri (SC)' },
  11: { role: 'Cabinet Minister (Finance, Planning & Development)' },
  12: { role: 'Hon\'ble Chief Minister of Tamil Nadu' },
  14: { role: 'Cabinet Minister (Public Works, Highways & Sports)' },
  16: { role: 'Cabinet Minister (School Education, Tamil Culture & Info)' },
  19: { role: 'Leader of the Opposition' },
  20: { role: 'Speaker of the Assembly' },
  22: { role: 'Government Whip' },
  24: { role: 'Cabinet Minister (Rural Development, Panchayats & Irrigation)' },
  25: { role: 'Cabinet Minister (Food & Civil Supplies, Consumer Protection)' },
  26: { role: 'Cabinet Minister (AI, Information Technology & Digital Services)' },
  27: { name: 'ECR P. Saravanan' },
  29: { name: 'K. Thennarasu', role: 'Cabinet Minister (Non-Resident Tamils Welfare)' },
  31: { role: 'Cabinet Minister (HR Management & Ex-Servicemen Welfare)' },
  35: { name: 'K. Maragatham Kumaravel', party: 'TVK', status: 'Elected', note: 'Elected in the 6 Oct 2026 by-election (counted 9 Oct 2026)' },
  37: { role: 'Cabinet Minister (Forests)' },
  38: { role: 'Cabinet Minister (Co-operation)' },
  39: { label: 'Sholingur' },
  44: { label: 'Anaikattu' },
  50: { label: 'Tiruppattur' },
  56: { role: 'MLA (Floor Leader, CPI)' },
  59: { role: 'MLA (Floor Leader, PMK)' },
  60: { label: 'Pappireddippatti' },
  72: { role: 'Cabinet Minister (Adi Dravidar & Tribal Welfare)' },
  77: { label: 'Ulundurpettai' },
  80: { name: 'C. Arul Vignesh' },
  86: { role: 'Floor Leader, AIADMK' },
  90: { role: 'Cabinet Minister (Transport & Motor Vehicles)' },
  92: { name: 'D. Logesh Tamilselvan', role: 'Cabinet Minister (Commercial Taxes & Registration)' },
  96: { label: 'Tiruchengodu', role: 'Cabinet Minister (Health, Medical Education & Family Welfare)' },
  97: { role: 'Cabinet Minister (Milk & Dairy Development)' },
  98: { role: 'Cabinet Minister (Handlooms & Textiles)' },
  101: { name: 'P. Sathyabama', party: 'TVK', status: 'Elected', note: 'Elected in the 6 Oct 2026 by-election (counted 9 Oct 2026)' },
  106: { role: 'Leader of the House & Cabinet Minister (Revenue & Disaster Mgmt)' },
  108: { role: 'MLA (Floor Leader, BJP)' },
  112: { role: 'Cabinet Minister (Animal Husbandry)' },
  118: { role: 'Cabinet Minister (Backward Classes & MBC Welfare)' },
  122: { role: 'Cabinet Minister (Prohibition & Excise)' },
  136: { name: 'M. Sathya' },
  139: { role: 'Cabinet Minister (HR&CE)' },
  140: { role: 'Deputy Leader of the Opposition' },
  146: { role: 'Deputy Speaker of the Assembly' },
  152: { role: 'MLA (Floor Leader, DMDK)' },
  155: { role: 'Cabinet Minister (Housing & Urban Development)' },
  158: { name: 'M. Thamimun Ansari' },
  161: { name: 'Y. N. Jamal Mohamed Younoos' },
  168: { name: 'Poondi K. Kalaivanan' },
  170: { label: 'Thiruvidaimarudur (SC)', name: 'Govi. Chezhiaan' },
  171: { role: 'Cabinet Minister (Agriculture & Horticulture)' },
  172: { role: 'Cabinet Minister (Minorities Welfare & Wakf Board)' },
  178: { label: 'Gandarvakottai (SC)' },
  183: { role: 'Cabinet Minister (Labour Welfare & Employment)' },
  184: { role: 'Cabinet Minister (Minerals & Mines)' },
  185: { label: 'Tiruppattur', name: 'R. Seenivasa Sethupathy' },
  186: { name: 'A. Kulanthai Rani' },
  188: { role: 'Cabinet Minister (Higher Education, Science & Tech)' },
  195: { role: 'Cabinet Minister (Electricity, Law, Courts & Prisons)' },
  202: { role: 'Cabinet Minister (Social Welfare & Women Empowerment)' },
  205: { role: 'Cabinet Minister (Industries & Investment Promotion)' },
  209: { name: 'Adv. K. K. Kathiravan' },
  210: { role: 'Cabinet Minister (Environment & Climate Change)' },
  214: { role: 'Cabinet Minister (Fisheries)' },
  217: { role: 'Cabinet Minister (Rural & Cottage Industries)' },
  231: { role: 'MLA (Floor Leader, INC)' },
  232: { role: 'MLA (Floor Leader, CPI(M))' },
  234: { role: 'Cabinet Minister (Tourism)' },
};
