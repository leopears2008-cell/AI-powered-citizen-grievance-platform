export interface MLAProfile {
  name: string;
  constituency: string;
  district: string;
  phone: string;
  email: string;
  party: string;
  avatar: string;
  officeAddress?: string;
}

const mlaMap: Record<string, Partial<MLAProfile>> = {
  'Ariyalur': { name: 'Thiru. K. Chinnappa', constituency: 'Ariyalur', party: 'DMK' },
  'Chengalpattu': { name: 'Thiru. M. Varalakshmi', constituency: 'Chengalpattu', party: 'DMK' },
  'Chennai': { name: 'Thiru. Udhayanidhi Stalin', constituency: 'Chepauk-Thiruvallikeni', party: 'DMK' },
  'Coimbatore': { name: 'Thiru. Amman K. Arjunan', constituency: 'Coimbatore North', party: 'AIADMK' },
  'Cuddalore': { name: 'Thiru. G. Iyappan', constituency: 'Cuddalore', party: 'DMK' },
  'Dharmapuri': { name: 'Thiru. S. P. Venkateshwaran', constituency: 'Dharmapuri', party: 'PMK' },
  'Dindigul': { name: 'Thiru. I. Periyasamy', constituency: 'Athoor', party: 'DMK' },
  'Erode': { name: 'Thiru. E. V. K. S. Elangovan', constituency: 'Erode East', party: 'INC' },
  'Kallakurichi': { name: 'Thiru. M. Senthilkumar', constituency: 'Kallakurichi', party: 'AIADMK' },
  'Kanchipuram': { name: 'Thiru. C. V. M. P. Ezhilarasan', constituency: 'Kanchipuram', party: 'DMK' },
  'Kanyakumari': { name: 'Thiru. M. R. Gandhi', constituency: 'Nagercoil', party: 'BJP' },
  'Karur': { name: 'Thiru. V. Senthilbalaji', constituency: 'Karur', party: 'DMK' },
  'Krishnagiri': { name: 'Thiru. K. Ashokkumar', constituency: 'Krishnagiri', party: 'AIADMK' },
  'Madurai': { name: 'Thiru. G. Thalapathi', constituency: 'Madurai North', party: 'DMK' },
  'Mayiladuthurai': { name: 'Thiru. S. Rajakumar', constituency: 'Mayiladuthurai', party: 'INC' },
  'Nagapattinam': { name: 'Thiru. Aloor Sha Navas', constituency: 'Nagapattinam', party: 'VCK' },
  'Namakkal': { name: 'Thiru. P. Ramalingam', constituency: 'Namakkal', party: 'DMK' },
  'Nilgiris': { name: 'Thiru. J. Hutches', constituency: 'Udhagamandalam', party: 'INC' },
  'Perambalur': { name: 'Thiru. M. Prabhakaran', constituency: 'Perambalur', party: 'DMK' },
  'Pudukkottai': { name: 'Thiru. V. Muthuraja', constituency: 'Pudukkottai', party: 'DMK' },
  'Ramanathapuram': { name: 'Thiru. K. Muthuramalingam', constituency: 'Ramanathapuram', party: 'DMK' },
  'Ranipet': { name: 'Thiru. R. Gandhi', constituency: 'Ranipet', party: 'DMK' },
  'Salem': { name: 'Thiru. R. Rajendran', constituency: 'Salem North', party: 'DMK' },
  'Sivaganga': { name: 'Thiru. PR. Senthilnathan', constituency: 'Sivaganga', party: 'AIADMK' },
  'Tenkasi': { name: 'Thiru. S. Palani Nadar', constituency: 'Tenkasi', party: 'INC' },
  'Thanjavur': { name: 'Thiru. T. K. G. Neelamegam', constituency: 'Thanjavur', party: 'DMK' },
  'Theni': { name: 'Thiru. O. Panneerselvam', constituency: 'Bodinayakanur', party: 'IND' },
  'Thoothukudi': { name: 'Thiru. Geetha Jeevan', constituency: 'Thoothukudi', party: 'DMK' },
  'Tiruchirappalli': { name: 'Thiru. K. N. Nehru', constituency: 'Tiruchirappalli West', party: 'DMK' },
  'Tirunelveli': { name: 'Thiru. Nainar Nagenthran', constituency: 'Tirunelveli', party: 'BJP' },
  'Tirupathur': { name: 'Thiru. A. Nallathambi', constituency: 'Tirupathur', party: 'DMK' },
  'Tiruppur': { name: 'Thiru. K. Selvaraj', constituency: 'Tiruppur South', party: 'DMK' },
  'Tiruvallur': { name: 'Thiru. V. G. Raajendran', constituency: 'Tiruvallur', party: 'DMK' },
  'Tiruvannamalai': { name: 'Thiru. E. V. Velu', constituency: 'Tiruvannamalai', party: 'DMK' },
  'Tiruvarur': { name: 'Thiru. Poondi K. Kalaivanan', constituency: 'Tiruvarur', party: 'DMK' },
  'Vellore': { name: 'Thiru. P. Karthikeyan', constituency: 'Vellore', party: 'DMK' },
  'Viluppuram': { name: 'Thiru. R. Lakshmanan', constituency: 'Viluppuram', party: 'DMK' },
  'Virudhunagar': { name: 'Thiru. A. R. R. Srinivasan', constituency: 'Virudhunagar', party: 'DMK' }
};

const defaultConstituencies = ['North', 'South', 'Central', 'East', 'West'];

export const getConstituenciesForDistrict = (district: string): string[] => {
  const hq = mlaMap[district]?.constituency;
  if (!hq) return defaultConstituencies.map(c => `${district} ${c}`);
  
  // Return the main HQ constituency, plus a few generic ones for selection
  return [
    hq,
    ...defaultConstituencies.map(c => `${district} ${c}`).filter(c => c !== hq)
  ];
};

export const getMLAForConstituency = (district: string, constituency: string): MLAProfile => {
  const hq = mlaMap[district];
  const isHQ = hq?.constituency === constituency;
  
  const name = isHQ ? hq.name! : `Thiru. Representative (${constituency})`;
  const party = isHQ ? hq.party! : 'IND';

  return {
    name,
    constituency,
    district,
    phone: '+91 94440 00000',
    email: `mla.${constituency.toLowerCase().replace(/[^a-z0-9]/g, '')}@tn.gov.in`,
    party,
    officeAddress: `Constituency MLA Office, Main Road, ${constituency}, ${district} District, Tamil Nadu.`,
    avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=e0e7ff&color=3730a3&bold=true'
  };
};

export const getMLAForDistrict = (district: string): MLAProfile => {
  const hq = mlaMap[district] || { name: 'Constituency MLA', constituency: district, party: 'Rep' };
  return getMLAForConstituency(district, hq.constituency!);
};
