import React from 'react';
import { useApp } from '../context/AppContext';

type LegalType = 'privacy' | 'terms' | 'cookies';

const content: Record<LegalType, { title: string; sections: Array<[string, string, string, string]> }> = {
  privacy: {
    title: 'Privacy notice',
    sections: [
      ['Information handled', 'Complaint text, contact details, language, user-entered location, optional GPS coordinates and optional image evidence are stored with a grievance in Firebase Firestore. Admin authentication is handled by Firebase Authentication.', 'கையாளப்படும் தகவல்கள்', 'புகார் உரை, தொடர்பு விவரங்கள், மொழி, பயனர் உள்ளிட்ட இருப்பிடம், விருப்ப GPS ஆயத்தொலைவுகள் மற்றும் விருப்பப் புகைப்பட ஆதாரம் Firebase Firestore-இல் சேமிக்கப்படும். நிர்வாக உள்நுழைவுக்கு Firebase Authentication பயன்படுத்தப்படுகிறது.'],
      ['AI processing', 'When you request analysis or duplicate checking, complaint text and the district/category needed for matching are sent from the server to Google Gemini. Do not include unnecessary sensitive personal information. AI output is a suggestion and must be reviewed by an authorized person.', 'செயற்கை நுண்ணறிவு செயலாக்கம்', 'பகுப்பாய்வு அல்லது நகல் புகார் சரிபார்ப்பைத் தொடங்கும்போது, புகார் உரையும் பொருத்தத்திற்குத் தேவையான மாவட்டம்/வகையும் சேவையகத்திலிருந்து Google Gemini-க்கு அனுப்பப்படும். தேவையற்ற முக்கிய தனிப்பட்ட தகவல்களைச் சேர்க்க வேண்டாம். AI வெளியீடு பரிந்துரை மட்டுமே; அங்கீகரிக்கப்பட்ட நபர் சரிபார்க்க வேண்டும்.'],
      ['Voice input', 'Voice recognition uses the browser Web Speech API. The browser or its speech provider may process audio; the exact provider and retention depend on the browser. The app receives the transcript. You can type instead.', 'குரல் உள்ளீடு', 'குரல் அறிதலுக்கு உலாவியின் Web Speech API பயன்படுத்தப்படுகிறது. உலாவி அல்லது அதன் குரல் சேவை ஒலியைச் செயலாக்கலாம்; சேவை வழங்குநரும் சேமிப்பு காலமும் உலாவியைப் பொறுத்தது. பயன்பாடு உரை மாற்றத்தைப் பெறுகிறது. விரும்பினால் தட்டச்சு செய்யலாம்.'],
      ['Retention and requests', 'The production data-retention period, deletion process, privacy-request contact and responsible organization have not been configured in this codebase. They must be supplied by the service operator before public launch.', 'தரவு சேமிப்பும் கோரிக்கைகளும்', 'உற்பத்தி பயன்பாட்டிற்கான தரவு சேமிப்பு காலம், நீக்க நடைமுறை, தனியுரிமை கோரிக்கை தொடர்பு மற்றும் பொறுப்பான நிறுவனம் இக்குறியீட்டில் அமைக்கப்படவில்லை. பொதுப் பயன்பாட்டுக்கு முன் சேவை இயக்குநர் இவற்றை வழங்க வேண்டும்.'],
      ['India privacy review', 'This notice is not legal advice and does not establish compliance. The service operator must confirm applicable obligations under the Digital Personal Data Protection Act, 2023 and rules/guidance in force, actual Firebase/Google processing locations and terms, notice/consent requirements, retention, security safeguards and rights workflows with qualified counsel.', 'இந்திய தனியுரிமை சட்ட ஆய்வு', 'இது சட்ட ஆலோசனை அல்ல; சட்ட இணக்கத்தை உறுதிப்படுத்துவதும் இல்லை. Digital Personal Data Protection Act, 2023 மற்றும் நடைமுறையிலுள்ள விதிகள்/வழிகாட்டுதல்கள், Firebase/Google தரவு செயலாக்க இடங்கள் மற்றும் விதிமுறைகள், அறிவிப்பு/ஒப்புதல், சேமிப்பு காலம், பாதுகாப்பு மற்றும் உரிமைக் கோரிக்கை நடைமுறைகளை தகுதியான சட்ட ஆலோசகருடன் சேவை இயக்குநர் உறுதிப்படுத்த வேண்டும்.'],
    ],
  },
  terms: {
    title: 'Terms and conditions',
    sections: [
      ['Service status', 'This repository contains a pre-production application. No government affiliation, official complaint channel, service-level commitment or authorized operator is established by this software.', 'சேவை நிலை', 'இந்தக் களஞ்சியத்தில் முன்-உற்பத்தி பயன்பாடு உள்ளது. இந்த மென்பொருள் அரசு இணைப்பு, அதிகாரப்பூர்வ புகார் வழி, சேவை உறுதி அல்லது அங்கீகரிக்கப்பட்ட இயக்குநரை நிறுவவில்லை.'],
      ['AI assistance', 'Classification, priority, duplicate matches and resolution text are system-generated suggestions. They are not verified findings or decisions and must not be represented as such.', 'AI உதவி', 'வகைப்பாடு, முன்னுரிமை, நகல் பொருத்தங்கள் மற்றும் தீர்வு உரை ஆகியவை கணினி உருவாக்கும் பரிந்துரைகள். அவை சரிபார்க்கப்பட்ட முடிவுகள் அல்ல; அப்படியாகக் காட்டக்கூடாது.'],
      ['Operator review required', 'The service operator must publish its identity, support channel, final terms, complaint-handling scope and applicable legal notices before production use. Obtain legal review for final terms.', 'இயக்குநர் ஆய்வு தேவை', 'உற்பத்திக்கு முன் சேவை இயக்குநர் தனது அடையாளம், உதவி தொடர்பு, இறுதி விதிமுறைகள், புகார் கையாளும் வரம்பு மற்றும் பொருந்தும் சட்ட அறிவிப்புகளை வெளியிட வேண்டும். இறுதி விதிமுறைகளுக்கு சட்ட ஆய்வு பெறவும்.'],
    ],
  },
  cookies: {
    title: 'Cookies and browser storage',
    sections: [
      ['Authentication storage', 'Firebase Authentication may use browser-managed persistence to keep an admin session. This source does not intentionally load advertising pixels or optional analytics.', 'உள்நுழைவு சேமிப்பு', 'நிர்வாக அமர்வை வைத்திருக்க Firebase Authentication உலாவி சேமிப்பைப் பயன்படுத்தலாம். இந்த மூலக் குறியீடு விளம்பர கண்காணிப்பு அல்லது விருப்ப பகுப்பாய்வு கருவிகளை நோக்கத்துடன் ஏற்றவில்லை.'],
      ['Speech recognition', 'Browser speech recognition is provided by the browser or its vendor and may have its own network, storage and privacy behavior. Check the browser provider’s notice before using voice input.', 'குரல் அறிதல்', 'உலாவி அல்லது அதன் வழங்குநர் குரல் அறிதலை வழங்குகிறது; அதற்கென நெட்வொர்க், சேமிப்பு மற்றும் தனியுரிமை நடைமுறைகள் இருக்கலாம். குரல் உள்ளீட்டுக்கு முன் உலாவி வழங்குநரின் அறிவிப்பைப் பார்க்கவும்.'],
      ['Future tracking', 'If non-essential analytics or advertising are introduced, the operator must review applicable consent requirements and update this notice before enabling them.', 'எதிர்கால கண்காணிப்பு', 'விருப்ப பகுப்பாய்வு அல்லது விளம்பர கருவிகள் பின்னர் சேர்க்கப்பட்டால், அவற்றை இயக்கும் முன் பொருந்தும் ஒப்புதல் தேவைகளை இயக்குநர் ஆய்வு செய்து இந்த அறிவிப்பைப் புதுப்பிக்க வேண்டும்.'],
    ],
  },
};

export const LegalPage: React.FC<{ type: LegalType }> = ({ type }) => {
  const { language } = useApp();
  const page = content[type];
  const tamil = language === 'ta';
  return (
    <article className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-10" lang={tamil ? 'ta' : 'en'}>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{tamil ? page.sections[0][2] : page.title}</h1>
      <p className="mt-2 text-sm text-slate-600">{tamil ? 'இது முன்-உற்பத்தி தகவல். உண்மையான சேவை விவரங்களை இயக்குநர் உறுதிப்படுத்த வேண்டும்.' : 'Pre-production notice. The operator must confirm these details against the actual deployed service.'}</p>
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
