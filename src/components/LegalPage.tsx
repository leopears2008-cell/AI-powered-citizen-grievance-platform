import React from 'react';
import { useApp } from '../context/AppContext';

type LegalType = 'privacy' | 'terms' | 'cookies' | 'refund';

type Section = [string, string, string, string];

const content: Record<LegalType, { title: string; sections: Section[] }> = {
  privacy: {
    title: 'Privacy notice',
    sections: [
      [
        'Information handled',
        'The service may handle complaint text, verified contact details, language, user-entered location, optional GPS coordinates and optional evidence uploaded with a grievance. Firebase Authentication is used for identity; grievance application data is stored through the server in Supabase PostgreSQL.',
        'கையாளப்படும் தகவல்கள்',
        'புகார் உரை, சரிபார்க்கப்பட்ட தொடர்பு விவரங்கள், மொழி, பயனர் உள்ளிட்ட இருப்பிடம், விருப்ப GPS ஆயத்தொலைவுகள் மற்றும் விருப்ப ஆதாரங்கள் கையாளப்படலாம். அடையாளத்திற்காக Firebase Authentication பயன்படுத்தப்படுகிறது; புகார் தரவு சேவையகத்தின் மூலம் Supabase PostgreSQL-இல் சேமிக்கப்படுகிறது.',
      ],
      [
        'Data minimisation',
        'Only information needed to receive, classify, route and track a grievance should be submitted. Do not enter passwords, financial information, government ID numbers, medical details unrelated to the complaint, or other unnecessary sensitive information.',
        'தரவு குறைத்தல்',
        'புகாரைப் பெற, வகைப்படுத்த, வழிமாற்ற மற்றும் கண்காணிக்க தேவையான தகவல்களை மட்டும் வழங்கவும். கடவுச்சொல், நிதித் தகவல், அரசு அடையாள எண்கள் அல்லது புகாருக்கு தொடர்பில்லாத முக்கிய தனிப்பட்ட தகவல்களை வழங்க வேண்டாம்.',
      ],
      [
        'AI processing',
        'When AI analysis or duplicate checking is requested, the server sends the complaint information needed for that operation to Google Gemini. AI output is an assistive suggestion, not an official finding or government decision, and should be reviewed before submission or action.',
        'செயற்கை நுண்ணறிவு செயலாக்கம்',
        'AI பகுப்பாய்வு அல்லது நகல் புகார் சரிபார்ப்பைத் தொடங்கும்போது, அந்த செயலுக்கு தேவையான புகார் தகவல்கள் சேவையகத்திலிருந்து Google Gemini-க்கு அனுப்பப்படலாம். AI வெளியீடு உதவி பரிந்துரை மட்டுமே; அது அதிகாரப்பூர்வ முடிவு அல்ல.',
      ],
      [
        'Voice input',
        'Voice recognition uses the browser Web Speech API. The browser or its speech provider may process audio according to its own service and privacy terms. Typing is always available as an alternative.',
        'குரல் உள்ளீடு',
        'குரல் அறிதலுக்கு உலாவியின் Web Speech API பயன்படுத்தப்படுகிறது. உலாவி அல்லது அதன் குரல் வழங்குநர் தங்களது சேவை மற்றும் தனியுரிமை விதிகளின்படி ஒலியை செயலாக்கலாம். மாற்றாக தட்டச்சு செய்யலாம்.',
      ],
      [
        'Third-party services and embeds',
        'The application does not intentionally embed advertising, social-media widgets or third-party tracking pixels. It does use external services such as Firebase Authentication, Google Gemini for AI processing and Wikimedia Commons for the civic building photograph. Service providers can have their own privacy terms.',
        'மூன்றாம் தரப்பு சேவைகள்',
        'விளம்பரங்கள், சமூக ஊடக விட்ஜெட்டுகள் அல்லது மூன்றாம் தரப்பு கண்காணிப்பு பிக்சல்கள் திட்டமிட்டு உட்பொதிக்கப்படவில்லை. Firebase Authentication, AI செயலாக்கத்திற்கு Google Gemini மற்றும் கட்டிடப் புகைப்படத்திற்கு Wikimedia Commons போன்ற வெளிப்புற சேவைகள் பயன்படுத்தப்படுகின்றன.',
      ],
      [
        'Retention and requests',
        'The production retention period, deletion workflow, privacy-request contact and responsible service operator have not been configured in this repository. These details must be supplied and legally reviewed before public production use.',
        'தரவு சேமிப்பும் கோரிக்கைகளும்',
        'உற்பத்தி தரவு சேமிப்பு காலம், நீக்க நடைமுறை, தனியுரிமை கோரிக்கை தொடர்பு மற்றும் பொறுப்பான சேவை இயக்குநர் இக்குறியீட்டில் அமைக்கப்படவில்லை. பொதுப் பயன்பாட்டுக்கு முன் இவை வழங்கப்பட்டு சட்ட ஆய்வு செய்யப்பட வேண்டும்.',
      ],
      [
        'India privacy readiness',
        'This page does not certify legal compliance. The service operator must assess the Digital Personal Data Protection Act, 2023 and Digital Personal Data Protection Rules, 2025 as applicable, including notice, consent, purpose limitation, data minimisation, security, retention and user-rights workflows.',
        'இந்திய தனியுரிமை சட்டத் தயார்நிலை',
        'இந்தப் பக்கம் சட்ட இணக்கத்தைச் சான்றளிக்கவில்லை. பொருந்தும் Digital Personal Data Protection Act, 2023 மற்றும் Digital Personal Data Protection Rules, 2025 தேவைகளுக்கு ஏற்ப அறிவிப்பு, ஒப்புதல், நோக்க வரம்பு, தரவு குறைத்தல், பாதுகாப்பு, சேமிப்பு மற்றும் பயனர் உரிமை நடைமுறைகளை சேவை இயக்குநர் உறுதிப்படுத்த வேண்டும்.',
      ],
    ],
  },
  terms: {
    title: 'Terms and conditions',
    sections: [
      [
        'Service status',
        'This repository contains a pre-production application. It does not by itself establish government affiliation, an official complaint channel, a government service-level commitment or an authorized operator.',
        'சேவை நிலை',
        'இந்தக் களஞ்சியம் முன்-உற்பத்தி பயன்பாட்டைக் கொண்டுள்ளது. இது தனியாக அரசு இணைப்பு, அதிகாரப்பூர்வ புகார் வழி, அரசு சேவை உறுதி அல்லது அங்கீகரிக்கப்பட்ட இயக்குநரை நிறுவவில்லை.',
      ],
      [
        'AI assistance',
        'Classification, priority, duplicate matches and generated summaries are system suggestions. They are not verified findings or official decisions and must not be presented as such.',
        'AI உதவி',
        'வகைப்பாடு, முன்னுரிமை, நகல் பொருத்தங்கள் மற்றும் உருவாக்கப்பட்ட சுருக்கங்கள் கணினி பரிந்துரைகள். அவை சரிபார்க்கப்பட்ட முடிவுகள் அல்லது அதிகாரப்பூர்வ தீர்மானங்கள் அல்ல.',
      ],
      [
        'Operator review',
        'The deploying organization must publish its identity, support contact, complaint scope, final terms and applicable legal notices before production launch.',
        'இயக்குநர் ஆய்வு',
        'உற்பத்திக்கு முன் சேவை இயக்குநர் தனது அடையாளம், உதவி தொடர்பு, புகார் வரம்பு, இறுதி விதிமுறைகள் மற்றும் பொருந்தும் சட்ட அறிவிப்புகளை வெளியிட வேண்டும்.',
      ],
    ],
  },
  cookies: {
    title: 'Cookies and browser storage',
    sections: [
      [
        'Essential storage',
        'Firebase Authentication may use browser-managed persistence to maintain a signed-in session. This application does not intentionally use advertising cookies or optional analytics trackers.',
        'அத்தியாவசிய சேமிப்பு',
        'உள்நுழைந்த அமர்வை வைத்திருக்க Firebase Authentication உலாவி சேமிப்பைப் பயன்படுத்தலாம். இந்த பயன்பாடு விளம்பர cookies அல்லது விருப்ப analytics trackers-ஐ திட்டமிட்டு பயன்படுத்தவில்லை.',
      ],
      [
        'Cookie consent',
        'A small notice explains essential browser storage before continuing. If non-essential analytics, advertising or profiling is introduced later, the operator must implement the appropriate consent mechanism before enabling it.',
        'Cookie ஒப்புதல்',
        'அத்தியாவசிய உலாவி சேமிப்பு குறித்து தொடர்வதற்கு முன் ஒரு குறிப்பு காட்டப்படுகிறது. பின்னர் அத்தியாவசியமற்ற analytics, விளம்பரம் அல்லது profiling சேர்க்கப்பட்டால், அவற்றை இயக்குவதற்கு முன் பொருந்தும் ஒப்புதல் நடைமுறை அமைக்கப்பட வேண்டும்.',
      ],
      [
        'Tracking',
        'No intentional advertising pixels, cross-site profiling or optional analytics are configured in this codebase. Browser speech recognition and external service requests are governed by their respective providers.',
        'கண்காணிப்பு',
        'இந்தக் குறியீட்டில் விளம்பர பிக்சல்கள், cross-site profiling அல்லது விருப்ப analytics அமைக்கப்படவில்லை. உலாவி குரல் அறிதல் மற்றும் வெளிப்புற சேவை கோரிக்கைகள் அந்தந்த வழங்குநர்களின் விதிகளுக்கு உட்பட்டவை.',
      ],
    ],
  },
  refund: {
    title: 'Refund policy',
    sections: [
      [
        'No paid service is configured',
        'This pre-production grievance application does not currently sell subscriptions, paid complaints, appointments or other paid services. Therefore there is no payment or refund process implemented by this repository.',
        'கட்டண சேவை இல்லை',
        'இந்த முன்-உற்பத்தி புகார் பயன்பாடு தற்போது சந்தா, கட்டண புகார், சந்திப்பு அல்லது வேறு கட்டண சேவையை விற்கவில்லை. எனவே இந்தக் களஞ்சியத்தில் கட்டணம் அல்லது பணத்திரும்பப் பெறும் நடைமுறை இல்லை.',
      ],
      [
        'Future payments',
        'If the deploying organization introduces paid services, it must publish a service-specific refund and cancellation policy, payment-provider details and support contact before collecting money.',
        'எதிர்கால கட்டணங்கள்',
        'எதிர்காலத்தில் கட்டண சேவைகள் அறிமுகப்படுத்தப்பட்டால், பணம் பெறுவதற்கு முன் சேவை சார்ந்த refund/cancellation policy, payment provider விவரங்கள் மற்றும் உதவி தொடர்பு வெளியிடப்பட வேண்டும்.',
      ],
    ],
  },
};

export const LegalPage: React.FC<{ type: LegalType }> = ({ type }) => {
  const { language } = useApp();
  const page = content[type];
  const tamil = language === 'ta';

  return (
    <article
      className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-10"
      lang={tamil ? 'ta' : 'en'}
    >
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
        {tamil ? page.sections[0][2] : page.title}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        {tamil
          ? 'இது முன்-உற்பத்தி தகவல். உண்மையான சேவை விவரங்களை இயக்குநர் உறுதிப்படுத்த வேண்டும்.'
          : 'Pre-production notice. The deploying operator must confirm these details against the actual service before launch.'}
      </p>
      <div className="mt-8 space-y-7">
        {page.sections.map(([heading, body, tamilHeading, tamilBody]) => (
          <section key={heading}>
            <h2 className="text-base font-bold text-slate-900">{tamil ? tamilHeading : heading}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">{tamil ? tamilBody : body}</p>
          </section>
        ))}
      </div>
    </article>
  );
};
