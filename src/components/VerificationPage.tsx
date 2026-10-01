import React, { useEffect, useState } from 'react';
import { CheckCircle2, ShieldAlert, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export const VerificationPage: React.FC = () => {
  const [state, setState] = useState<{loading:boolean; data:any; error:string}>({loading:true,data:null,error:''});

  useEffect(() => {
    const token = window.location.pathname.split('/').filter(Boolean).pop() || '';
    api.verifyResolution(token)
      .then(data => setState({loading:false,data,error:''}))
      .catch(err => setState({loading:false,data:null,error:err?.message || 'Verification failed.'}));
  }, []);

  if (state.loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;
  }

  if (!state.data?.verified) {
    return <div className="max-w-xl mx-auto my-16 bg-white rounded-2xl border border-red-200 p-8 text-center">
      <ShieldAlert className="w-12 h-12 mx-auto text-red-600 mb-4" />
      <h1 className="text-xl font-bold text-slate-900">Verification failed</h1>
      <p className="text-sm text-slate-500 mt-2">{state.error || 'This resolution record could not be verified.'}</p>
    </div>;
  }

  return <div className="max-w-2xl mx-auto my-12 bg-white rounded-2xl border border-emerald-200 shadow-sm p-8">
    <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
      <CheckCircle2 className="w-10 h-10 text-emerald-600" />
      <div><h1 className="text-2xl font-bold text-slate-900">Resolution Verified</h1><p className="text-sm text-slate-500">Verified directly against the grievance system.</p></div>
    </div>
    <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
      <div><dt className="text-slate-500">Grievance ID</dt><dd className="font-mono font-bold">{state.data.grievanceId}</dd></div>
      <div><dt className="text-slate-500">Status</dt><dd className="font-semibold text-emerald-700">{state.data.status}</dd></div>
      <div className="sm:col-span-2"><dt className="text-slate-500">Title</dt><dd className="font-semibold">{state.data.title}</dd></div>
      <div><dt className="text-slate-500">Department</dt><dd>{state.data.department}</dd></div>
      <div><dt className="text-slate-500">Resolution date</dt><dd>{state.data.resolvedAt ? new Date(state.data.resolvedAt).toLocaleString('en-IN') : '—'}</dd></div>
      <div className="sm:col-span-2"><dt className="text-slate-500">Resolution</dt><dd className="mt-1 leading-relaxed">{state.data.resolutionSummary || 'Resolution recorded.'}</dd></div>
      <div className="sm:col-span-2"><dt className="text-slate-500">Officer / Designation</dt><dd>{state.data.officerDesignation || 'Not recorded'}</dd></div>
    </dl>
  </div>;
};
