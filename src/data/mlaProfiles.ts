import { TN_ASSEMBLY_2026, DATA_SOURCE, type SeatRecord } from './tnAssembly2026';

/**
 * MLAProfile is the shape consumed by the UI (MLADirectory, and any future
 * consumer). It is derived from an election-result snapshot, not a live
 * membership register. Verify current office-holder claims with official sources.
 *
 * IMPORTANT: we do NOT fabricate personal phone numbers or email addresses
 * for MLAs; no authoritative source publishes a uniform, verified directory
 * of those for all 234 seats. `phone`/`email` are intentionally left
 * undefined so the UI can show a "contact via official channel" state
 * instead of a fake number, per the no-invented-data requirement.
 */
export interface MLAProfile {
  name: string;
  constituency: string;
  district: string;
  party: string;
  avatar: string;
  status: 'Elected' | 'Vacant';
  constituencyNumber: number;
  note?: string;
  /** Present only for vacant seats — never an invented name. */
  vacancyNote?: string;
  phone?: string;
  email?: string;
  officeAddress?: string;
  pincodes?: string[];
  locations?: string[];
  sourceName: string;
  sourceUrl: string;
  snapshotCompiledAt: string;
}

const toProfile = (seat: SeatRecord): MLAProfile => {
  const isVacant = seat.status === 'Vacant';
  const displayName = isVacant ? 'Seat Vacant — By-election Pending' : (seat.mla as string);

  return {
    name: displayName,
    constituency: seat.constituency,
    district: seat.district,
    party: isVacant ? `${seat.party ?? 'Unknown'} (last held)` : (seat.party ?? 'Unknown'),
    avatar: '/avatar-placeholder.svg',
    status: seat.status,
    constituencyNumber: seat.no,
    note: seat.note,
    vacancyNote: isVacant ? seat.note : undefined,
    sourceName: DATA_SOURCE.sourceName,
    sourceUrl: DATA_SOURCE.sourceUrl,
    snapshotCompiledAt: DATA_SOURCE.snapshotCompiledAt,
  };
};

const ALL_PROFILES: MLAProfile[] = TN_ASSEMBLY_2026.map(toProfile);

export const getAvailableDistricts = (): string[] => {
  const districts = Array.from(new Set(TN_ASSEMBLY_2026.map((s) => s.district))).sort();
  return ['All Districts', ...districts];
};

export const getAllMLAs = (): MLAProfile[] => ALL_PROFILES;

export const getConstituenciesForDistrict = (district: string): string[] => {
  if (district === 'All Districts') {
    return ALL_PROFILES.map((m) => m.constituency).sort();
  }
  return ALL_PROFILES.filter((m) => m.district === district)
    .map((m) => m.constituency)
    .sort();
};

export const getMLAForConstituency = (district: string, constituency: string): MLAProfile | undefined => {
  if (district === 'All Districts') {
    return ALL_PROFILES.find((m) => m.constituency === constituency);
  }
  return ALL_PROFILES.find((m) => m.district === district && m.constituency === constituency);
};

export const getMLAForDistrict = (district: string): MLAProfile | undefined => {
  return ALL_PROFILES.find((m) => m.district === district);
};

export const getDataSourceInfo = () => DATA_SOURCE;
