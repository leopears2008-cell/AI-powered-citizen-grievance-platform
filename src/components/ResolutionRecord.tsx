import React from 'react';
import { CheckCircle2, Printer, ShieldCheck, QrCode } from 'lucide-react';
import { Grievance } from '../types';

interface ResolutionRecordProps {
  grievance: Grievance;
}

export const ResolutionRecord: React.FC<ResolutionRecordProps> = ({ grievance }) => {
  if (grievance.status !== 'Resolved' || !grievance.resolutionVerificationToken) return null;

  const verificationUrl = `${window.location.origin}/verify/${encodeURIComponent(grievance.resolutionVerificationToken)}`;
  const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(verificationUrl)}&size=220&margin=2`;

  const printRecord = () => window.print();

  return (
    <section className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-6 space-y-5 print:shadow-none print:border print:m-0" aria-label="Resolution record">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Verified Resolution Record</h3>
            <p className="text-xs text-slate-500">Use Print → Save as PDF to keep an official record.</p>
          </div>
        </div>
        <button type="button" onClick={printRecord} className="print:hidden inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold">
          <Printer className="w-4 h-4" /> Print / Save PDF
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-6 items-start">
        <div className="space-y-3 text-sm">
          <div><span className="text-slate-500">Grievance ID</span><p className="font-mono font-bold text-slate-900">{grievance.trackId}</p></div>
          <div><span className="text-slate-500">Title</span><p className="font-semibold text-slate-900">{grievance.title}</p></div>
          <div><span className="text-slate-500">Department</span><p className="font-semibold text-slate-900">{grievance.departmentName}</p></div>
          <div><span className="text-slate-500">Officer / Designation</span><p className="font-semibold text-slate-900">{grievance.assignedOfficerName || 'Not recorded'}</p></div>
          <div><span className="text-slate-500">Resolution date</span><p className="font-semibold text-slate-900">{grievance.resolvedAt ? new Date(grievance.resolvedAt).toLocaleString('en-IN') : '—'}</p></div>
          <div><span className="text-slate-500">Resolution summary</span><p className="text-slate-800 leading-relaxed">{grievance.resolutionRemarks || 'Resolution recorded.'}</p></div>
        </div>

        <div className="text-center border border-slate-200 rounded-2xl p-3">
          <img src={qrUrl} alt="QR code for server-side resolution verification" className="w-[190px] h-[190px] mx-auto" loading="eager" />
          <div className="mt-2 flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-700">
            <ShieldCheck className="w-3.5 h-3.5" /> Server verification
          </div>
          <p className="mt-1 break-all text-[9px] text-slate-400">{verificationUrl}</p>
          <QrCode className="hidden" />
        </div>
      </div>
    </section>
  );
};
