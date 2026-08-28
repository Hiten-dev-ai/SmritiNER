import React, { useState } from 'react';
import { Eye, EyeOff, HeartHandshake, Leaf, LockKeyhole, ShieldCheck, UserRoundPlus } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const demoCaretakers = [
  ['hiten', 'Hiten'], ['mahalakshmi', 'Maha Lakshmi'], ['bala', 'Bala'],
  ['jasmine', 'Jasmine'], ['vaishali', 'Vaishali'], ['aishwarya', 'Aishwarya'],
] as const;

export const AuthPage: React.FC = () => {
  const { login, registerCaregiver, authError } = useApp();
  const [registering, setRegistering] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setLocalError('');
    if (registering && password !== confirmPassword) { setLocalError('Passwords do not match.'); return; }
    setSubmitting(true);
    if (registering) await registerCaregiver({ displayName, username, email, password });
    else await login(identifier, password);
    setSubmitting(false);
  };
  const chooseDemo = (value: string) => { setRegistering(false); setIdentifier(value); setPassword('1234'); setLocalError(''); };

  return (
    <main className="min-h-[100dvh] bg-[radial-gradient(circle_at_top_left,#dff6e7_0,#f8fbf9_42%,#fff7e6_100%)] px-4 py-6 sm:py-10">
      <div className="mx-auto grid min-h-[calc(100dvh-3rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-2xl lg:grid-cols-[1.05fr_.95fr]">
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-tea-950 via-tea-800 to-emerald-700 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-assamGold-400/20 blur-2xl" />
          <div className="relative"><div className="flex items-center gap-3"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-xl font-black">স্মৃ</span><div><h1 className="text-3xl font-black">SmritiNER</h1><p className="text-emerald-100">Memory, routine and caregiver support</p></div></div></div>
          <div className="relative max-w-lg"><span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold"><Leaf className="h-4 w-4" /> Built for North Eastern families</span><h2 className="text-5xl font-black leading-[1.05]">Small moments.<br />Stronger memories.</h2><p className="mt-5 text-xl leading-relaxed text-emerald-50">Short, familiar memory journeys for elders—with clear, non-diagnostic support signals for the people who care for them.</p></div>
          <div className="relative grid grid-cols-3 gap-3 text-center text-sm font-bold"><div className="rounded-2xl bg-white/10 p-3">7 memory games</div><div className="rounded-2xl bg-white/10 p-3">3 languages</div><div className="rounded-2xl bg-white/10 p-3">Works offline</div></div>
        </section>

        <section className="flex min-w-0 items-center p-5 sm:p-10">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-7 lg:hidden"><div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-tea-800 font-black text-white">স্মৃ</span><div><h1 className="text-2xl font-black text-tea-950">SmritiNER</h1><p className="text-sm font-semibold text-stone-600">Memory journey</p></div></div></div>
            <div className="mb-6"><span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-tea-100 text-tea-800">{registering ? <UserRoundPlus className="h-6 w-6" /> : <HeartHandshake className="h-6 w-6" />}</span><h2 className="text-3xl font-black text-stone-950">{registering ? 'Create caretaker account' : 'Welcome back'}</h2><p className="mt-2 text-base text-stone-600">{registering ? 'Patients are added securely after you sign in.' : 'Patients and caretakers use this same sign-in.'}</p></div>

            <form onSubmit={submit} className="space-y-4">
              {registering ? <>
                <label className="block"><span className="mb-1.5 block font-bold text-stone-800">Full name</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="name" required className="min-h-[52px] w-full rounded-xl border-2 border-stone-200 px-4 text-base outline-none focus:border-tea-600" /></label>
                <div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-1.5 block font-bold text-stone-800">Username</span><input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required className="min-h-[52px] w-full rounded-xl border-2 border-stone-200 px-4 text-base outline-none focus:border-tea-600" /></label><label><span className="mb-1.5 block font-bold text-stone-800">Email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required className="min-h-[52px] w-full rounded-xl border-2 border-stone-200 px-4 text-base outline-none focus:border-tea-600" /></label></div>
              </> : <label className="block"><span className="mb-1.5 block font-bold text-stone-800">Username or email</span><input value={identifier} onChange={(event) => setIdentifier(event.target.value)} autoComplete="username" required className="min-h-[52px] w-full rounded-xl border-2 border-stone-200 px-4 text-base outline-none focus:border-tea-600" placeholder="Enter your username or email" /></label>}
              <label className="block"><span className="mb-1.5 block font-bold text-stone-800">Password</span><span className="relative block"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={registering ? 'new-password' : 'current-password'} minLength={registering ? 8 : 1} required className="min-h-[52px] w-full rounded-xl border-2 border-stone-200 px-4 pr-14 text-base outline-none focus:border-tea-600" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-1 right-1 flex w-12 items-center justify-center rounded-lg text-stone-600" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff /> : <Eye />}</button></span></label>
              {registering && <label className="block"><span className="mb-1.5 block font-bold text-stone-800">Confirm password</span><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required className="min-h-[52px] w-full rounded-xl border-2 border-stone-200 px-4 text-base outline-none focus:border-tea-600" /></label>}
              {(localError || authError) && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 font-semibold text-rose-800">{localError || authError}</p>}
              <button disabled={submitting} className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-tea-800 px-5 text-lg font-black text-white shadow-lg hover:bg-tea-900 disabled:opacity-60"><LockKeyhole className="h-5 w-5" />{submitting ? 'Please wait…' : registering ? 'Create caretaker account' : 'Sign in'}</button>
            </form>

            <button onClick={() => { setRegistering(!registering); setLocalError(''); }} className="mt-5 min-h-[48px] w-full rounded-xl font-black text-tea-800 hover:bg-tea-50">{registering ? 'Already have an account? Sign in' : 'Register as a caretaker'}</button>

            {!registering && <details className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4"><summary className="cursor-pointer font-black text-amber-950">SIH demo accounts</summary><p className="mt-2 text-sm font-semibold text-amber-900">Select a caretaker, or use patient <strong>bhaben</strong>. Demo password: <strong>1234</strong>.</p><div className="mt-3 grid grid-cols-2 gap-2">{demoCaretakers.map(([value, label]) => <button key={value} type="button" onClick={() => chooseDemo(value)} className="min-h-[44px] rounded-xl border border-amber-300 bg-white px-2 text-sm font-bold text-amber-950">{label}</button>)}<button type="button" onClick={() => chooseDemo('bhaben')} className="col-span-2 min-h-[44px] rounded-xl bg-amber-800 px-3 text-sm font-black text-white">Patient demo: Bhaben</button></div></details>}
            <p className="mt-5 flex items-start gap-2 text-sm text-stone-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />Cognitive engagement support only. Not a dementia diagnosis or medical treatment.</p>
          </div>
        </section>
      </div>
    </main>
  );
};
