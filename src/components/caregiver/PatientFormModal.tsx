import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Printer,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AuthenticatedPatient } from '../../types';

interface PatientFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => Promise<void>;
}

const states = [
  'Assam',
  'Arunachal Pradesh',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Sikkim',
  'Tripura',
];

export const PatientFormModal: React.FC<PatientFormModalProps> = ({
  open,
  onClose,
  onCreated,
}) => {
  const { createPatient } = useApp();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [createdPatient, setCreatedPatient] = useState<{
    patient: AuthenticatedPatient;
    temporaryPassword: string;
  } | null>(null);

  const [clientRequestId, setClientRequestId] = useState('');
  const formTopRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    name: '',
    username: '',
    password: '',
    age: '',
    dateOfBirth: '',
    gender: 'Prefer not to say',
    preferredLanguage: 'English',
    state: 'Assam',
    district: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    clinicianCondition: '',
    careNotes: '',
  });

  useEffect(() => {
    if (open) {
      setStep(1);
      setError('');
      setSaving(false);
      setCreatedPatient(null);
      setCopied(false);
      setClientRequestId(`req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
      setForm({
        name: '',
        username: '',
        password: '',
        age: '',
        dateOfBirth: '',
        gender: 'Prefer not to say',
        preferredLanguage: 'English',
        state: 'Assam',
        district: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        clinicianCondition: '',
        careNotes: '',
      });
    }
  }, [open]);

  if (!open) return null;

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError('');
  };

  const validateStep1 = () => {
    if (!form.name.trim()) return 'Please enter the patient’s full name.';
    if (!form.username.trim() || form.username.trim().length < 3)
      return 'Username must be at least 3 characters.';
    if (!/^[a-z0-9._-]+$/i.test(form.username.trim()))
      return 'Username may only contain letters, numbers, dots, dashes, and underscores.';
    if (!form.password || form.password.length < 4)
      return 'Temporary password must be at least 4 characters.';
    if (form.password.length > 64)
      return 'Temporary password must not exceed 64 characters.';
    return null;
  };

  const validateStep2 = () => {
    const ageNum = Number(form.age);
    if (!form.age || isNaN(ageNum) || ageNum < 45 || ageNum > 120)
      return 'Please enter a valid age between 45 and 120.';
    if (!form.district.trim()) return 'Please enter the district or village name.';
    return null;
  };

  const validateStep3 = () => {
    if (!form.emergencyContactName.trim())
      return 'Please enter an emergency contact name.';
    if (!form.emergencyContactPhone.trim())
      return 'Please enter an emergency contact phone number.';
    const phoneClean = form.emergencyContactPhone.replace(/[\s-]/g, '');
    if (!/^\+?[0-9]{10,14}$/.test(phoneClean))
      return 'Please enter a valid phone number (at least 10 digits).';
    return null;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      const err = validateStep1();
      if (err) {
        setError(err);
        formTopRef.current?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      setStep(2);
      setError('');
    } else if (step === 2) {
      const err = validateStep2();
      if (err) {
        setError(err);
        formTopRef.current?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      setStep(3);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep3();
    if (err) {
      setError(err);
      formTopRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setSaving(true);
    setError('');
    try {
      const patient = await createPatient({
        ...form,
        name: form.name.trim(),
        username: form.username.trim().toLowerCase(),
        age: Number(form.age),
        clientRequestId,
      });
      await onCreated();
      setCreatedPatient({
        patient,
        temporaryPassword: form.password,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create patient account.');
      formTopRef.current?.scrollIntoView({ behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const copyCredentials = () => {
    if (!createdPatient) return;
    const text = `SmritiNER Patient Credentials:\nPatient: ${createdPatient.patient.name}\nUsername: ${createdPatient.patient.username}\nTemporary Password: ${createdPatient.temporaryPassword}\nLogin at: ${window.location.origin}`;
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const printCredentials = () => {
    window.print();
  };

  const inputClass =
    'min-h-12 w-full rounded-2xl border-2 border-stone-200 bg-stone-50/50 px-4 text-base font-semibold text-stone-900 outline-none transition focus:border-tea-600 focus:bg-white';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/60 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="patient-form-title"
    >
      <div className="flex max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-tea-100 text-tea-800">
              <UserPlus className="h-6 w-6" />
            </span>
            <div>
              <h2 id="patient-form-title" className="text-xl font-black text-stone-900">
                {createdPatient ? 'Patient Account Ready' : 'Add New Patient'}
              </h2>
              <p className="text-xs font-semibold text-stone-500">
                {createdPatient
                  ? 'Credentials saved. Share them with the patient or family.'
                  : `Step ${step} of 3 — ${
                      step === 1
                        ? 'Account & Sign-In'
                        : step === 2
                        ? 'Personal Details'
                        : 'Emergency & Routine'
                    }`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200 transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div ref={formTopRef} />

        {/* Wizard Step Indicator (if not on success card) */}
        {!createdPatient && (
          <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/80 px-6 py-3">
            {[
              { num: 1, label: 'Account' },
              { num: 2, label: 'Profile' },
              { num: 3, label: 'Care Support' },
            ].map((s) => (
              <div key={s.num} className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black transition ${
                    step === s.num
                      ? 'bg-tea-700 text-white ring-4 ring-tea-100'
                      : step > s.num
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {step > s.num ? <Check className="h-4 w-4" /> : s.num}
                </div>
                <span
                  className={`hidden text-xs font-bold sm:inline ${
                    step === s.num ? 'text-tea-950 font-black' : 'text-stone-500'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Content Area */}
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl bg-rose-50 p-4 border border-rose-200 text-rose-800 animate-fadeIn">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          {createdPatient ? (
            /* --- SUCCESS CREDENTIALS CARD --- */
            <div className="space-y-6 animate-fadeIn">
              <div className="rounded-3xl border-2 border-emerald-300 bg-emerald-50/60 p-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-2xl font-black text-emerald-950">
                  {createdPatient.patient.name}
                </h3>
                <p className="mt-1 text-sm font-semibold text-emerald-800">
                  Account created and selected in your workspace.
                </p>

                {/* Printable credential ticket */}
                <div className="mt-5 rounded-2xl border-2 border-dashed border-emerald-300 bg-white p-5 text-left shadow-sm">
                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="text-xs font-black uppercase tracking-wider text-stone-500">
                      SmritiNER Elder Login Card
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-tea-700">
                      <Sparkles className="h-3.5 w-3.5" /> Ready to play
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <span className="block text-xs font-bold text-stone-500">Username</span>
                      <span className="text-lg font-black text-stone-950">
                        {createdPatient.patient.username}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-stone-500">
                        Temporary Password
                      </span>
                      <span className="text-lg font-mono font-black text-stone-950">
                        {createdPatient.temporaryPassword}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-stone-500">Language</span>
                      <span className="text-sm font-bold text-stone-800">
                        {createdPatient.patient.preferredLanguage}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-stone-500">District</span>
                      <span className="text-sm font-bold text-stone-800">
                        {createdPatient.patient.district}, {createdPatient.patient.state}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={copyCredentials}
                  className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-stone-300 bg-white font-black text-stone-800 hover:bg-stone-50 transition shadow-sm"
                >
                  {copied ? <Check className="h-5 w-5 text-emerald-600" /> : <Copy className="h-5 w-5" />}
                  {copied ? 'Copied to clipboard!' : 'Copy Credentials'}
                </button>
                <button
                  type="button"
                  onClick={printCredentials}
                  className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-stone-300 bg-white font-black text-stone-800 hover:bg-stone-50 transition shadow-sm"
                >
                  <Printer className="h-5 w-5" />
                  Print Card
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full min-h-14 rounded-2xl bg-tea-700 font-black text-white text-lg shadow-lg hover:bg-tea-800 transition"
              >
                Open Patient Workspace
              </button>
            </div>
          ) : (
            /* --- WIZARD FORM STEPS --- */
            <form id="patient-wizard-form" onSubmit={step === 3 ? handleSubmit : handleNext}>
              {/* STEP 1: Account */}
              {step === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-black text-stone-800">
                      Patient Full Name <span className="text-rose-600">*</span>
                    </span>
                    <input
                      required
                      autoFocus
                      placeholder="e.g. Biren Das"
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      className={inputClass}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-black text-stone-800">
                      Patient Username <span className="text-rose-600">*</span>
                    </span>
                    <input
                      required
                      minLength={3}
                      autoCapitalize="none"
                      autoCorrect="off"
                      placeholder="e.g. biren_das"
                      value={form.username}
                      onChange={(e) => update('username', e.target.value.toLowerCase())}
                      className={inputClass}
                    />
                    <span className="mt-1 block text-xs font-semibold text-stone-500">
                      Used by the elder to sign in. Letters, numbers, and dot/dash only.
                    </span>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-black text-stone-800">
                      Initial Temporary Password <span className="text-rose-600">*</span>
                    </span>
                    <div className="relative">
                      <input
                        required
                        minLength={4}
                        maxLength={64}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="At least 4 characters"
                        value={form.password}
                        onChange={(e) => update('password', e.target.value)}
                        className={`${inputClass} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-stone-500 hover:text-stone-800"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <span className="mt-1 block text-xs font-semibold text-stone-500">
                      Minimum 4 characters (simple temporary password for elder accessibility).
                    </span>
                  </label>
                </div>
              )}

              {/* STEP 2: Basic Details */}
              {step === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-black text-stone-800">
                        Age <span className="text-rose-600">*</span>
                      </span>
                      <input
                        required
                        type="number"
                        min={45}
                        max={120}
                        placeholder="45–120"
                        value={form.age}
                        onChange={(e) => update('age', e.target.value)}
                        className={inputClass}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-black text-stone-800">
                        Date of Birth (Optional)
                      </span>
                      <input
                        type="date"
                        value={form.dateOfBirth}
                        onChange={(e) => update('dateOfBirth', e.target.value)}
                        className={inputClass}
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-black text-stone-800">Gender</span>
                      <select
                        value={form.gender}
                        onChange={(e) => update('gender', e.target.value)}
                        className={inputClass}
                      >
                        <option>Prefer not to say</option>
                        <option>Female</option>
                        <option>Male</option>
                        <option>Other</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-black text-stone-800">
                        Preferred Language
                      </span>
                      <select
                        value={form.preferredLanguage}
                        onChange={(e) => update('preferredLanguage', e.target.value)}
                        className={inputClass}
                      >
                        <option>English</option>
                        <option>Hindi</option>
                        <option>Assamese</option>
                      </select>
                    </label>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-black text-stone-800">State</span>
                      <select
                        value={form.state}
                        onChange={(e) => update('state', e.target.value)}
                        className={inputClass}
                      >
                        {states.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-black text-stone-800">
                        District / Village <span className="text-rose-600">*</span>
                      </span>
                      <input
                        required
                        placeholder="e.g. Majuli / Jorhat"
                        value={form.district}
                        onChange={(e) => update('district', e.target.value)}
                        className={inputClass}
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 3: Support Details */}
              {step === 3 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-black text-stone-800">
                        Emergency Contact Name <span className="text-rose-600">*</span>
                      </span>
                      <input
                        required
                        placeholder="e.g. Priya Das (Daughter)"
                        value={form.emergencyContactName}
                        onChange={(e) => update('emergencyContactName', e.target.value)}
                        className={inputClass}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-black text-stone-800">
                        Emergency Contact Phone <span className="text-rose-600">*</span>
                      </span>
                      <input
                        required
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={form.emergencyContactPhone}
                        onChange={(e) => update('emergencyContactPhone', e.target.value)}
                        className={inputClass}
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-black text-stone-800">
                      Clinician-Recorded Condition (Optional)
                    </span>
                    <input
                      placeholder="Only record an existing clinician-provided condition"
                      value={form.clinicianCondition}
                      onChange={(e) => update('clinicianCondition', e.target.value)}
                      className={inputClass}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-black text-stone-800">
                      Care & Routine Notes (Optional)
                    </span>
                    <textarea
                      placeholder="Daily routine notes, favorite memories, preferences..."
                      value={form.careNotes}
                      onChange={(e) => update('careNotes', e.target.value)}
                      className={`${inputClass} min-h-24 py-3`}
                    />
                  </label>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer actions for wizard */}
        {!createdPatient && (
          <div className="flex items-center justify-between border-t border-stone-100 bg-stone-50/50 p-4 sm:p-5">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => {
                  setStep((s) => (s - 1) as 1 | 2);
                  setError('');
                }}
                className="flex min-h-12 items-center gap-2 rounded-2xl border-2 border-stone-300 bg-white px-5 font-black text-stone-700 hover:bg-stone-100 transition"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="min-h-12 rounded-2xl border-2 border-stone-300 bg-white px-5 font-black text-stone-700 hover:bg-stone-100 transition"
              >
                Cancel
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex min-h-12 items-center gap-2 rounded-2xl bg-tea-700 px-6 font-black text-white shadow-md hover:bg-tea-800 transition"
              >
                Next <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={handleSubmit}
                className="flex min-h-12 items-center gap-2 rounded-2xl bg-tea-700 px-6 font-black text-white shadow-lg hover:bg-tea-800 transition disabled:opacity-50"
              >
                {saving ? 'Creating…' : 'Create Patient Account'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
