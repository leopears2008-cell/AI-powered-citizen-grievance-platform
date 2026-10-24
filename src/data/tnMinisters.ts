export interface TNMinisterProfile {
  id: number;
  name: string;
  designation: string;
  constituency: string | null;
  party: string;
  portfolio: string;
  appointmentDate: string | null;
  previousOffices: string | null;
  education: string | null;
  profession: string | null;
  birthplace: string | null;
  dateOfBirth: string | null;
  electionHistory: string | null;
  affidavitSource: string | null;
  photoSource: string | null;
  sourceUrl: string;
  verificationNote: string;
}

const SOURCE_URL = 'https://lokbhavan.tn.gov.in/';

// Keep the directory empty until each current minister, portfolio and constituency
// is verified against a specific official government order or official roster page.
const ministers: TNMinisterProfile[] = [];

export const getAllTNMinisters = (): TNMinisterProfile[] => ministers;

export const getMinisterParties = (): string[] =>
  ['All Parties', ...Array.from(new Set(ministers.map((minister) => minister.party))).sort()];

export const getMinisterSourceInfo = () => ({
  sourceName: 'Official roster verification required',
  sourceUrl: SOURCE_URL,
  rosterSize: ministers.length,
  verificationNote: 'No minister records are published until current names, portfolios and constituencies are verified against official source documents.',
});
