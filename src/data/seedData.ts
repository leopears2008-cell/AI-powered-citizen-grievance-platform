import {
  Department,
  Officer,
  Grievance,
  NotificationItem,
  AuditLog,
} from '../types';

/**
 * NivaranAI - Tamil Nadu Citizen Grievance Platform
 *
 * IMPORTANT:
 * - Department leadership information is based on current government sources
 *   checked on 23 September 2026.
 * - Grievances, notifications and audit logs below are DEMO APPLICATION DATA.
 * - Do not present demo records as real government/citizen records.
 */

// ============================================================
// DEPARTMENTS
// ============================================================

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'dept-water',
    name: 'Water Resources Department',
    nameTamil: 'நீர்வளத் துறை',
    code: 'WRD',
    headName: 'Thiru Satyabrata Sahoo, IAS',
    contactNumber: '044-25671622',
    email: 'wrdsec@tn.gov.in',
    totalGrievances: 1,
    pendingCount: 0,
    resolvedCount: 1,
    slaDays: 3,
    iconName: 'Droplets',
  },

  {
    id: 'dept-electric',
    name: 'Tamil Nadu Power Distribution Corporation Limited',
    nameTamil: 'தமிழ்நாடு மின் பகிர்மானக் கழகம்',
    code: 'TNPDCL',
    headName: 'Dr. J. Radhakrishnan, IAS',
    contactNumber: '044-28521300',
    email: 'chairman@tnebnet.org',
    totalGrievances: 1,
    pendingCount: 1,
    resolvedCount: 0,
    slaDays: 2,
    iconName: 'Zap',
  },

  {
    id: 'dept-roads',
    name: 'Highways and Minor Ports Department',
    nameTamil: 'நெடுஞ்சாலைகள் மற்றும் சிறு துறைமுகங்கள் துறை',
    code: 'HIGHWAYS',
    headName: 'Thiru Shunchonngam Jatak Chiru, IAS',
    contactNumber: '044-25673040',
    email: 'pwdsec@tn.gov.in',
    totalGrievances: 0,
    pendingCount: 0,
    resolvedCount: 0,
    slaDays: 5,
    iconName: 'Construction',
  },

  {
    id: 'dept-sanitation',
    name: 'Solid Waste Management Department',
    nameTamil: 'திடக்கழிவு மேலாண்மைத் துறை',
    code: 'SWM',
    headName: 'P. Banukumar',
    contactNumber: '9499956220',
    email: 'seswm@chennaicorporation.gov.in',
    totalGrievances: 0,
    pendingCount: 0,
    resolvedCount: 0,
    slaDays: 2,
    iconName: 'Trash2',
  },

  {
    id: 'dept-streetlight',
    name: 'Greater Chennai Corporation Electrical Department',
    nameTamil: 'பெருநகர சென்னை மாநகராட்சி மின் துறை',
    code: 'GCC-ELECTRICAL',
    headName: 'M. Elangovan',
    contactNumber: '9445190739',
    email: 'seelectrical@chennaicorporation.gov.in',
    totalGrievances: 1,
    pendingCount: 1,
    resolvedCount: 0,
    slaDays: 3,
    iconName: 'Lightbulb',
  },

  {
    id: 'dept-health',
    name: 'Greater Chennai Corporation Public Health Department',
    nameTamil: 'பெருநகர சென்னை மாநகராட்சி பொது சுகாதாரத் துறை',
    code: 'GCC-HEALTH',
    headName: 'Dr. M. Jagadeesan',
    contactNumber: '044-25383734',
    email: '',
    totalGrievances: 1,
    pendingCount: 1,
    resolvedCount: 0,
    slaDays: 2,
    iconName: 'HeartPulse',
  },

  {
    id: 'dept-transport',
    name: 'Transport Department',
    nameTamil: 'போக்குவரத்துத் துறை',
    code: 'TRANS',
    headName: 'Thiru K. Phanindra Reddy, IAS',
    contactNumber: '044-25671475',
    email: 'transsec@tn.gov.in',
    totalGrievances: 0,
    pendingCount: 0,
    resolvedCount: 0,
    slaDays: 4,
    iconName: 'Bus',
  },
];


// ============================================================
// OFFICERS
// ============================================================

/**
 * These are departmental leadership records where a current
 * official source was available.
 *
 * They are NOT field officers assigned to real complaints.
 */

export const INITIAL_OFFICERS: Officer[] = [
  {
    id: 'off-wrd-01',
    name: 'Thiru Satyabrata Sahoo, IAS',
    nameTamil: 'திரு சத்யபிரதா சாஹூ, இ.ஆ.ப.',
    departmentId: 'dept-water',
    departmentName: 'Water Resources Department',
    designation: 'Principal Secretary to Government',
    phone: '044-25671622',
    email: 'wrdsec@tn.gov.in',
    activeCount: 0,
    resolvedCount: 0,
    avatar: '',
    zone: 'Secretariat, Chennai',
  },

  {
    id: 'off-highways-01',
    name: 'Thiru Shunchonngam Jatak Chiru, IAS',
    nameTamil: 'திரு ஷுஞ்சோங்நம் ஜாடக் சிரு, இ.ஆ.ப.',
    departmentId: 'dept-roads',
    departmentName: 'Highways and Minor Ports Department',
    designation: 'Principal Secretary to Government',
    phone: '044-25673040',
    email: 'pwdsec@tn.gov.in',
    activeCount: 0,
    resolvedCount: 0,
    avatar: '',
    zone: 'Secretariat, Chennai',
  },

  {
    id: 'off-transport-01',
    name: 'Thiru K. Phanindra Reddy, IAS',
    nameTamil: 'திரு கே. பனீந்திர ரெட்டி, இ.ஆ.ப.',
    departmentId: 'dept-transport',
    departmentName: 'Transport Department',
    designation: 'Additional Chief Secretary to Government',
    phone: '044-25671475',
    email: 'transsec@tn.gov.in',
    activeCount: 0,
    resolvedCount: 0,
    avatar: '',
    zone: 'Secretariat, Chennai',
  },

  {
    id: 'off-swm-01',
    name: 'P. Banukumar',
    nameTamil: 'பி. பானுகுமார்',
    departmentId: 'dept-sanitation',
    departmentName: 'Solid Waste Management Department',
    designation: 'Superintending Engineer (SWM)',
    phone: '9499956220',
    email: 'seswm@chennaicorporation.gov.in',
    activeCount: 0,
    resolvedCount: 0,
    avatar: '',
    zone: 'Greater Chennai Corporation',
  },

  {
    id: 'off-electrical-01',
    name: 'M. Elangovan',
    nameTamil: 'எம். இளங்கோவன்',
    departmentId: 'dept-streetlight',
    departmentName: 'Greater Chennai Corporation Electrical Department',
    designation: 'Superintending Engineer (Electrical)',
    phone: '9445190739',
    email: 'seelectrical@chennaicorporation.gov.in',
    activeCount: 0,
    resolvedCount: 0,
    avatar: '',
    zone: 'Greater Chennai Corporation',
  },

  {
    id: 'off-health-01',
    name: 'Dr. M. Jagadeesan',
    nameTamil: 'டாக்டர் எம். ஜெகதீசன்',
    departmentId: 'dept-health',
    departmentName: 'Greater Chennai Corporation Public Health Department',
    designation: 'City Health Officer',
    phone: '',
    email: '',
    activeCount: 0,
    resolvedCount: 0,
    avatar: '',
    zone: 'Greater Chennai Corporation',
  },

  {
    id: 'off-energy-01',
    name: 'Dr. J. Radhakrishnan, IAS',
    nameTamil: 'டாக்டர் ஜெ. ராதாகிருஷ்ணன், இ.ஆ.ப.',
    departmentId: 'dept-electric',
    departmentName: 'Tamil Nadu Power Distribution Corporation Limited',
    designation: 'Chairman and Managing Director, Energy Department',
    phone: '044-28521300',
    email: 'chairman@tnebnet.org',
    activeCount: 0,
    resolvedCount: 0,
    avatar: '',
    zone: 'Chennai',
  },
];


// ============================================================
// DEMO GRIEVANCES
// ============================================================

export const INITIAL_COMPLAINTS: Grievance[] = [
  {
    trackId: 'GRV-2026-00124',
    id: 'GRV-2026-00124',
    citizenName: 'M. Murugesan',
    citizenPhone: '+91 98401 23456',
    citizenEmail: 'murugesan.m@gmail.com',
    language: 'Tamil',

    originalTranscript:
      'எங்கள் பகுதியில் கடந்த ஒரு வாரமாக தெருவிளக்கு வேலை செய்யவில்லை. இரவு நேரத்தில் பொதுமக்களுக்கு சிரமமாக உள்ளது.',

    summaryEn:
      'Street light not working for the past one week. Public safety concern at night.',

    summaryTa:
      'கடந்த ஒரு வாரமாக தெருவிளக்கு எரியவில்லை. இரவு நேர பொதுமக்கள் பாதுகாப்பு குறித்து புகார்.',

    category: 'Street Light',

    departmentId: 'dept-streetlight',
    departmentName:
      'Greater Chennai Corporation Electrical Department',

    priority: 'Medium',

    priorityReason:
      'Non-functional street light reported on a residential road.',

    confidenceScore: 0.96,

    location: {
      address: 'Demo Address, Gandhi Nagar, Madurai',
      landmark: 'Near local temple',
      district: 'Madurai',
      wardNumber: 'Ward 42',
      pincode: '625020',
      lat: 9.9252,
      lng: 78.1198,
    },

    attachments: [],

    status: 'In Progress',

    assignedOfficerId: 'off-electrical-01',
    assignedOfficerName: 'M. Elangovan',
    assignedOfficerPhone: '9445190739',

    assignedAt: '2026-09-20T09:15:00.000Z',
    targetResolutionDate: '2026-09-23T18:00:00.000Z',

    entities: {
      duration: '1 week',
      equipment: 'Street light',
      urgencyMarkers: ['Darkness', 'Public safety'],
    },

    statusHistory: [
      {
        status: 'Submitted',
        timestamp: '2026-09-20T09:00:00.000Z',
        updatedBy: 'Citizen Voice Input',
        role: 'CITIZEN',
        remarks: 'Demo grievance submitted.',
      },
      {
        status: 'AI Classified',
        timestamp: '2026-09-20T09:00:04.000Z',
        updatedBy: 'NivaranAI Engine',
        role: 'ADMIN',
        remarks:
          'Demo classification: Street Light / Medium priority.',
      },
      {
        status: 'Assigned',
        timestamp: '2026-09-20T09:15:00.000Z',
        updatedBy: 'Demo Administrator',
        role: 'ADMIN',
        remarks:
          'Demo assignment to GCC Electrical Department.',
      },
      {
        status: 'In Progress',
        timestamp: '2026-09-20T14:40:00.000Z',
        updatedBy: 'M. Elangovan',
        role: 'OFFICER',
        remarks:
          'Demo field inspection status.',
      },
    ],

    createdAt: '2026-09-20T09:00:00.000Z',
    updatedAt: '2026-09-20T14:40:00.000Z',
  },


  {
    trackId: 'GRV-2026-00125',
    id: 'GRV-2026-00125',
    citizenName: 'S. Kavitha',
    citizenPhone: '+91 94443 89102',
    citizenEmail: 'kavitha.sundar@yahoo.com',
    language: 'Tamil',

    originalTranscript:
      'அண்ணா நகர் பகுதியில் குடிநீர் குழாய் உடைந்து தண்ணீர் வீணாகிறது.',

    summaryEn:
      'Drinking water pipeline leakage reported in Anna Nagar.',

    summaryTa:
      'அண்ணா நகர் பகுதியில் குடிநீர் குழாய் கசிவு குறித்து புகார்.',

    category: 'Water Supply',

    departmentId: 'dept-water',
    departmentName: 'Water Resources Department',

    priority: 'High',

    priorityReason:
      'Demo report concerning water loss from a damaged water pipeline.',

    confidenceScore: 0.98,

    location: {
      address: 'Demo Address, Anna Nagar, Chennai',
      landmark: 'Near Tower Park',
      district: 'Chennai',
      wardNumber: 'Ward 102',
      pincode: '600040',
      lat: 13.0850,
      lng: 80.2101,
    },

    attachments: [],

    status: 'Resolved',

    assignedOfficerId: 'off-wrd-01',
    assignedOfficerName: 'Thiru Satyabrata Sahoo, IAS',
    assignedOfficerPhone: '044-25671622',

    assignedAt: '2026-09-19T07:25:00.000Z',
    targetResolutionDate: '2026-09-20T12:00:00.000Z',
    resolvedAt: '2026-09-19T18:30:00.000Z',

    resolutionRemarks:
      'Demo grievance marked resolved for application testing.',

    resolutionEvidenceUrl: '',

    feedback: {
      rating: 5,
      comment: 'Demo citizen feedback.',
      isResolvedSatisfied: true,
      submittedAt: '2026-09-19T20:10:00.000Z',
    },

    entities: {
      duration: 'Demo emergency',
      equipment: 'Water pipeline',
      urgencyMarkers: ['Water loss'],
    },

    statusHistory: [
      {
        status: 'Submitted',
        timestamp: '2026-09-19T07:15:00.000Z',
        updatedBy: 'Citizen',
        role: 'CITIZEN',
        remarks: 'Demo citizen submission.',
      },
      {
        status: 'AI Classified',
        timestamp: '2026-09-19T07:15:03.000Z',
        updatedBy: 'NivaranAI Engine',
        role: 'ADMIN',
        remarks:
          'Demo classification: Water Supply / High priority.',
      },
      {
        status: 'Assigned',
        timestamp: '2026-09-19T07:25:00.000Z',
        updatedBy: 'Demo Administrator',
        role: 'ADMIN',
        remarks: 'Demo assignment.',
      },
      {
        status: 'Resolved',
        timestamp: '2026-09-19T18:30:00.000Z',
        updatedBy: 'Demo Officer',
        role: 'OFFICER',
        remarks:
          'Demo resolution recorded for testing.',
      },
    ],

    createdAt: '2026-09-19T07:15:00.000Z',
    updatedAt: '2026-09-19T20:10:00.000Z',
  },


  {
    trackId: 'GRV-2026-00126',
    id: 'GRV-2026-00126',
    citizenName: 'R. Balaji',
    citizenPhone: '+91 97908 45612',
    citizenEmail: 'balaji.r@outlook.com',
    language: 'English',

    originalTranscript:
      'There is an electrical safety issue near a school gate. Please inspect it immediately.',

    summaryEn:
      'Electrical safety issue reported near a school.',

    summaryTa:
      'பள்ளி அருகே மின் பாதுகாப்பு பிரச்சினை குறித்து புகார்.',

    category: 'Electricity & Power',

    departmentId: 'dept-electric',
    departmentName:
      'Tamil Nadu Power Distribution Corporation Limited',

    priority: 'Critical',

    priorityReason:
      'Demo electrical safety complaint near a public facility.',

    confidenceScore: 0.99,

    location: {
      address: 'Demo Government School Road, Coimbatore',
      landmark: 'Near Gandhipuram',
      district: 'Coimbatore',
      wardNumber: 'Ward 28',
      pincode: '641012',
      lat: 11.0168,
      lng: 76.9558,
    },

    attachments: [],

    status: 'Under Review',

    assignedOfficerId: 'off-energy-01',
    assignedOfficerName: 'Dr. J. Radhakrishnan, IAS',
    assignedOfficerPhone: '044-28521300',

    assignedAt: '2026-09-20T06:20:00.000Z',
    targetResolutionDate: '2026-09-20T18:00:00.000Z',

    entities: {
      duration: 'Demo report',
      equipment: 'Electrical distribution equipment',
      urgencyMarkers: [
        'School zone',
        'Electrical safety',
      ],
    },

    statusHistory: [
      {
        status: 'Submitted',
        timestamp: '2026-09-20T06:05:00.000Z',
        updatedBy: 'Citizen',
        role: 'CITIZEN',
        remarks: 'Demo emergency safety report.',
      },
      {
        status: 'AI Classified',
        timestamp: '2026-09-20T06:05:03.000Z',
        updatedBy: 'NivaranAI Engine',
        role: 'ADMIN',
        remarks:
          'Demo classification: Electricity / Critical.',
      },
      {
        status: 'Assigned',
        timestamp: '2026-09-20T06:20:00.000Z',
        updatedBy: 'Demo Administrator',
        role: 'ADMIN',
        remarks: 'Demo assignment.',
      },
      {
        status: 'Under Review',
        timestamp: '2026-09-20T06:50:00.000Z',
        updatedBy: 'Demo Officer',
        role: 'OFFICER',
        remarks: 'Demo inspection status.',
      },
    ],

    createdAt: '2026-09-20T06:05:00.000Z',
    updatedAt: '2026-09-20T06:50:00.000Z',
  },


  {
    trackId: 'GRV-2026-00127',
    id: 'GRV-2026-00127',
    citizenName: 'T. Subhashree',
    citizenPhone: '+91 98840 33211',
    citizenEmail: 'subhashree.t@gmail.com',
    language: 'Tamil',

    originalTranscript:
      'மழைக்குப் பிறகு எங்கள் பகுதியில் கொசுக்கள் அதிகமாக உள்ளன. கொசு ஒழிப்பு நடவடிக்கை தேவை.',

    summaryEn:
      'Mosquito control requested after rainfall.',

    summaryTa:
      'மழைக்குப் பிறகு கொசு ஒழிப்பு நடவடிக்கை கோரிக்கை.',

    category: 'Public Health & Vector Control',

    departmentId: 'dept-health',
    departmentName:
      'Greater Chennai Corporation Public Health Department',

    priority: 'High',

    priorityReason:
      'Demo public-health complaint regarding mosquito control.',

    confidenceScore: 0.94,

    location: {
      address: 'Demo 7th Street, Tiruchirappalli',
      landmark: 'Near Government Health Centre',
      district: 'Tiruchirappalli',
      wardNumber: 'Ward 15',
      pincode: '620002',
      lat: 10.7905,
      lng: 78.7047,
    },

    attachments: [],

    status: 'Submitted',

    targetResolutionDate: '2026-09-23T12:00:00.000Z',

    entities: {
      duration: 'Demo report',
      equipment: 'Fogging equipment',
      urgencyMarkers: [
        'Mosquito control',
        'Public health',
      ],
    },

    statusHistory: [
      {
        status: 'Submitted',
        timestamp: '2026-09-20T07:00:00.000Z',
        updatedBy: 'Citizen Voice Input',
        role: 'CITIZEN',
        remarks: 'Demo Tamil voice grievance.',
      },
      {
        status: 'AI Classified',
        timestamp: '2026-09-20T07:00:04.000Z',
        updatedBy: 'NivaranAI Engine',
        role: 'ADMIN',
        remarks:
          'Demo classification: Public Health / High.',
      },
    ],

    createdAt: '2026-09-20T07:00:00.000Z',
    updatedAt: '2026-09-20T07:00:04.000Z',
  },
];


// ============================================================
// NOTIFICATIONS
// ============================================================

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    grievanceId: 'GRV-2026-00125',
    title: 'Demo Grievance Resolved',
    titleTa: 'டெமோ புகார் தீர்க்கப்பட்டது',
    message:
      'The demo water-supply grievance has been marked resolved.',
    messageTa:
      'டெமோ குடிநீர் புகார் தீர்க்கப்பட்டதாக பதிவு செய்யப்பட்டுள்ளது.',
    type: 'resolution',
    read: false,
    createdAt: '2026-09-19T18:30:00.000Z',
  },

  {
    id: 'notif-2',
    grievanceId: 'GRV-2026-00124',
    title: 'Demo Field Assignment',
    titleTa: 'டெமோ களப்பணி நியமனம்',
    message:
      'The demo street-light grievance has been assigned for departmental review.',
    messageTa:
      'டெமோ தெருவிளக்கு புகார் துறை பரிசீலனைக்கு ஒதுக்கப்பட்டுள்ளது.',
    type: 'assignment',
    read: true,
    createdAt: '2026-09-20T14:40:00.000Z',
  },

  {
    id: 'notif-3',
    grievanceId: 'GRV-2026-00126',
    title: 'Demo Emergency Review',
    titleTa: 'டெமோ அவசர பரிசீலனை',
    message:
      'The demo electrical-safety grievance is under review.',
    messageTa:
      'டெமோ மின் பாதுகாப்பு புகார் பரிசீலனையில் உள்ளது.',
    type: 'status_update',
    read: false,
    createdAt: '2026-09-20T06:50:00.000Z',
  },

  {
    id: 'notif-4',
    grievanceId: '',
    title: 'Application Data Notice',
    titleTa: 'பயன்பாட்டு தரவு அறிவிப்பு',
    message:
      'The grievance records displayed in this development build are demo records and are not official government complaint records.',
    messageTa:
      'இந்த மேம்பாட்டு பதிப்பில் காண்பிக்கப்படும் புகார் பதிவுகள் டெமோ பதிவுகள் மட்டுமே; அவை அதிகாரப்பூர்வ அரசு புகார் பதிவுகள் அல்ல.',
    type: 'status_update',
    read: false,
    createdAt: '2026-09-23T00:00:00.000Z',
  },
];


// ============================================================
// AUDIT LOGS
// ============================================================

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-1',
    timestamp: '2026-09-20T06:50:00.000Z',
    userId: 'off-energy-01',
    userName: 'Dr. J. Radhakrishnan, IAS',
    userRole: 'OFFICER',
    action: 'STATUS_CHANGE',
    details:
      'Demo status changed from Assigned to Under Review for GRV-2026-00126.',
    grievanceId: 'GRV-2026-00126',
  },

  {
    id: 'audit-2',
    timestamp: '2026-09-20T06:20:00.000Z',
    userId: 'adm-01',
    userName: 'Demo Administrator',
    userRole: 'ADMIN',
    action: 'OFFICER_ASSIGNMENT',
    details:
      'Demo GRV-2026-00126 assigned to the electricity department.',
    grievanceId: 'GRV-2026-00126',
  },

  {
    id: 'audit-3',
    timestamp: '2026-09-19T18:30:00.000Z',
    userId: 'off-wrd-01',
    userName: 'Thiru Satyabrata Sahoo, IAS',
    userRole: 'OFFICER',
    action: 'GRIEVANCE_RESOLVED',
    details:
      'Demo GRV-2026-00125 marked as resolved.',
    grievanceId: 'GRV-2026-00125',
  },

  {
    id: 'audit-4',
    timestamp: '2026-09-20T14:40:00.000Z',
    userId: 'off-electrical-01',
    userName: 'M. Elangovan',
    userRole: 'OFFICER',
    action: 'STATUS_CHANGE',
    details:
      'Demo GRV-2026-00124 changed to In Progress.',
    grievanceId: 'GRV-2026-00124',
  },
];


// ============================================================
// OPTIONAL LEADERSHIP DATA
// ============================================================

export const TN_WATER_RESOURCES_LEADERSHIP = {
  minister: {
    name: 'Thiru N. Anand',
    designation: 'Minister for Rural Development and Water Resources',
    phone: '044-25672866',
    email: 'minister_rdprd@tn.gov.in',
  },

  principalSecretary: {
    name: 'Thiru Satyabrata Sahoo, IAS',
    designation: 'Principal Secretary to Government',
    phone: '044-25671622',
    email: 'wrdsec@tn.gov.in',
  },
};


// ============================================================
// SINGLE SEED DATA OBJECT
// ============================================================

export const seedData = {
  departments: INITIAL_DEPARTMENTS,
  officers: INITIAL_OFFICERS,
  grievances: INITIAL_COMPLAINTS,
  notifications: INITIAL_NOTIFICATIONS,
  auditLogs: INITIAL_AUDIT_LOGS,
};

export default seedData;
