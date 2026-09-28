import React from 'react';

type LegalType = 'privacy' | 'terms' | 'cookies' | 'refund';

const content: Record<LegalType, { title: string; sections: Array<[string, string]> }> = {
  privacy: {
    title: 'Privacy Policy',
    sections: [
      ['Information we collect', 'This application may collect information that a citizen chooses to submit in a grievance, such as contact details, complaint text, location details and attachments. Admin users provide account credentials required for authentication.'],
      ['Why we use it', 'Information is used to register, classify, route and track grievances, communicate service updates, prevent abuse, and operate the administrative dashboard.'],
      ['Data minimization', 'Only fields necessary for the selected grievance workflow should be submitted. Do not upload identity documents, medical records, financial information, passwords or other sensitive material unless the final service design specifically requires it.'],
      ['Sharing', 'AI processing and hosting providers may process data required to provide the feature. The production deployment must document each provider, processing purpose, retention period and applicable transfer safeguards before launch.'],
      ['Your requests', 'A production deployment should provide a verified channel for privacy requests, correction, deletion and other rights that apply to the processing. The contact details for that channel must be configured by the service owner.'],
      ['Legal review', 'This policy is an implementation template, not legal advice. The service owner should have the final notice reviewed for the Digital Personal Data Protection Act, applicable rules, sector-specific requirements and the actual vendor/data flows before launch.'],
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    sections: [
      ['Use of the service', 'Use the portal only for genuine civic grievance reporting and authorized administrative work. Do not submit unlawful, abusive, fraudulent or intentionally misleading content.'],
      ['AI-generated assistance', 'AI classification and drafting are assistive outputs. Authorized personnel must verify material decisions, routing and resolution remarks before relying on them.'],
      ['Availability', 'The service may be unavailable during maintenance or because of failures in external services. Production service levels and support commitments must be defined by the service owner.'],
      ['User responsibilities', 'Users are responsible for the accuracy of information they submit and for keeping account credentials confidential.'],
      ['Legal review', 'The final terms, liability language, dispute provisions and jurisdiction clauses require review by the service owner and qualified legal counsel.'],
    ],
  },
  cookies: {
    title: 'Cookie & Local Storage Policy',
    sections: [
      ['Current design', 'The application does not intentionally load advertising pixels or third-party analytics in the reviewed source. Firebase Authentication may maintain authentication/session state using browser-managed storage mechanisms.'],
      ['Optional tracking', 'No optional analytics or advertising tracker should be enabled without an appropriate consent mechanism where required. If analytics are added later, update this notice and implement consent before loading the optional SDK.'],
      ['Changing preferences', 'If optional tracking is introduced, the production site should provide a persistent privacy/settings control that lets users withdraw consent.'],
    ],
  },
  refund: {
    title: 'Refund & Cancellation Policy',
    sections: [
      ['Current applicability', 'The reviewed application does not implement a paid subscription, checkout or payment flow. A refund policy is therefore not currently applicable to the grievance workflow.'],
      ['If payments are added', 'Before enabling paid services, publish the exact pricing, cancellation, refund, failed-payment and support rules that apply to the payment provider and service.'],
    ],
  },
};

export const LegalPage: React.FC<{ type: LegalType }> = ({ type }) => {
  const page = content[type];
  return (
    <article className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{page.title}</h1>
      <p className="mt-2 text-sm text-slate-500">Last reviewed: 28 September 2026. Update this notice whenever the production data flows change.</p>
      <div className="mt-8 space-y-7">
        {page.sections.map(([heading, body]) => (
          <section key={heading}>
            <h2 className="text-base font-bold text-slate-900">{heading}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
          </section>
        ))}
      </div>
    </article>
  );
};