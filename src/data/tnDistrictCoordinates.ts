// Approximate district centroids for Tamil Nadu (latitude, longitude).
// Used only to place district-level markers; never a citizen's exact location.
export type LatLng = [number, number];

const DISTRICT_CENTROIDS: Record<string, LatLng> = {
  ariyalur: [11.14, 79.08],
  chengalpattu: [12.69, 79.98],
  chennai: [13.08, 80.27],
  coimbatore: [11.02, 76.96],
  cuddalore: [11.75, 79.77],
  dharmapuri: [12.13, 78.16],
  dindigul: [10.36, 77.98],
  erode: [11.34, 77.72],
  kallakurichi: [11.74, 78.96],
  kanchipuram: [12.83, 79.7],
  kanyakumari: [8.08, 77.54],
  karur: [10.96, 78.08],
  krishnagiri: [12.52, 78.21],
  madurai: [9.93, 78.12],
  mayiladuthurai: [11.1, 79.65],
  nagapattinam: [10.77, 79.84],
  namakkal: [11.22, 78.17],
  nilgiris: [11.41, 76.7],
  perambalur: [11.23, 78.88],
  pudukkottai: [10.38, 78.82],
  ramanathapuram: [9.37, 78.83],
  ranipet: [12.93, 79.33],
  salem: [11.66, 78.15],
  sivaganga: [9.85, 78.48],
  tenkasi: [8.96, 77.31],
  thanjavur: [10.79, 79.14],
  theni: [10.01, 77.48],
  thoothukudi: [8.76, 78.13],
  tiruchirappalli: [10.79, 78.7],
  tirunelveli: [8.71, 77.76],
  tirupathur: [12.5, 78.57],
  tiruppur: [11.11, 77.34],
  tiruvallur: [13.14, 79.91],
  tiruvannamalai: [12.23, 79.07],
  tiruvarur: [10.77, 79.64],
  vellore: [12.92, 79.13],
  viluppuram: [11.94, 79.49],
  virudhunagar: [9.58, 77.96],
};

// Common alternative spellings that may appear in source data.
const ALIASES: Record<string, string> = {
  trichy: 'tiruchirappalli',
  tiruchi: 'tiruchirappalli',
  tuticorin: 'thoothukudi',
  nilgiri: 'nilgiris',
  kancheepuram: 'kanchipuram',
  villupuram: 'viluppuram',
};

const normalize = (name: string): string =>
  name.toLowerCase().replace(/[^a-z]/g, '');

export const getDistrictCoordinates = (district: string): LatLng | undefined => {
  const key = normalize(district);
  const resolved = ALIASES[key] ?? key;
  return DISTRICT_CENTROIDS[resolved];
};
