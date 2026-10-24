export interface MLAProfile {
  name: string;
  constituency: string;
  district: string;
  phone: string;
  email: string;
  party: string;
  avatar: string;
  officeAddress?: string;
  pincodes?: string[];
  locations?: string[];
}

// Do not publish an unverified or potentially outdated elected-representative list.
// Populate this map only from a current official Tamil Nadu Assembly source, with a source URL
// and verification date recorded for each imported dataset.
const mlaMap: Record<string, Partial<MLAProfile>> = {};

const defaultConstituencies = ['North', 'South', 'Central', 'East', 'West'];

export const getAvailableDistricts = (): string[] => {
  return ['All Districts', ...Object.keys(mlaMap).sort()];
};

export const getAllMLAs = (): MLAProfile[] => {
  const all: MLAProfile[] = [];
  Object.keys(mlaMap).forEach(d => {
    getConstituenciesForDistrict(d).forEach(c => {
      all.push(getMLAForConstituency(d, c));
    });
  });
  return all;
};

export const getConstituenciesForDistrict = (district: string): string[] => {
  if (district === 'All Districts') {
    return Object.values(mlaMap).map((profile) => profile.constituency).filter((value): value is string => Boolean(value)).sort();
  }

  const hq = mlaMap[district]?.constituency;
  if (!hq) return [];
  
  // Only return constituencies explicitly present in the dataset. Never invent generic seats.
};

export const getMLAForConstituency = (district: string, constituency: string): MLAProfile => {
  if (district === 'All Districts') {
    // Find the actual district for this constituency
    for (const d of Object.keys(mlaMap)) {
      const constituencies = getConstituenciesForDistrict(d);
      if (constituencies.includes(constituency)) {
        return getMLAForConstituency(d, constituency);
      }
    }
    return { name: 'Unverified representative', constituency, district: '', phone: '', email: '', party: '', avatar: '' };
  }

  const hq = mlaMap[district];
  const isHQ = hq?.constituency === constituency;
  
  const name = isHQ ? hq.name! : 'Unverified representative';
  const party = isHQ ? hq.party! : '';

  return {
    name,
    constituency,
    district,
    phone: isHQ ? '' : '',
    email: isHQ ? '' : '',
    party,
    avatar: ''
  };
};

export const getMLAForDistrict = (district: string): MLAProfile => {
  const hq = mlaMap[district] || { name: 'Unverified representative', constituency: district, party: '' };
  return getMLAForConstituency(district, hq.constituency!);
};
