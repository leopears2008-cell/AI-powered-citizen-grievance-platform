import { TN_ASSEMBLY_2026, DATA_SOURCE, type SeatRecord } from './tnAssembly2026';
import { SEAT_OVERLAY, DIRECTORY_AS_OF } from './directoryOverlay';

export { DATA_SOURCE, DIRECTORY_AS_OF };

export interface MLAProfile {
  /** Constituency number (1-234); 0 when the seat is unknown */
  no: number;
  name: string;
  constituency: string;
  district: string;
  party: string;
  status: 'Elected' | 'Vacant' | 'Unknown';
  /** Vacancy reason or by-election context (shown for vacant / recently filled seats) */
  note?: string;
  /** Office or portfolio: Chief Minister, Cabinet Minister (...), Speaker, Floor Leader, ... */
  role?: string;
  /** Other spellings of the constituency name, searchable but not displayed */
  aliases: string[];
  /** Reserved-seat category parsed from the constituency label */
  reserved?: 'SC' | 'ST';
  /** Contact details are intentionally empty: none are published without an official source. */
  phone: string;
  email: string;
  avatar: string;
  officeAddress?: string;
  pincodes?: string[];
  locations?: string[];
}

const VACANT_LABEL = 'Seat vacant';
const UNKNOWN_LABEL = 'Unverified representative';

const toProfile = (seat: SeatRecord): MLAProfile => {
  const o = SEAT_OVERLAY[seat.no] ?? {};
  const constituency = o.label ?? seat.constituency;
  const status = o.status ?? seat.status;
  const vacant = status === 'Vacant';
  const name = vacant ? VACANT_LABEL : o.name ?? seat.mla ?? VACANT_LABEL;
  const byElection = o.note !== undefined;
  return {
    no: seat.no,
    name,
    constituency,
    district: seat.district,
    party: o.party ?? seat.party ?? '',
    status,
    // Roster notes carry alliance commentary; surface only vacancy / by-election context.
    note: byElection ? o.note : vacant ? seat.note : undefined,
    role: vacant ? undefined : o.role,
    aliases: constituency !== seat.constituency ? [seat.constituency] : [],
    reserved: /\(SC\)$/.test(constituency) ? 'SC' : /\(ST\)$/.test(constituency) ? 'ST' : undefined,
    phone: '',
    email: '',
    avatar: '',
  };
};

const PROFILES: MLAProfile[] = TN_ASSEMBLY_2026.map(toProfile);

export const DISTRICT_NAMES: string[] = Array.from(new Set(PROFILES.map((p) => p.district))).sort((a, b) =>
  a.localeCompare(b)
);

/** Constituency label without the reservation suffix, e.g. "Poonamallee (SC)" -> "Poonamallee" */
export const plainConstituency = (label: string): string => label.replace(/\s*\((SC|ST)\)$/, '');

export const getAvailableDistricts = (): string[] => ['All Districts', ...DISTRICT_NAMES];

export const getAllMLAs = (): MLAProfile[] => PROFILES;

export const getConstituenciesForDistrict = (district: string): string[] =>
  (district === 'All Districts' ? PROFILES : PROFILES.filter((p) => p.district === district)).map(
    (p) => p.constituency
  );

export const getMLAForConstituency = (district: string, constituency: string): MLAProfile => {
  const match = PROFILES.find(
    (p) => p.constituency === constituency && (district === 'All Districts' || p.district === district)
  );
  return (
    match ?? {
      no: 0,
      name: UNKNOWN_LABEL,
      constituency,
      district: district === 'All Districts' ? '' : district,
      party: '',
      status: 'Unknown',
      aliases: [],
      phone: '',
      email: '',
      avatar: '',
    }
  );
};

/** A district has many MLAs, so there is no single representative to return. */
export const getMLAForDistrict = (district: string): MLAProfile => ({
  no: 0,
  name: UNKNOWN_LABEL,
  constituency: district,
  district,
  party: '',
  status: 'Unknown',
  aliases: [],
  phone: '',
  email: '',
  avatar: '',
});
