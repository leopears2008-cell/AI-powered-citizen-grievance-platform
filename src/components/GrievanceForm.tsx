import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { AIAnalysisResponse, GrievanceCategory, GrievancePriority, DuplicateMatch } from '../types';
import { DISTRICT_NAMES, getConstituenciesForDistrict, getMLAForConstituency } from '../data/mlaProfiles';
import {
  Mic,
  FileText,
  Sparkles,
  MapPin,
  Camera,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Edit3,
  ShieldCheck,
  Building2,
  Clock,
  Send,
  User,
  Phone,
  Mail,
  X,
  FileCheck,
  ChevronRight,
  Eye,
  Landmark,
  Search,
} from 'lucide-react';
import confetti from 'canvas-confetti';

/** Tamil names shown beside each district in the selector. */
const DISTRICT_TA: Record<string, string> = {
  Ariyalur: 'அரியலூர்', Chengalpattu: 'செங்கல்பட்டு', Chennai: 'சென்னை', Coimbatore: 'கோயம்புத்தூர்',
  Cuddalore: 'கடலூர்', Dharmapuri: 'தருமபுரி', Dindigul: 'திண்டுக்கல்', Erode: 'ஈரோடு',
  Kallakurichi: 'கள்ளக்குறிச்சி', Kanchipuram: 'காஞ்சிபுரம்', Kanyakumari: 'கன்னியாகுமரி', Karur: 'கரூர்',
  Krishnagiri: 'கிருஷ்ணகிரி', Madurai: 'மதுரை', Mayiladuthurai: 'மயிலாடுதுறை', Nagapattinam: 'நாகப்பட்டினம்',
  Namakkal: 'நாமக்கல்', Nilgiris: 'நீலகிரி', Perambalur: 'பெரம்பலூர்', Pudukkottai: 'புதுக்கோட்டை',
  Ramanathapuram: 'இராமநாதபுரம்', Ranipet: 'இராணிப்பேட்டை', Salem: 'சேலம்', Sivaganga: 'சிவகங்கை',
  Tenkasi: 'தென்காசி', Thanjavur: 'தஞ்சாவூர்', Theni: 'தேனி', Thoothukudi: 'தூத்துக்குடி',
  Tiruchirappalli: 'திருச்சிராப்பள்ளி', Tirunelveli: 'திருநெல்வேலி', Tirupathur: 'திருப்பத்தூர்',
  Tiruppur: 'திருப்பூர்', Tiruvallur: 'திருவள்ளூர்', Tiruvannamalai: 'திருவண்ணாமலை', Tiruvarur: 'திருவாரூர்',
  Vellore: 'வேலூர்', Viluppuram: 'விழுப்புரம்', Virudhunagar: 'விருதுநகர்',
};

interface GrievanceFormProps {
  initialTranscript?: string;
  initialLanguage?: string;
  onOpenVoiceModal: () => void;
  /** Mobile number already verified by OTP (locked, read-only in the form). */
  verifiedMobile?: string;
}

export const GrievanceForm: React.FC<GrievanceFormProps> = ({
  initialTranscript = '',
  initialLanguage = 'Tamil',
  onOpenVoiceModal,
  verifiedMobile,
}) => {
  const { language, t, navigateToTrack, showToast, triggerRefresh, user, complaintPrefill, clearComplaintPrefill } = useApp();

  // Wizard Step: 1 = Input & Evidence, 2 = AI Scanning Loader, 3 = Citizen Confirmation, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [complaintText, setComplaintText] = useState(initialTranscript);
  const [selectedLanguage, setSelectedLanguage] = useState<'Tamil' | 'English'>(
    initialLanguage === 'English' ? 'English' : 'Tamil'
  );

  // Citizen details (phone is locked to the OTP-verified number)
  const [citizenName, setCitizenName] = useState('');
  const [citizenPhone, setCitizenPhone] = useState(verifiedMobile || '');
  const [citizenEmail, setCitizenEmail] = useState('');

  // Location details
  // District/constituency may arrive pre-selected from the MLA & District SLA Directory.
  const [prefilled] = useState(() => !!complaintPrefill);
  const [district, setDistrict] = useState(complaintPrefill?.district ?? 'Chennai');
  const [constituency, setConstituency] = useState(complaintPrefill?.constituency ?? 'Chepauk-Thiruvallikeni');
  const [address, setAddress] = useState(complaintPrefill ? '' : 'No. 42, Kamarajar Salai, Triplicane');
  const [landmark, setLandmark] = useState(complaintPrefill ? '' : 'Opposite Marina Beach Light House');
  const [wardNumber, setWardNumber] = useState(complaintPrefill ? '' : 'Ward 114');
  const [pincode, setPincode] = useState(complaintPrefill ? '' : '600005');
  const [isLocating, setIsLocating] = useState(false);

  const availableConstituencies = useMemo(() => getConstituenciesForDistrict(district), [district]);
  const selectedMla = useMemo(() => getMLAForConstituency(district, constituency), [district, constituency]);

  // Keep the constituency valid for the chosen district.
  useEffect(() => {
    if (availableConstituencies.length > 0 && !availableConstituencies.includes(constituency)) {
      setConstituency(availableConstituencies[0]);
    }
  }, [availableConstituencies, constituency]);

  // The pre-selection has been consumed into the form state above; clear it so it is not reused later.
  useEffect(() => {
    if (complaintPrefill) clearComplaintPrefill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attachments
  const [attachments, setAttachments] = useState<
    Array<{ id: string; url: string; name: string; type: 'image' | 'audio' | 'document'; uploadedAt: string }>
  >([]);

  // AI Analysis Results
  const [aiResult, setAiResult] = useState<AIAnalysisResponse | null>(null);
  const [analyzingStepIndex, setAnalyzingStepIndex] = useState(0);

  // Editable overrides on Confirmation screen
  const [editedCategory, setEditedCategory] = useState<GrievanceCategory>('Street Light');
  const [editedPriority, setEditedPriority] = useState<GrievancePriority>('Medium');
  const [editedDepartment, setEditedDepartment] = useState<string>('Civic Services');
  const [editedSummary, setEditedSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registered Grievance output
  const [registeredId, setRegisteredId] = useState('');

  // Duplicate warning modal
  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMatch[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // When initialTranscript changes from Voice Modal
  React.useEffect(() => {
    if (initialTranscript) {
      setComplaintText(initialTranscript);
    }
  }, [initialTranscript]);

  // GPS Location Locator
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      showToast(
        language === 'ta'
          ? 'உங்கள் உலாவியில் GPS ஆதரிக்கப்படவில்லை'
          : 'Geolocation is not supported by your browser',
        'warning'
      );
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setDistrict('Chennai');
        setAddress(`Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}, Anna Nagar Sector 2`);
        setLandmark('GPS Pinpoint Location');
        showToast(
          language === 'ta' ? 'GPS இருப்பிடம் வெற்றிகரமாக பெறப்பட்டது' : 'GPS location pinned successfully',
          'success'
        );
      },
      (err) => {
        setIsLocating(false);
        showToast(
          language === 'ta'
            ? 'இருப்பிட அணுகல் மறுக்கப்பட்டது. முகவரியை கைமுறையாக உள்ளிடலாம்.'
            : 'GPS location access denied. You can enter the street address manually.',
          'info'
        );
      },
      { timeout: 8000 }
    );
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const newAttachment = {
          id: `att-${Date.now()}`,
          url: event.target.result as string,
          name: file.name,
          type: 'image' as const,
          uploadedAt: new Date().toISOString(),
        };
        setAttachments((prev) => [...prev, newAttachment]);
        showToast(
          language === 'ta' ? 'புகைப்பட ஆதாரம் இணைக்கப்பட்டது' : 'Photo evidence uploaded',
          'success'
        );
      }
    };
    reader.readAsDataURL(file);
  };

  // Step 1 -> Step 2: Trigger AI Analysis
  const handleStartAnalysis = async () => {
    if (!citizenName.trim()) {
      showToast(
        language === 'ta' ? 'தயவுசெய்து உங்கள் முழு பெயரை உள்ளிடவும்' : 'Please enter your full name',
        'warning'
      );
      return;
    }
    if (!complaintText.trim()) {
      showToast(
        language === 'ta'
          ? 'தயவுசெய்யிது புகாரின் விவரத்தை குரல் அல்லது எழுத்து மூலம் பதிவு செய்யவும்'
          : 'Please enter or speak your complaint description first',
        'warning'
      );
      return;
    }

    setStep(2); // Show AI scanner
    setAnalyzingStepIndex(0);

    const stepInterval = setInterval(() => {
      setAnalyzingStepIndex((prev) => (prev < 4 ? prev + 1 : prev));
    }, 450);

    try {
      // 1. Call Gemini AI API
      const result = await api.analyzeComplaint(complaintText, selectedLanguage);
      clearInterval(stepInterval);
      setAiResult(result);
      setEditedCategory(result.category);
      setEditedPriority(result.priority);
      setEditedDepartment(result.department);
      setEditedSummary(language === 'ta' && result.summaryTamil ? result.summaryTamil : result.summary);

      // 2. Check for duplicate complaints in background
      const dupes = await api.checkDuplicates(complaintText, result.category, district);
      if (dupes.length > 0) {
        setDuplicateMatches(dupes);
        setShowDuplicateModal(true);
      }

      setStep(3); // Show Citizen Confirmation
    } catch (err: any) {
      clearInterval(stepInterval);
      console.error('AI Analysis failed:', err);
      showToast('AI analysis failed. Please check network and try again.', 'error');
      setStep(1);
    }
  };

  // Step 3 -> Step 4: Final Submission to Database
  const handleConfirmAndRegister = async () => {
    if (!aiResult) return;
    setIsSubmitting(true);

    try {
      const payload = {
        citizenId: user?.uid || 'anonymous',
        citizenName,
        citizenPhone,
        citizenEmail,
        language: aiResult.language,
        originalTranscript: complaintText,
        summaryEn: aiResult.summary,
        summaryTa: aiResult.summaryTamil || editedSummary,
        category: editedCategory,
        departmentId: editedDepartment.toLowerCase().replace(/\s+/g, '-'),
        departmentName: editedDepartment,
        priority: editedPriority,
        priorityReason: aiResult.priorityReason,
        confidenceScore: aiResult.confidence,
        location: {
          address: address || 'Main City Area',
          landmark: landmark || '',
          district: district || 'Chennai',
          constituency: constituency || '',
          wardNumber: wardNumber || '',
          pincode: pincode || '',
          lat: 13.0827,
          lng: 80.2707,
        },
        attachments,
        entities: aiResult.entities || {},
        estimatedDays: aiResult.estimatedDays || 3,
      };

      const created = await api.createComplaint(payload);
      setRegisteredId(created.id);
      setIsSubmitting(false);
      setStep(4);
      triggerRefresh();

      // Trigger Celebration Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // confetti fallback
      }

      showToast(
        language === 'ta'
          ? `புகார் ${created.id} வெற்றிகரமாகப் பதிவு செய்யப்பட்டது!`
          : `Grievance ${created.id} registered successfully!`,
        'success'
      );
    } catch (err: any) {
      setIsSubmitting(false);
      showToast(err.message || 'Failed to submit grievance', 'error');
    }
  };

  const getPriorityBadgeClass = (priority: GrievancePriority) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-300 ring-2 ring-red-400/20';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Medium':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Low':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Wizard Step Progress Tracker */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
          <div
            className={`p-2 rounded-xl transition-all ${
              step === 1 ? 'bg-navy text-white shadow-xs' : step > 1 ? 'bg-emerald-50 text-emerald-800' : 'text-slate-400 bg-slate-50'
            }`}
          >
            {t.stepInput}
          </div>
          <div
            className={`p-2 rounded-xl transition-all ${
              step === 2 ? 'bg-navy text-white shadow-xs' : step > 2 ? 'bg-emerald-50 text-emerald-800' : 'text-slate-400 bg-slate-50'
            }`}
          >
            {t.stepAnalysis}
          </div>
          <div
            className={`p-2 rounded-xl transition-all ${
              step === 3 ? 'bg-navy text-white shadow-xs' : step > 3 ? 'bg-emerald-50 text-emerald-800' : 'text-slate-400 bg-slate-50'
            }`}
          >
            {t.stepConfirmation}
          </div>
          <div
            className={`p-2 rounded-xl transition-all ${
              step === 4 ? 'bg-ai text-white shadow-xs' : 'text-slate-400 bg-slate-50'
            }`}
          >
            {t.stepSuccess}
          </div>
        </div>
      </div>

      {/* Duplicate Warning Modal Overlay */}
      {showDuplicateModal && duplicateMatches.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-amber-200 overflow-hidden p-6 space-y-4">
            <div className="flex items-center space-x-3 text-amber-800">
              <div className="p-2 bg-amber-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <h3 className="font-bold text-base">
                  {language === 'ta' ? 'இதே போன்ற முந்தைய புகார் கண்டறியப்பட்டது' : 'Similar Active Grievance Found'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'ta'
                    ? 'உங்கள் பகுதியில் ஏற்கனவே இதே பிரச்சனை பதிவு செய்யப்பட்டுள்ளது'
                    : 'A citizen recently filed a similar issue in this neighborhood'}
                </p>
              </div>
            </div>

            <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 space-y-2 text-xs">
              {duplicateMatches.map((d) => (
                <div key={d.id} className="bg-white p-2.5 rounded-lg border border-amber-200/60 flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-blue-700">{d.id}</span>
                      <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        {d.status}
                      </span>
                    </div>
                    <p className="text-slate-700 font-medium mt-1">{d.summary}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">{d.location}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDuplicateModal(false);
                      navigateToTrack(d.id);
                    }}
                    className="shrink-0 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-md font-bold text-[11px] transition-colors"
                  >
                    {language === 'ta' ? 'கண்காணிக்க' : 'Track'}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDuplicateModal(false)}
                className="px-4 py-2 bg-navy text-white rounded-xl text-xs font-bold hover:bg-navy-dark transition-colors"
              >
                {language === 'ta' ? 'புதிய புகாராக தொடரவும்' : 'Continue as New Grievance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 1: INPUT & CITIZEN DETAILS ================= */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col gap-6">
          {/* Header Action Banner */}
          <div className="flex justify-between items-end pb-5 shrink-0">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 font-sans">
                {language === 'ta' ? 'புதிய பொதுமக்கள் குறைதீர்ப்பு பதிவு' : 'AI Grievance Assistant'}
              </h2>
              <p className="text-slate-500 mt-1">
                {language === 'ta'
                  ? 'குரல் அல்லது எழுத்து மூலம் தமிழில்/ஆங்கிலத்தில் விவரிக்கவும்'
                  : 'File your complaint using voice or text in Tamil or English.'}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedLanguage('English')}
                className={`px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium transition-colors ${
                  selectedLanguage === 'English' ? 'bg-navy text-white border-transparent' : 'bg-white hover:bg-slate-50 text-slate-900'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setSelectedLanguage('Tamil')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedLanguage === 'Tamil' ? 'bg-navy text-white shadow-sm' : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-900'
                }`}
              >
                தமிழ் (Tamil)
              </button>
            </div>
          </div>

          {/* Grievance Description Field */}
          <div className="flex flex-col h-full">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              {language === 'ta' ? 'புகாரின் முழு விவரம் *' : 'Grievance Input'}
            </label>

            <div className="relative flex-1 bg-slate-50 rounded-xl p-4 border-2 border-dashed border-slate-200 flex flex-col">
              <textarea
                rows={4}
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder={
                  language === 'ta'
                    ? 'எ.கா: எங்கள் பகுதியில் கடந்த ஒரு வாரமாக தெருவிளக்கு வேலை செய்யவில்லை...'
                    : 'Type your complaint here or click the mic to speak...'
                }
                className="flex-1 bg-transparent border-none focus:ring-0 text-lg resize-none text-slate-700 placeholder-slate-400 w-full"
              />
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={onOpenVoiceModal}
                  className="w-20 h-20 bg-navy hover:bg-navy-dark text-white rounded-full flex items-center justify-center shadow-xl shadow-slate-300 group transition-all transform active:scale-95"
                >
                  <Mic className="w-8 h-8 group-hover:scale-110 transition-transform" />
                </button>
              </div>
              <p className="text-center text-[10px] text-slate-400 mt-3 font-medium uppercase tracking-widest">
                Tap to Speak / பேச தட்டவும்
              </p>
            </div>
          </div>

          {/* Citizen Details Form Section */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <User className="w-4 h-4 text-blue-700" />
              <span>{t.citizenDetailsTitle}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">{t.fullName} *</label>
                <input
                  type="text"
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full p-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">{t.mobileNumber} *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={citizenPhone}
                    onChange={(e) => setCitizenPhone(e.target.value)}
                    readOnly={!!verifiedMobile}
                    aria-readonly={!!verifiedMobile}
                    className={`w-full p-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono ${
                      verifiedMobile ? 'bg-emerald-50 border-emerald-300 pr-8 cursor-not-allowed' : ''
                    }`}
                  />
                  {verifiedMobile && (
                    <CheckCircle2 className="w-4 h-4 text-ai absolute right-2.5 top-1/2 -translate-y-1/2" />
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">{t.emailAddress}</label>
                <input
                  type="email"
                  value={citizenEmail}
                  onChange={(e) => setCitizenEmail(e.target.value)}
                  placeholder="Optional"
                  className="w-full p-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Location & Ward Section */}
          <div className="pt-2">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {language === 'ta' ? 'சம்பவ இடம் மற்றும் முகவரி' : 'Incident Location & Ward'}
              </h3>
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={isLocating}
                className="text-xs font-bold text-navy hover:text-navy-dark bg-sky-tint px-2.5 py-1 rounded-lg border border-slate-200 flex items-center space-x-1 transition-all hover:bg-blue-100"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{isLocating ? (language === 'ta' ? 'GPS தேடுகிறது...' : 'Pinning GPS...') : (language === 'ta' ? 'GPS மூலம் கண்டறிக' : 'Auto-Detect via GPS')}</span>
              </button>
            </div>

            {prefilled && (
              <p className="mb-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-900" role="status">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-ai" aria-hidden="true" />
                <span>
                  {language === 'ta'
                    ? 'MLA & மாவட்ட SLA கையேட்டிலிருந்து மாவட்டமும் தொகுதியும் முன்கூட்டியே நிரப்பப்பட்டுள்ளன. தேவையெனில் மாற்றலாம்.'
                    : 'District and constituency were pre-filled from the MLA & District SLA Directory. You can change them below.'}
                </span>
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">{t.districtLabel} *</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full p-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white"
                >
                  {DISTRICT_NAMES.map((d) => (
                    <option key={d} value={d}>
                      {d}{DISTRICT_TA[d] ? ` (${DISTRICT_TA[d]})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="constituency-select" className="text-[11px] font-semibold text-slate-600 block mb-1">
                  {language === 'ta' ? 'சட்டமன்ற தொகுதி' : 'Constituency'} *
                </label>
                <select
                  id="constituency-select"
                  value={constituency}
                  onChange={(e) => setConstituency(e.target.value)}
                  className="w-full p-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white"
                >
                  {availableConstituencies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl mb-4 flex items-center space-x-3">
              <div aria-hidden="true" className="w-10 h-10 shrink-0 rounded-full border border-indigo-200 bg-white flex items-center justify-center text-indigo-400">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block">
                  {language === 'ta' ? 'உங்கள் தொகுதி சட்டமன்ற உறுப்பினர்' : 'Your Constituency MLA'}
                </span>
                <p className="text-sm font-bold text-indigo-950">
                  {selectedMla.status === 'Vacant'
                    ? language === 'ta' ? 'தொகுதி காலியாக உள்ளது' : 'Seat currently vacant'
                    : selectedMla.name}
                  {selectedMla.party && (
                    <span className="text-xs text-indigo-700 font-medium">
                      {' '}({selectedMla.status === 'Vacant' ? `${language === 'ta' ? 'கடைசியாக' : 'last held'}: ${selectedMla.party}` : selectedMla.party})
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">{t.wardLabel}</label>
                <input
                  type="text"
                  value={wardNumber}
                  onChange={(e) => setWardNumber(e.target.value)}
                  placeholder="e.g. Ward 104 / Zone 8"
                  className="w-full p-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 600040"
                  className="w-full p-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">{t.locationLabel} *</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street name, door number, area"
                  className="w-full p-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">{t.landmarkLabel}</label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="Near temple, school, ration shop, park..."
                  className="w-full p-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Photo Evidence Upload */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Camera className="w-4 h-4 text-blue-700" />
              <span>{t.evidenceTitle}</span>
            </h3>

            <div className="flex flex-wrap items-center gap-3">
              <label className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 p-4 rounded-2xl flex items-center space-x-3 transition-all text-slate-600">
                <UploadCloud className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {language === 'ta' ? 'புகைப்படம் பதிவேற்ற' : 'Upload Evidence Photo'}
                  </p>
                  <p className="text-[10px] text-slate-500">{t.evidenceHelper}</p>
                </div>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>

              {/* Uploaded Thumbnails */}
              {attachments.map((att) => (
                <div key={att.id} className="relative w-16 h-16 rounded-xl border border-slate-300 overflow-hidden group">
                  <img src={att.url} alt="evidence" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                    className="absolute top-1 right-1 p-0.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Next Button */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={handleStartAnalysis}
              className="px-6 py-3 bg-navy hover:bg-navy-dark text-white font-bold text-sm rounded-full shadow-md shadow-slate-300 flex items-center space-x-2 transition-all hover:scale-105"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{language === 'ta' ? 'AI பகுப்பாய்வு செய்க' : 'Analyze Grievance with AI'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: AI SCANNING RADAR LOADER ================= */}
      {step === 2 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10 text-center space-y-6 animate-in fade-in">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-linear-to-tr from-blue-900 via-indigo-800 to-blue-600 flex items-center justify-center text-amber-300 shadow-xl shadow-blue-900/30 animate-pulse">
            <Sparkles className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-xl font-black text-slate-900 font-sans">{t.analyzingTitle}</h3>
            <p className="text-xs text-slate-500 mt-1">
              Gemini 3.7 Flash Engine (NLP Multilingual Parser)
            </p>
          </div>

          <div className="max-w-md mx-auto bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2.5 text-xs">
            <div className={`flex items-center space-x-2 ${analyzingStepIndex >= 0 ? 'text-blue-800 font-bold' : 'text-slate-400'}`}>
              <CheckCircle2 className={`w-4 h-4 ${analyzingStepIndex >= 0 ? 'text-blue-600' : 'text-slate-300'}`} />
              <span>{t.analyzingStep1}</span>
            </div>
            <div className={`flex items-center space-x-2 ${analyzingStepIndex >= 1 ? 'text-blue-800 font-bold' : 'text-slate-400'}`}>
              <CheckCircle2 className={`w-4 h-4 ${analyzingStepIndex >= 1 ? 'text-blue-600' : 'text-slate-300'}`} />
              <span>{t.analyzingStep2}</span>
            </div>
            <div className={`flex items-center space-x-2 ${analyzingStepIndex >= 2 ? 'text-blue-800 font-bold' : 'text-slate-400'}`}>
              <CheckCircle2 className={`w-4 h-4 ${analyzingStepIndex >= 2 ? 'text-blue-600' : 'text-slate-300'}`} />
              <span>{t.analyzingStep3}</span>
            </div>
            <div className={`flex items-center space-x-2 ${analyzingStepIndex >= 3 ? 'text-blue-800 font-bold' : 'text-slate-400'}`}>
              <CheckCircle2 className={`w-4 h-4 ${analyzingStepIndex >= 3 ? 'text-blue-600' : 'text-slate-300'}`} />
              <span>{t.analyzingStep4}</span>
            </div>
            <div className={`flex items-center space-x-2 ${analyzingStepIndex >= 4 ? 'text-blue-800 font-bold' : 'text-slate-400'}`}>
              <CheckCircle2 className={`w-4 h-4 ${analyzingStepIndex >= 4 ? 'text-blue-600' : 'text-slate-300'}`} />
              <span>{t.analyzingStep5}</span>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 3: CITIZEN CONFIRMATION REVIEW ================= */}
      {step === 3 && aiResult && (
        <div className="flex flex-col md:flex-row gap-6 animate-in fade-in h-full">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col flex-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                AI Intelligence Analysis
              </label>
              <span className="ml-auto text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                Confidence: {Math.round((aiResult.confidence || 0.96) * 100)}%
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between border-b border-slate-50 pb-3 items-center">
                <span className="text-sm text-slate-500">Detected Category</span>
                <select
                  value={editedCategory}
                  onChange={(e) => setEditedCategory(e.target.value as GrievanceCategory)}
                  className="text-sm font-semibold text-slate-800 bg-transparent border-none focus:ring-0 text-right pr-0"
                >
                  <option value="Street Light">Street Light</option>
                  <option value="Water Supply">Water Supply</option>
                  <option value="Roads & Potholes">Roads & Potholes</option>
                  <option value="Sanitation & Drainage">Sanitation & Drainage</option>
                  <option value="Electricity & Power">Electricity & Power</option>
                  <option value="Public Health & Fogging">Public Health & Fogging</option>
                  <option value="Transport & Traffic">Transport & Traffic</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex justify-between border-b border-slate-50 pb-3 items-center">
                <span className="text-sm text-slate-500">Department</span>
                <select
                  value={editedDepartment}
                  onChange={(e) => setEditedDepartment(e.target.value)}
                  className="text-sm font-semibold text-slate-800 bg-transparent border-none focus:ring-0 pr-0 text-right max-w-[200px]"
                >
                  <option value={aiResult.department}>{aiResult.department}</option>
                  <option value="Civic Services">Civic Services</option>
                  <option value="Urban Lighting & Street Infrastructure Wing">Urban Lighting & Street Infrastructure Wing</option>
                  <option value="Municipal Water Supply & Drainage Board">Municipal Water Supply & Drainage Board</option>
                  <option value="Tamil Nadu Generation & Distribution Corp">Tamil Nadu Generation & Distribution Corp</option>
                  <option value="Solid Waste Management & Public Sanitation">Solid Waste Management & Public Sanitation</option>
                  <option value="Highways & Municipal Works Department">Highways & Municipal Works Department</option>
                  <option value="Public Health & Fogging Department">Public Health & Fogging Department</option>
                </select>
              </div>

              <div className="flex justify-between border-b border-slate-50 pb-3 items-center">
                <span className="text-sm text-slate-500">Priority</span>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${editedPriority === 'Critical' ? 'bg-red-500' : editedPriority === 'High' ? 'bg-orange-400' : editedPriority === 'Medium' ? 'bg-yellow-400' : 'bg-green-400'}`}></span>
                  <select
                    value={editedPriority}
                    onChange={(e) => setEditedPriority(e.target.value as GrievancePriority)}
                    className="text-sm font-semibold text-slate-800 bg-transparent border-none focus:ring-0 pr-0"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between border-b border-slate-50 pb-3">
                <span className="text-sm text-slate-500">Auto Summary</span>
                <textarea
                  rows={2}
                  value={editedSummary}
                  onChange={(e) => setEditedSummary(e.target.value)}
                  className="text-sm font-semibold text-slate-800 text-right max-w-[240px] bg-transparent border-none focus:ring-0 resize-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-navy rounded-2xl p-6 text-white shadow-xl shadow-slate-200 flex-1 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-lg mb-2">Ready to Submit?</h4>
              <p className="text-slate-300 text-sm">
                AI has successfully classified your grievance. Please confirm the details to receive your tracking ID.
              </p>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 bg-navy-dark hover:bg-slate-800 rounded-xl font-semibold text-sm transition-colors border border-white/20"
              >
                Modify
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmAndRegister}
                className="flex-1 py-3 bg-ai text-white hover:bg-emerald-600 rounded-xl font-bold text-sm transition-colors flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <span>Register Grievance</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 4: SUCCESS REGISTRATION SCREEN ================= */}
      {step === 4 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-12 text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 border-4 border-emerald-200 flex items-center justify-center text-emerald-600 shadow-lg shadow-emerald-600/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-sans">
              {t.successTitle}
            </h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto">
              {t.successSub}
            </p>
          </div>

          {/* Grievance ID Banner Card */}
          <div className="max-w-md mx-auto bg-navy-dark text-white p-5 rounded-2xl shadow-xl border border-slate-800 space-y-2">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              {t.grievanceIdLabel}
            </p>
            <p className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-amber-300">
              {registeredId}
            </p>
            <p className="text-[11px] text-slate-400">
              {t.keepIdSafe}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigateToTrack(registeredId)}
              className="w-full sm:w-auto px-6 py-3 bg-navy hover:bg-navy-dark text-white font-bold text-sm rounded-full shadow-md shadow-slate-300 flex items-center justify-center space-x-2 transition-all hover:scale-105"
            >
              <Eye className="w-4 h-4" />
              <span>{t.btnTrackNow}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setComplaintText('');
                setAttachments([]);
                setAiResult(null);
                setStep(1);
              }}
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-full border border-slate-300 transition-colors"
            >
              {t.btnFileAnother}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
