/**
 * Tamil Nadu Assembly 2026 election result snapshot; this is not a verified live roster.
 *
 * Election results source: https://results.eci.gov.in/ResultAcGenMay2026/
 * The constituency roster and later vacancy/party notes were assembled from
 * secondary reporting. They have not been verified as a live/current roster.
 *
 * Snapshot as tracked by the source page: 19 September 2026.
 * Fetched and transcribed into this repository: 2026-09-29.
 *
 * Do not present later vacancy, party, or office-holder status as current
 * without checking the relevant primary official record.
 *
 * Seven seats were vacant as of the source snapshot (resignations after the
 * 2026 result, ahead of pending by-elections). These are marked status:
 * 'Vacant' with the last-held party and a vacancy note — we do NOT invent a
 * successor name.
 */

export interface SeatRecord {
  no: number;
  constituency: string;
  district: string;
  /** null only when status is 'Vacant' */
  mla: string | null;
  /** Party at time of the 2026 result / last holder if vacant */
  party: string | null;
  /** Free-text note: alliance realignment, ministerial role, resignation reason, etc. */
  note?: string;
  status: 'Elected' | 'Vacant';
}

export const DATA_SOURCE = {
  sourceName: 'Election Commission of India 2026 results; later roster and vacancy notes are secondary-source snapshots',
  sourceUrl: 'https://results.eci.gov.in/ResultAcGenMay2026/',
  crossCheckUrls: [
    'https://www.thehindu.com/elections/tamil-nadu-assembly/tamil-nadu-assembly-election-2026-results-full-list-of-winners/article70908112.ece',
    'https://www.tn.gov.in/minister_list.php',
  ],
  sourceType: 'aggregator_citing_official' as const,
  asOfNote: 'Composition as tracked by the source page as of 19 September 2026',
  snapshotCompiledAt: '2026-09-29',
  totalSeats: 234,
  vacantSeats: 7,
};

export const TN_ASSEMBLY_2026: SeatRecord[] = [
  // Tiruvallur
  { no: 1, constituency: 'Gummidipoondi', district: 'Tiruvallur', mla: 'S. Vijayakumar', party: 'TVK', status: 'Elected' },
  { no: 2, constituency: 'Ponneri', district: 'Tiruvallur', mla: 'M. S. Ravi', party: 'TVK', status: 'Elected' },
  { no: 3, constituency: 'Tiruttani', district: 'Tiruvallur', mla: 'G. Hari', party: 'AIADMK', note: 'Supported TVK govt; later declared support for EPS', status: 'Elected' },
  { no: 4, constituency: 'Thiruvallur', district: 'Tiruvallur', mla: 'T. Arunkumar', party: 'TVK', status: 'Elected' },
  { no: 5, constituency: 'Poonamallee (SC)', district: 'Tiruvallur', mla: 'R. Prakasam', party: 'TVK', status: 'Elected' },
  { no: 6, constituency: 'Avadi', district: 'Tiruvallur', mla: 'R. Ramesh Kumar', party: 'TVK', status: 'Elected' },
  // Chennai
  { no: 7, constituency: 'Maduravoyal', district: 'Chennai', mla: 'P. Rhevanth Charan', party: 'TVK', status: 'Elected' },
  { no: 8, constituency: 'Ambattur', district: 'Chennai', mla: 'G. Balamurugan', party: 'TVK', status: 'Elected' },
  { no: 9, constituency: 'Madavaram', district: 'Chennai', mla: 'M. L. Vijayprabhu', party: 'TVK', status: 'Elected' },
  { no: 10, constituency: 'Thiruvottiyur', district: 'Chennai', mla: 'N. Senthil Kumar', party: 'TVK', status: 'Elected' },
  { no: 11, constituency: 'Dr. Radhakrishnan Nagar', district: 'Chennai', mla: 'N. Marie Wilson', party: 'TVK', note: 'Cabinet Minister (Finance)', status: 'Elected' },
  { no: 12, constituency: 'Perambur', district: 'Chennai', mla: 'C. Joseph Vijay', party: 'TVK', note: 'Chief Minister', status: 'Elected' },
  { no: 13, constituency: 'Kolathur', district: 'Chennai', mla: 'V. S. Babu', party: 'TVK', status: 'Elected' },
  { no: 14, constituency: 'Villivakkam', district: 'Chennai', mla: 'Aadhav Arjuna', party: 'TVK', note: 'Cabinet Minister', status: 'Elected' },
  { no: 15, constituency: 'Thiru-Vi-Ka-Nagar (SC)', district: 'Chennai', mla: 'M. R. Pallavi', party: 'TVK', status: 'Elected' },
  { no: 16, constituency: 'Egmore (SC)', district: 'Chennai', mla: 'A. Rajmohan', party: 'TVK', note: 'Cabinet Minister', status: 'Elected' },
  { no: 17, constituency: 'Royapuram', district: 'Chennai', mla: 'K. V. Vijay Damu', party: 'TVK', status: 'Elected' },
  { no: 18, constituency: 'Harbour', district: 'Chennai', mla: 'P. K. Sekar Babu', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 19, constituency: 'Chepauk-Thiruvallikeni', district: 'Chennai', mla: 'Udhayanidhi Stalin', party: 'DMK', note: 'Leader of the Opposition', status: 'Elected' },
  { no: 20, constituency: 'Thousand Lights', district: 'Chennai', mla: 'J. C. D. Prabhakar', party: 'TVK', note: 'Speaker of the Assembly', status: 'Elected' },
  { no: 21, constituency: 'Anna Nagar', district: 'Chennai', mla: 'V. K. Ramkumar', party: 'TVK', status: 'Elected' },
  { no: 22, constituency: 'Virugampakkam', district: 'Chennai', mla: 'R. Sabarinathan', party: 'TVK', note: 'Government Whip', status: 'Elected' },
  { no: 23, constituency: 'Saidapet', district: 'Chennai', mla: 'M. Arul Prakasam', party: 'TVK', status: 'Elected' },
  { no: 24, constituency: 'Thiyagarayanagar', district: 'Chennai', mla: 'Bussy N. Anand', party: 'TVK', note: 'Cabinet Minister', status: 'Elected' },
  { no: 25, constituency: 'Mylapore', district: 'Chennai', mla: 'P. Venkataramanan', party: 'TVK', note: 'Cabinet Minister', status: 'Elected' },
  { no: 26, constituency: 'Velachery', district: 'Chennai', mla: 'R. Kumar', party: 'TVK', note: 'Cabinet Minister (AI, IT & Digital Services)', status: 'Elected' },
  { no: 27, constituency: 'Sholinganallur', district: 'Chennai', mla: 'P. Saravanan', party: 'TVK', status: 'Elected' },
  { no: 28, constituency: 'Alandur', district: 'Chennai', mla: 'M. Harish', party: 'TVK', status: 'Elected' },
  // Kanchipuram
  { no: 29, constituency: 'Sriperumbudur (SC)', district: 'Kanchipuram', mla: 'Thennarasu K.', party: 'TVK', note: 'Cabinet Minister', status: 'Elected' },
  // Chengalpattu
  { no: 30, constituency: 'Pallavaram', district: 'Chengalpattu', mla: 'J. Kamatchi', party: 'TVK', status: 'Elected' },
  { no: 31, constituency: 'Tambaram', district: 'Chengalpattu', mla: 'D. Sarathkumar', party: 'TVK', note: 'Cabinet Minister', status: 'Elected' },
  { no: 32, constituency: 'Chengalpattu', district: 'Chengalpattu', mla: 'S. Thiyagarajan', party: 'TVK', status: 'Elected' },
  { no: 33, constituency: 'Thiruporur', district: 'Chengalpattu', mla: 'B. Vijayaraj', party: 'TVK', status: 'Elected' },
  { no: 34, constituency: 'Cheyyur (SC)', district: 'Chengalpattu', mla: 'E. Rajasekar', party: 'AIADMK', note: 'Opposed TVK govt', status: 'Elected' },
  { no: 35, constituency: 'Madurantakam (SC)', district: 'Chengalpattu', mla: null, party: 'AIADMK', note: 'Won as Maragatham Kumaravel (AIADMK, supported TVK); resigned 25 May 2026 and joined TVK — seat vacant pending by-election', status: 'Vacant' },
  // Kanchipuram
  { no: 36, constituency: 'Uthiramerur', district: 'Kanchipuram', mla: 'J. Munirathinam', party: 'TVK', status: 'Elected' },
  { no: 37, constituency: 'Kancheepuram', district: 'Kanchipuram', mla: 'R. V. Ranjithkumar', party: 'TVK', note: 'Cabinet Minister (Forests)', status: 'Elected' },
  // Ranipet
  { no: 38, constituency: 'Arakkonam (SC)', district: 'Ranipet', mla: 'V. Gandhiraj', party: 'TVK', note: 'Cabinet Minister (Co-operation)', status: 'Elected' },
  { no: 39, constituency: 'Sholinghur', district: 'Ranipet', mla: 'G. Kapil', party: 'TVK', status: 'Elected' },
  // Vellore
  { no: 40, constituency: 'Katpadi', district: 'Vellore', mla: 'M. Sudhakar', party: 'TVK', status: 'Elected' },
  // Ranipet
  { no: 41, constituency: 'Ranipet', district: 'Ranipet', mla: 'I. Thahira', party: 'TVK', status: 'Elected' },
  { no: 42, constituency: 'Arcot', district: 'Ranipet', mla: 'S. M. Sukumar', party: 'AIADMK', note: 'Supported TVK; later declared support for EPS', status: 'Elected' },
  // Vellore
  { no: 43, constituency: 'Vellore', district: 'Vellore', mla: 'M. M. Vinoth Kannan', party: 'TVK', status: 'Elected' },
  { no: 44, constituency: 'Anaicut', district: 'Vellore', mla: 'D. Velazhagan', party: 'AIADMK', note: 'Opposed TVK govt', status: 'Elected' },
  { no: 45, constituency: 'Kilvaithinankuppam (SC)', district: 'Vellore', mla: 'E. Thenral Kumar', party: 'TVK', status: 'Elected' },
  { no: 46, constituency: 'Gudiyatham (SC)', district: 'Vellore', mla: 'K. Sindhu', party: 'TVK', status: 'Elected' },
  // Tirupathur
  { no: 47, constituency: 'Vaniyambadi', district: 'Tirupathur', mla: 'Syed Farooq Basha', party: 'IUML', note: 'Won as SPA candidate; party switched to TVK+ post-election', status: 'Elected' },
  { no: 48, constituency: 'Ambur', district: 'Tirupathur', mla: 'A. C. Vilwanathan', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 49, constituency: 'Jolarpet', district: 'Tirupathur', mla: 'K. C. Veeramani', party: 'AIADMK', note: 'Supported TVK; later declared support for EPS', status: 'Elected' },
  { no: 50, constituency: 'Tirupattur', district: 'Tirupathur', mla: 'N. Thirupathi', party: 'TVK', status: 'Elected' },
  // Krishnagiri
  { no: 51, constituency: 'Uthangarai (SC)', district: 'Krishnagiri', mla: 'N. Elaiyaraja', party: 'TVK', status: 'Elected' },
  { no: 52, constituency: 'Bargur', district: 'Krishnagiri', mla: 'E. C. Govindarasan', party: 'AIADMK', note: 'Opposed TVK govt', status: 'Elected' },
  { no: 53, constituency: 'Krishnagiri', district: 'Krishnagiri', mla: 'P. Mukundhan', party: 'TVK', status: 'Elected' },
  { no: 54, constituency: 'Veppanahalli', district: 'Krishnagiri', mla: 'P. S. Srinivasan', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 55, constituency: 'Hosur', district: 'Krishnagiri', mla: 'P. Balakrishna Reddy', party: 'AIADMK', note: 'Supported TVK; later declared support for EPS', status: 'Elected' },
  { no: 56, constituency: 'Thalli', district: 'Krishnagiri', mla: 'T. Ramachandran', party: 'CPI', note: 'Won as SPA candidate; party gave outside support to TVK govt', status: 'Elected' },
  // Dharmapuri
  { no: 57, constituency: 'Palacode', district: 'Dharmapuri', mla: 'K. P. Anbalagan', party: 'AIADMK', note: 'Supported TVK; later declared support for EPS', status: 'Elected' },
  { no: 58, constituency: 'Pennagaram', district: 'Dharmapuri', mla: 'S. Gajendran', party: 'TVK', status: 'Elected' },
  { no: 59, constituency: 'Dharmapuri', district: 'Dharmapuri', mla: 'Sowmiya Anbumani', party: 'PMK', note: 'AIADMK+; PMK floor leader', status: 'Elected' },
  { no: 60, constituency: 'Pappireddipatti', district: 'Dharmapuri', mla: 'Maragatham Vetrivel', party: 'AIADMK', note: 'Supported TVK; later declared support for EPS', status: 'Elected' },
  { no: 61, constituency: 'Harur (SC)', district: 'Dharmapuri', mla: 'V. Sampathkumar', party: 'AIADMK', note: 'Opposed TVK govt', status: 'Elected' },
  // Tiruvannamalai
  { no: 62, constituency: 'Chengam (SC)', district: 'Tiruvannamalai', mla: 'T. S. Velu', party: 'AIADMK', note: 'Opposed TVK govt', status: 'Elected' },
  { no: 63, constituency: 'Tiruvannamalai', district: 'Tiruvannamalai', mla: 'E. V. Velu', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 64, constituency: 'Kilpennathur', district: 'Tiruvannamalai', mla: 'S. Ramachandran', party: 'AIADMK', note: 'Opposed TVK govt', status: 'Elected' },
  { no: 65, constituency: 'Kalasapakkam', district: 'Tiruvannamalai', mla: 'Agri S. S. Krishnamurthy', party: 'AIADMK', note: 'Opposed TVK govt', status: 'Elected' },
  { no: 66, constituency: 'Polur', district: 'Tiruvannamalai', mla: 'R. Abhishek', party: 'TVK', status: 'Elected' },
  { no: 67, constituency: 'Arani', district: 'Tiruvannamalai', mla: 'L. Jaya Sudha', party: 'AIADMK', note: 'Opposed TVK govt', status: 'Elected' },
  { no: 68, constituency: 'Cheyyar', district: 'Tiruvannamalai', mla: 'Mukkur N. Subramanian', party: 'AIADMK', note: 'Opposed TVK govt', status: 'Elected' },
  { no: 69, constituency: 'Vandavasi (SC)', district: 'Tiruvannamalai', mla: 'S. Ambethkumar', party: 'DMK', note: 'SPA', status: 'Elected' },
  // Viluppuram
  { no: 70, constituency: 'Gingee', district: 'Viluppuram', mla: 'A. Ganeshkumar', party: 'PMK', note: 'AIADMK+', status: 'Elected' },
  { no: 71, constituency: 'Mailam', district: 'Viluppuram', mla: 'C. Ve. Shanmugam', party: 'AIADMK', note: 'Supported TVK; later declared support for EPS', status: 'Elected' },
  { no: 72, constituency: 'Tindivanam (SC)', district: 'Viluppuram', mla: 'Vanni Arasu', party: 'VCK', note: 'Won as SPA candidate; switched to TVK+; Cabinet Minister', status: 'Elected' },
  { no: 73, constituency: 'Vanur (SC)', district: 'Viluppuram', mla: 'D. Gowtham', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 74, constituency: 'Villupuram', district: 'Viluppuram', mla: 'R. Lakshmanan', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 75, constituency: 'Vikravandi', district: 'Viluppuram', mla: 'C. Sivakumar', party: 'PMK', note: 'AIADMK+', status: 'Elected' },
  { no: 76, constituency: 'Tirukkoyilur', district: 'Viluppuram', mla: 'S. Palaniswamy', party: 'AIADMK', note: 'Opposed TVK govt', status: 'Elected' },
  // Kallakurichi
  { no: 77, constituency: 'Ulundurpet', district: 'Kallakurichi', mla: 'G. R. Vasanthavel', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 78, constituency: 'Rishivandiyam', district: 'Kallakurichi', mla: 'K. Karthikeyan', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 79, constituency: 'Sankarapuram', district: 'Kallakurichi', mla: 'R. Rakesh', party: 'AIADMK', note: 'Supported TVK; later declared support for EPS', status: 'Elected' },
  { no: 80, constituency: 'Kallakurichi (SC)', district: 'Kallakurichi', mla: 'Arul Vignesh', party: 'TVK', status: 'Elected' },
  // Salem
  { no: 81, constituency: 'Gangavalli (SC)', district: 'Salem', mla: 'A. Nallathambi', party: 'AIADMK', note: 'Opposed TVK govt', status: 'Elected' },
  { no: 82, constituency: 'Attur (SC)', district: 'Salem', mla: 'A. P. Jayasankaran', party: 'AIADMK', note: 'Opposed TVK govt', status: 'Elected' },
  { no: 83, constituency: 'Yercaud (ST)', district: 'Salem', mla: 'P. Usharani', party: 'AIADMK', note: 'Opposed TVK govt', status: 'Elected' },
  { no: 84, constituency: 'Omalur', district: 'Salem', mla: 'R. Mani', party: 'AIADMK', note: 'Opposed TVK govt', status: 'Elected' },
  { no: 85, constituency: 'Mettur', district: 'Salem', mla: 'G. Venkatachalam', party: 'AIADMK', note: 'Opposed TVK govt', status: 'Elected' },
  { no: 86, constituency: 'Edappadi', district: 'Salem', mla: 'Edappadi K. Palaniswami', party: 'AIADMK', note: 'Opposed TVK govt', status: 'Elected' },
  { no: 87, constituency: 'Sankari', district: 'Salem', mla: 'S. Vetrivel', party: 'AIADMK', note: 'Opposed TVK govt', status: 'Elected' },
  { no: 88, constituency: 'Salem West', district: 'Salem', mla: 'S. Lakshmanan', party: 'TVK', status: 'Elected' },
  { no: 89, constituency: 'Salem North', district: 'Salem', mla: 'K. Sivakumar', party: 'TVK', status: 'Elected' },
  { no: 90, constituency: 'Salem South', district: 'Salem', mla: 'Vijay Tamilan Parthiban', party: 'TVK', note: 'Cabinet Minister (Transport)', status: 'Elected' },
  { no: 91, constituency: 'Veerapandi', district: 'Salem', mla: 'M. S. Palanivel', party: 'TVK', status: 'Elected' },
  // Namakkal
  { no: 92, constituency: 'Rasipuram (SC)', district: 'Namakkal', mla: 'Logesh Tamilselvan', party: 'TVK', note: 'Cabinet Minister (Commercial Taxes)', status: 'Elected' },
  { no: 93, constituency: 'Senthamangalam (ST)', district: 'Namakkal', mla: 'P. Chandrasekar', party: 'TVK', status: 'Elected' },
  { no: 94, constituency: 'Namakkal', district: 'Namakkal', mla: 'C. S. Dileep', party: 'TVK', status: 'Elected' },
  { no: 95, constituency: 'Paramathi-Velur', district: 'Namakkal', mla: 'S. Sekar', party: 'AIADMK', note: 'Supported TVK; later declared support for EPS', status: 'Elected' },
  { no: 96, constituency: 'Tiruchengode', district: 'Namakkal', mla: 'K. G. Arunraj', party: 'TVK', note: 'Cabinet Minister (Health)', status: 'Elected' },
  { no: 97, constituency: 'Kumarapalayam', district: 'Namakkal', mla: 'C. Vijayalakshmi', party: 'TVK', note: 'Cabinet Minister (Milk & Dairy Development)', status: 'Elected' },
  // Erode
  { no: 98, constituency: 'Erode East', district: 'Erode', mla: 'M. Vijay Balaji', party: 'TVK', note: 'Cabinet Minister (Handlooms & Textiles)', status: 'Elected' },
  { no: 99, constituency: 'Erode West', district: 'Erode', mla: 'K. K. Anand Mohan', party: 'TVK', status: 'Elected' },
  { no: 100, constituency: 'Modakkurichi', district: 'Erode', mla: 'D. Shanmugan', party: 'TVK', status: 'Elected' },
  // Tiruppur
  { no: 101, constituency: 'Dharapuram (SC)', district: 'Tiruppur', mla: null, party: 'AIADMK', note: 'Won as P. Sathyabama (AIADMK, supported TVK); resigned 25 May 2026 and joined TVK — seat vacant pending by-election', status: 'Vacant' },
  { no: 102, constituency: 'Kangayam', district: 'Tiruppur', mla: 'N. S. N. Nataraj', party: 'AIADMK', note: 'Supported TVK; later declared support for EPS', status: 'Elected' },
  // Erode
  { no: 103, constituency: 'Perundurai', district: 'Erode', mla: null, party: 'AIADMK', note: 'Won as S. Jayakumar (AIADMK, supported TVK); resigned 25 May 2026 and joined TVK — seat vacant pending by-election', status: 'Vacant' },
  { no: 104, constituency: 'Bhavani', district: 'Erode', mla: 'K. C. Karuppannan', party: 'AIADMK', note: 'Opposed TVK govt', status: 'Elected' },
  { no: 105, constituency: 'Anthiyur', district: 'Erode', mla: 'P. Haribaskar', party: 'AIADMK', note: 'Supported TVK; later declared support for EPS', status: 'Elected' },
  { no: 106, constituency: 'Gobichettipalayam', district: 'Erode', mla: 'K. A. Sengottaiyan', party: 'TVK', note: 'Cabinet Minister; Leader of the House', status: 'Elected' },
  { no: 107, constituency: 'Bhavanisagar (SC)', district: 'Erode', mla: 'V. P. Tamilselvi', party: 'TVK', status: 'Elected' },
  // Nilgiris
  { no: 108, constituency: 'Udhagamandalam', district: 'Nilgiris', mla: 'M. Bhojarajan', party: 'BJP', note: 'AIADMK+; BJP floor leader', status: 'Elected' },
  { no: 109, constituency: 'Gudalur (SC)', district: 'Nilgiris', mla: 'M. Dravidamani', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 110, constituency: 'Coonoor', district: 'Nilgiris', mla: 'M. Raju', party: 'DMK', note: 'SPA', status: 'Elected' },
  // Coimbatore
  { no: 111, constituency: 'Mettuppalayam', district: 'Coimbatore', mla: 'N. Sunil Anand', party: 'TVK', status: 'Elected' },
  // Tiruppur
  { no: 112, constituency: 'Avanashi (SC)', district: 'Tiruppur', mla: 'S. Kamali', party: 'TVK', note: 'Cabinet Minister (Animal Husbandry)', status: 'Elected' },
  { no: 113, constituency: 'Tiruppur North', district: 'Tiruppur', mla: 'V. Sathyabama', party: 'TVK', status: 'Elected' },
  { no: 114, constituency: 'Tiruppur South', district: 'Tiruppur', mla: 'S. Balamurugan', party: 'TVK', status: 'Elected' },
  { no: 115, constituency: 'Palladam', district: 'Tiruppur', mla: 'K. Ramkumar', party: 'TVK', status: 'Elected' },
  // Coimbatore
  { no: 116, constituency: 'Sulur', district: 'Coimbatore', mla: 'N. M. Sukumar', party: 'TVK', status: 'Elected' },
  { no: 117, constituency: 'Kavundampalayam', district: 'Coimbatore', mla: 'Kanimozhi Santhosh', party: 'TVK', status: 'Elected' },
  { no: 118, constituency: 'Coimbatore North', district: 'Coimbatore', mla: 'V. Sampathkumar', party: 'TVK', note: 'Cabinet Minister (BC/MBC Welfare)', status: 'Elected' },
  { no: 119, constituency: 'Thondamuthur', district: 'Coimbatore', mla: 'S. P. Velumani', party: 'AIADMK', note: 'Supported TVK; later declared support for EPS', status: 'Elected' },
  { no: 120, constituency: 'Coimbatore South', district: 'Coimbatore', mla: 'V. Senthilbalaji', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 121, constituency: 'Singanallur', district: 'Coimbatore', mla: 'K. S. Sri Giri Prasath', party: 'TVK', status: 'Elected' },
  { no: 122, constituency: 'Kinathukadavu', district: 'Coimbatore', mla: 'K. Vignesh', party: 'TVK', note: 'Cabinet Minister (Prohibition & Excise)', status: 'Elected' },
  { no: 123, constituency: 'Pollachi', district: 'Coimbatore', mla: 'K. Nithyanandhan', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 124, constituency: 'Valparai (SC)', district: 'Coimbatore', mla: 'A. Sudhakar', party: 'DMK', note: 'SPA', status: 'Elected' },
  // Tiruppur
  { no: 125, constituency: 'Udumalaipettai', district: 'Tiruppur', mla: 'M. Jayakumar', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 126, constituency: 'Madathukulam', district: 'Tiruppur', mla: 'R. Jayaramakrishnan', party: 'DMK', note: 'SPA', status: 'Elected' },
  // Dindigul
  { no: 127, constituency: 'Palani', district: 'Dindigul', mla: 'K. Ravimanoharan', party: 'AIADMK', note: 'Supported TVK; later declared support for EPS', status: 'Elected' },
  { no: 128, constituency: 'Oddanchatram', district: 'Dindigul', mla: 'R. Sakkarapani', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 129, constituency: 'Athoor', district: 'Dindigul', mla: 'I. Periyasamy', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 130, constituency: 'Nilakkottai (SC)', district: 'Dindigul', mla: 'R. Ayyanar', party: 'TVK', status: 'Elected' },
  { no: 131, constituency: 'Natham', district: 'Dindigul', mla: 'Natham R. Viswanathan', party: 'AIADMK', note: 'Supported TVK; later declared support for EPS', status: 'Elected' },
  { no: 132, constituency: 'Dindigul', district: 'Dindigul', mla: 'I. P. Senthilkumar', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 133, constituency: 'Vedasandur', district: 'Dindigul', mla: 'T. Saminathan', party: 'DMK', note: 'SPA', status: 'Elected' },
  // Karur
  { no: 134, constituency: 'Aravakurichi', district: 'Karur', mla: 'R. Elango', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 135, constituency: 'Karur', district: 'Karur', mla: null, party: 'AIADMK', note: 'Won as M. R. Vijayabhaskar (AIADMK, supported TVK); resigned 29 June 2026 — seat vacant pending by-election', status: 'Vacant' },
  { no: 136, constituency: 'Krishnarayapuram (SC)', district: 'Karur', mla: 'Sathya M.', party: 'TVK', status: 'Elected' },
  { no: 137, constituency: 'Kulithalai', district: 'Karur', mla: 'Suriyanur A. Chandran', party: 'DMK', note: 'SPA', status: 'Elected' },
  // Tiruchirappalli
  { no: 138, constituency: 'Manapparai', district: 'Tiruchirappalli', mla: 'R. Kathiravan', party: 'TVK', status: 'Elected' },
  { no: 139, constituency: 'Srirangam', district: 'Tiruchirappalli', mla: 'S. Ramesh', party: 'TVK', note: 'Cabinet Minister (HR&CE)', status: 'Elected' },
  { no: 140, constituency: 'Tiruchirappalli West', district: 'Tiruchirappalli', mla: 'K. N. Nehru', party: 'DMK', note: 'SPA; Deputy Leader of the Opposition', status: 'Elected' },
  { no: 141, constituency: 'Tiruchirappalli East', district: 'Tiruchirappalli', mla: null, party: 'TVK', note: 'Won by C. Joseph Vijay (TVK), who resigned this seat 10 May 2026 to retain Perambur — seat vacant pending by-election', status: 'Vacant' },
  { no: 142, constituency: 'Thiruverumbur', district: 'Tiruchirappalli', mla: 'Navalpattu S. Viji', party: 'TVK', status: 'Elected' },
  { no: 143, constituency: 'Lalgudi', district: 'Tiruchirappalli', mla: 'Leema Rose Martin', party: 'AIADMK', note: 'Supported TVK; later declared support for EPS', status: 'Elected' },
  { no: 144, constituency: 'Manachanallur', district: 'Tiruchirappalli', mla: 'S. Kathiravan', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 145, constituency: 'Musiri', district: 'Tiruchirappalli', mla: 'M. Vignesh', party: 'TVK', status: 'Elected' },
  { no: 146, constituency: 'Thuraiyur (SC)', district: 'Tiruchirappalli', mla: 'M. Ravisankar', party: 'TVK', note: 'Deputy Speaker of the Assembly', status: 'Elected' },
  // Perambalur
  { no: 147, constituency: 'Perambalur (SC)', district: 'Perambalur', mla: 'K. Sivakumar', party: 'TVK', status: 'Elected' },
  { no: 148, constituency: 'Kunnam', district: 'Perambalur', mla: 'S. S. Sivasankar', party: 'DMK', note: 'SPA', status: 'Elected' },
  // Ariyalur
  { no: 149, constituency: 'Ariyalur', district: 'Ariyalur', mla: 'S. Rajendran', party: 'AIADMK', note: 'Opposed TVK govt', status: 'Elected' },
  { no: 150, constituency: 'Jayankondam', district: 'Ariyalur', mla: 'G. Vaithilingam', party: 'PMK', status: 'Elected' },
  // Cuddalore
  { no: 151, constituency: 'Tittakudi (SC)', district: 'Cuddalore', mla: 'C. V. Ganesan', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 152, constituency: 'Vriddhachalam', district: 'Cuddalore', mla: 'Premallatha Vijayakant', party: 'DMDK', status: 'Elected' },
  { no: 153, constituency: 'Neyveli', district: 'Cuddalore', mla: 'R. Rajendran', party: 'AIADMK', note: 'Opposed TVK govt', status: 'Elected' },
  { no: 154, constituency: 'Panruti', district: 'Cuddalore', mla: 'K. Mohan', party: 'AIADMK', note: 'Supported TVK; later declared support for EPS', status: 'Elected' },
  { no: 155, constituency: 'Cuddalore', district: 'Cuddalore', mla: 'B. Rajkumar', party: 'TVK', note: 'Cabinet Minister (Housing)', status: 'Elected' },
  { no: 156, constituency: 'Kurinjipadi', district: 'Cuddalore', mla: 'M. R. K. Panneerselvam', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 157, constituency: 'Bhuvanagiri', district: 'Cuddalore', mla: 'A. Arunmozhithevan', party: 'AIADMK', note: 'Supported TVK; later declared support for EPS', status: 'Elected' },
  { no: 158, constituency: 'Chidambaram', district: 'Cuddalore', mla: 'M. Thamimum Ansari', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 159, constituency: 'Kattumannarkoil (SC)', district: 'Cuddalore', mla: 'L. E. Jothimani', party: 'VCK', note: 'Won as SPA candidate; switched to TVK+', status: 'Elected' },
  // Mayiladuthurai
  { no: 160, constituency: 'Sirkazhi (SC)', district: 'Mayiladuthurai', mla: 'R. Senthilselvan', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 161, constituency: 'Mayiladuthurai', district: 'Mayiladuthurai', mla: 'Jamal Mohamed Younoos', party: 'INC', note: 'Won as SPA candidate; switched to TVK+', status: 'Elected' },
  { no: 162, constituency: 'Poompuhar', district: 'Mayiladuthurai', mla: 'Nivedha M. Murugan', party: 'DMK', note: 'SPA', status: 'Elected' },
  // Nagapattinam
  { no: 163, constituency: 'Nagapattinam', district: 'Nagapattinam', mla: 'M. H. Jawahirullah', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 164, constituency: 'Kilvelur (SC)', district: 'Nagapattinam', mla: 'T. Latha', party: 'CPI(M)', note: 'Won as SPA candidate; party gave outside support to TVK govt', status: 'Elected' },
  { no: 165, constituency: 'Vedaranyam', district: 'Nagapattinam', mla: 'O. S. Manian', party: 'AIADMK', note: 'Opposed TVK govt', status: 'Elected' },
  // Tiruvarur
  { no: 166, constituency: 'Thiruthuraipoondi (SC)', district: 'Tiruvarur', mla: 'K. Marimuthu', party: 'CPI', note: 'Won as SPA candidate; party gave outside support to TVK govt', status: 'Elected' },
  { no: 167, constituency: 'Mannargudi', district: 'Tiruvarur', mla: 'S. Kamaraj', party: 'IND', note: 'Elected on AMMK ticket (AIADMK+); later expelled from AMMK, now Independent giving outside support to TVK govt', status: 'Elected' },
  { no: 168, constituency: 'Thiruvarur', district: 'Tiruvarur', mla: 'K. Poondi Kalaivanan', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 169, constituency: 'Nannilam', district: 'Tiruvarur', mla: 'R. Kamaraj', party: 'AIADMK', note: 'Supported TVK; later declared support for EPS', status: 'Elected' },
  // Thanjavur
  { no: 170, constituency: 'Thiruvidaimarudur', district: 'Thanjavur', mla: 'Govi. Chezhian', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 171, constituency: 'Kumbakonam', district: 'Thanjavur', mla: 'R. Vinoth', party: 'TVK', note: 'Cabinet Minister (Agriculture)', status: 'Elected' },
  { no: 172, constituency: 'Papanasam', district: 'Thanjavur', mla: 'A. M. Shahjahan', party: 'IUML', note: 'Won as SPA candidate; switched to TVK+; Cabinet Minister', status: 'Elected' },
  { no: 173, constituency: 'Thiruvaiyaru', district: 'Thanjavur', mla: 'Durai Chandrasekaran', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 174, constituency: 'Thanjavur', district: 'Thanjavur', mla: 'R. Vijaysaravanan', party: 'TVK', status: 'Elected' },
  { no: 175, constituency: 'Orathanadu', district: 'Thanjavur', mla: 'R. Vaithilingam', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 176, constituency: 'Pattukkottai', district: 'Thanjavur', mla: 'K. Annadurai', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 177, constituency: 'Peravurani', district: 'Thanjavur', mla: 'N. Ashokkumar', party: 'DMK', note: 'SPA', status: 'Elected' },
  // Pudukkottai
  { no: 178, constituency: 'Gandarvakkottai (SC)', district: 'Pudukkottai', mla: 'N. Subramanian', party: 'TVK', status: 'Elected' },
  { no: 179, constituency: 'Viralimalai', district: 'Pudukkottai', mla: null, party: 'AIADMK', note: 'Won as C. Vijayabaskar (AIADMK, supported TVK); resigned 16 June 2026 — seat vacant pending by-election', status: 'Vacant' },
  { no: 180, constituency: 'Pudukkottai', district: 'Pudukkottai', mla: 'V. Muthuraja', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 181, constituency: 'Thirumayam', district: 'Pudukkottai', mla: 'S. Regupathy', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 182, constituency: 'Alangudi', district: 'Pudukkottai', mla: 'Siva V. Meyyanathan', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 183, constituency: 'Aranthangi', district: 'Pudukkottai', mla: 'J. Mohamed Farvas', party: 'TVK', note: 'Cabinet Minister (Labour Welfare)', status: 'Elected' },
  // Sivaganga
  { no: 184, constituency: 'Karaikudi', district: 'Sivaganga', mla: 'T. K. Prabhu', party: 'TVK', note: 'Cabinet Minister (Minerals & Mines)', status: 'Elected' },
  { no: 185, constituency: 'Tirupattur', district: 'Sivaganga', mla: 'Srinivasa Sethupathi', party: 'TVK', status: 'Elected' },
  { no: 186, constituency: 'Sivaganga', district: 'Sivaganga', mla: 'Kulanthai Rani', party: 'TVK', status: 'Elected' },
  { no: 187, constituency: 'Manamadurai (SC)', district: 'Sivaganga', mla: 'D. Elangovan', party: 'TVK', status: 'Elected' },
  // Madurai
  { no: 188, constituency: 'Melur', district: 'Madurai', mla: 'P. Viswanathan', party: 'INC', note: 'Won as SPA candidate; switched to TVK+; Cabinet Minister (Higher Education)', status: 'Elected' },
  { no: 189, constituency: 'Madurai East', district: 'Madurai', mla: 'S. Karthikeyan', party: 'TVK', status: 'Elected' },
  { no: 190, constituency: 'Sholavandan (SC)', district: 'Madurai', mla: 'M. V. Karuppiah', party: 'TVK', status: 'Elected' },
  { no: 191, constituency: 'Madurai North', district: 'Madurai', mla: 'A. Kallanai', party: 'TVK', status: 'Elected' },
  { no: 192, constituency: 'Madurai South', district: 'Madurai', mla: 'M. M. Gopison', party: 'TVK', status: 'Elected' },
  { no: 193, constituency: 'Madurai Central', district: 'Madurai', mla: 'Madhar Badhurudeen', party: 'TVK', status: 'Elected' },
  { no: 194, constituency: 'Madurai West', district: 'Madurai', mla: 'S. R. Thangapandi', party: 'TVK', status: 'Elected' },
  { no: 195, constituency: 'Thiruparankundram', district: 'Madurai', mla: 'C. T. R. Nirmal Kumar', party: 'TVK', note: 'Cabinet Minister (Electricity & Law)', status: 'Elected' },
  { no: 196, constituency: 'Thirumangalam', district: 'Madurai', mla: 'Sedapatti M. Manimaran', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 197, constituency: 'Usilampatti', district: 'Madurai', mla: 'M. Vijay', party: 'TVK', status: 'Elected' },
  // Theni
  { no: 198, constituency: 'Andipatti', district: 'Theni', mla: 'A. Maharajan', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 199, constituency: 'Periyakulam (SC)', district: 'Theni', mla: 'G. Sabari Iyngaran', party: 'TVK', status: 'Elected' },
  { no: 200, constituency: 'Bodinayakanur', district: 'Theni', mla: 'O. Panneerselvam', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 201, constituency: 'Cumbum', district: 'Theni', mla: 'P. L. A. Jeganathmishra', party: 'TVK', status: 'Elected' },
  // Virudhunagar
  { no: 202, constituency: 'Rajapalayam', district: 'Virudhunagar', mla: 'K. Jegadeshwari', party: 'TVK', note: 'Cabinet Minister (Social Welfare)', status: 'Elected' },
  { no: 203, constituency: 'Srivilliputhur (SC)', district: 'Virudhunagar', mla: 'A. Karthik', party: 'TVK', status: 'Elected' },
  { no: 204, constituency: 'Sattur', district: 'Virudhunagar', mla: 'A. Kadarkarairaj', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 205, constituency: 'Sivakasi', district: 'Virudhunagar', mla: 'S. Keerthana', party: 'TVK', note: 'Cabinet Minister (Industries)', status: 'Elected' },
  { no: 206, constituency: 'Virudhunagar', district: 'Virudhunagar', mla: 'P. Selvam', party: 'TVK', status: 'Elected' },
  { no: 207, constituency: 'Aruppukkottai', district: 'Virudhunagar', mla: 'K. K. S. S. R. Ramachandran', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 208, constituency: 'Tiruchuli', district: 'Virudhunagar', mla: 'Thangam Thenarasu', party: 'DMK', note: 'SPA', status: 'Elected' },
  // Ramanathapuram
  { no: 209, constituency: 'Paramakudi (SC)', district: 'Ramanathapuram', mla: 'K. K. Kathiravan', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 210, constituency: 'Tiruvadanai', district: 'Ramanathapuram', mla: 'Rajeev', party: 'TVK', note: 'Cabinet Minister (Environment)', status: 'Elected' },
  { no: 211, constituency: 'Ramanathapuram', district: 'Ramanathapuram', mla: 'Katharbatcha Muthuramalingam', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 212, constituency: 'Mudhukulathur', district: 'Ramanathapuram', mla: 'R. S. Rajakannappan', party: 'DMK', note: 'SPA', status: 'Elected' },
  // Thoothukudi
  { no: 213, constituency: 'Vilathikulam', district: 'Thoothukudi', mla: 'G. V. Markandayan', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 214, constituency: 'Thoothukkudi', district: 'Thoothukudi', mla: 'Srinath', party: 'TVK', note: 'Cabinet Minister (Fisheries)', status: 'Elected' },
  { no: 215, constituency: 'Tiruchendur', district: 'Thoothukudi', mla: 'Anitha R. Radhakrishnan', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 216, constituency: 'Srivaikuntam', district: 'Thoothukudi', mla: 'G. Saravanan', party: 'TVK', status: 'Elected' },
  { no: 217, constituency: 'Ottapidaram (SC)', district: 'Thoothukudi', mla: 'P. Mathanraja', party: 'TVK', note: 'Cabinet Minister (Rural Industries)', status: 'Elected' },
  { no: 218, constituency: 'Kovilpatti', district: 'Thoothukudi', mla: 'K. Karunanithi', party: 'DMK', note: 'SPA', status: 'Elected' },
  // Tenkasi
  { no: 219, constituency: 'Sankarankovil (SC)', district: 'Tenkasi', mla: 'Dr. Dhilipan Jaishankar', party: 'AIADMK', note: 'Supported TVK; later declared support for EPS', status: 'Elected' },
  { no: 220, constituency: 'Vasudevanallur (SC)', district: 'Tenkasi', mla: 'E. Raja', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 221, constituency: 'Kadayanallur', district: 'Tenkasi', mla: 'T. M. Rajendran', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 222, constituency: 'Tenkasi', district: 'Tenkasi', mla: 'Kalai Kathiravan', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 223, constituency: 'Alangulam', district: 'Tenkasi', mla: 'P. H. Manoj Pandian', party: 'DMK', note: 'SPA', status: 'Elected' },
  // Tirunelveli
  { no: 224, constituency: 'Tirunelveli', district: 'Tirunelveli', mla: 'R. S. Murughan', party: 'TVK', status: 'Elected' },
  { no: 225, constituency: 'Ambasamudram', district: 'Tirunelveli', mla: null, party: 'AIADMK', note: 'Won as Esakki Subaya (AIADMK, supported TVK); resigned 26 May 2026 and joined TVK — seat vacant pending by-election', status: 'Vacant' },
  { no: 226, constituency: 'Palayamkottai', district: 'Tirunelveli', mla: 'M. Abdul Wahab', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 227, constituency: 'Nanguneri', district: 'Tirunelveli', mla: 'Reddiarpatti V. Narayanan', party: 'TVK', status: 'Elected' },
  { no: 228, constituency: 'Radhapuram', district: 'Tirunelveli', mla: 'Sathish Christopher', party: 'TVK', status: 'Elected' },
  // Kanyakumari
  { no: 229, constituency: 'Kanniyakumari', district: 'Kanyakumari', mla: 'N. Thalavai Sundaram', party: 'AIADMK', note: 'Opposed TVK govt', status: 'Elected' },
  { no: 230, constituency: 'Nagercoil', district: 'Kanyakumari', mla: 'S. Austin', party: 'DMK', note: 'SPA', status: 'Elected' },
  { no: 231, constituency: 'Colachal', district: 'Kanyakumari', mla: 'Tharahai Cuthbert', party: 'INC', note: 'Won as SPA candidate; switched to TVK+', status: 'Elected' },
  { no: 232, constituency: 'Padmanabhapuram', district: 'Kanyakumari', mla: 'R. Chellaswamy', party: 'CPI(M)', note: 'Won as SPA candidate; party gave outside support to TVK govt', status: 'Elected' },
  { no: 233, constituency: 'Vilavancode', district: 'Kanyakumari', mla: 'T. T. Praveen', party: 'INC', note: 'Won as SPA candidate; switched to TVK+', status: 'Elected' },
  { no: 234, constituency: 'Killiyoor', district: 'Kanyakumari', mla: 'S. Rajeshkumar', party: 'INC', note: 'Won as SPA candidate; switched to TVK+; Cabinet Minister (Tourism)', status: 'Elected' },
];

// ---- Internal integrity checks (throw at import time if the roster is ever edited incorrectly) ----
if (TN_ASSEMBLY_2026.length !== 234) {
  throw new Error(`TN_ASSEMBLY_2026 must contain exactly 234 seats, found ${TN_ASSEMBLY_2026.length}`);
}
const seatNumbers = new Set(TN_ASSEMBLY_2026.map((s) => s.no));
if (seatNumbers.size !== 234) {
  throw new Error('TN_ASSEMBLY_2026 contains duplicate constituency numbers');
}
const vacantCount = TN_ASSEMBLY_2026.filter((s) => s.status === 'Vacant').length;
if (vacantCount !== DATA_SOURCE.vacantSeats) {
  throw new Error(
    `TN_ASSEMBLY_2026 vacant-seat count (${vacantCount}) does not match DATA_SOURCE.vacantSeats (${DATA_SOURCE.vacantSeats})`
  );
}
