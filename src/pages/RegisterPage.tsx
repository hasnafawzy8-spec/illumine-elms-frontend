import { useState, type ReactNode } from 'react';
import Logo from '../components/Logo';
import { Button, Input, Select } from '../components/ui';
import { View } from '../types';
import { authAPI } from '../services/api';

interface Props {
  navigate: (view: View) => void;
}

const grades = [
  { value: '', label: 'Select Grade' },
  ...Array.from({ length: 11 }, (_, i) => ({ value: `Grade ${i + 1}`, label: `Grade ${i + 1}` })),
];

const benefits = [
  'Live class access',
  'Progress tracking',
  'Secure payments',
  'Parent updates',
];

const trustStats = [
  ['2K+', 'active learners'],
  ['4.9', 'parent rating'],
  ['12+', 'course paths'],
];

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M16.5 5.75 8.25 14 4 9.75" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StepPill({ number, title, active, complete }: { number: number; title: string; active: boolean; complete: boolean }) {
  return (
    <div className={`flex min-w-0 items-center gap-3 rounded-2xl border p-2.5 ${active ? 'border-[#1E6BB8]/25 bg-[#1E6BB8]/8 text-slate-950' : 'border-slate-200 bg-white text-slate-500'}`}>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold ${complete ? 'bg-[#12A36B] text-white' : active ? 'bg-[#1E6BB8] text-white' : 'bg-slate-100 text-slate-400'}`}>
        {complete ? <CheckIcon className="h-4 w-4" /> : number}
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-extrabold uppercase tracking-[0.16em] text-current/55">Step {number}</span>
        <span className="block truncate text-sm font-extrabold">{title}</span>
      </span>
    </div>
  );
}

function FieldSection({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#1E6BB8]">{eyebrow}</p>
        <h3 className="mt-1 font-display text-xl font-extrabold tracking-tight text-slate-950">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const strength = checks.filter(Boolean).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', 'bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-green-500'];
  return password ? (
    <div className="mt-2">
      <div className="mb-1.5 flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength ? colors[strength] : 'bg-slate-200'}`} />
        ))}
      </div>
      <p className={`text-xs font-bold ${strength <= 1 ? 'text-red-500' : strength === 2 ? 'text-amber-500' : strength === 3 ? 'text-blue-500' : 'text-green-600'}`}>
        {labels[strength]} password
      </p>
    </div>
  ) : null;
}

function EyeIcon({ open, className = '' }: { open: boolean; className?: string }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M2.75 12s3.5-6 9.25-6 9.25 6 9.25 6-3.5 6-9.25 6-9.25-6-9.25-6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="m3 3 18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9.9 5.18A9.77 9.77 0 0 1 12 5c5.75 0 9.25 7 9.25 7a15.4 15.4 0 0 1-2.38 3.2M6.64 6.92C4.08 8.56 2.75 12 2.75 12s3.5 7 9.25 7a9.8 9.8 0 0 0 4.23-.95" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PasswordInput({
  label,
  placeholder,
  value,
  onChange,
  visible,
  onToggleVisible,
  error,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-bold text-slate-700">
        {label}<span className="ml-0.5 text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={event => onChange(event.target.value)}
          className={`w-full rounded-2xl border bg-white px-4 py-3 pr-14 text-sm font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#1E6BB8] focus:ring-4 focus:ring-[#1E6BB8]/10 ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-slate-200'}`}
        />
        <button
          type="button"
          onClick={onToggleVisible}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute right-2.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-[#1E6BB8]"
        >
          <EyeIcon open={visible} className="h-5 w-5" />
        </button>
      </div>
      {error && <p className="text-xs font-bold text-red-500">{error}</p>}
    </div>
  );
}

export default function RegisterPage({ navigate }: Props) {
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '',
    dob: '', grade: '', guardianName: '', guardianPhone: '', address: '', profileImage: '',
  });

  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const namePattern = /^[A-Za-z\s]+$/;

  const handleFirstNameChange = (val: string) => {
    // Only letters (A-Z) and spaces
    const clean = val.replace(/[^A-Za-z\s]/g, '');
    setForm(f => ({ ...f, firstName: clean }));
  };

  const handleLastNameChange = (val: string) => {
    // Only letters (A-Z) and spaces
    const clean = val.replace(/[^A-Za-z\s]/g, '');
    setForm(f => ({ ...f, lastName: clean }));
  };

  const continueToGuardianDetails = () => {
    const fn = form.firstName.trim();
    const ln = form.lastName.trim();

    if (!fn) {
      setError('First name is required.');
      return;
    }
    if (!namePattern.test(fn)) {
      setError('First name must contain only alphabetic letters (A–Z). Numbers and special characters are not allowed.');
      return;
    }

    if (!ln) {
      setError('Last name is required.');
      return;
    }
    if (!namePattern.test(ln)) {
      setError('Last name must contain only alphabetic letters (A–Z). Numbers and special characters are not allowed.');
      return;
    }
    if (!emailPattern.test(form.email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!/^\d{10}$/.test(form.phone)) {
      setError('Phone number must contain exactly 10 digits.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!form.dob || !form.grade) {
      setError('Date of birth and grade are required.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleProfileImageChange = (file?: File) => {
    if (!file) {
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    const isValidExtension = ['jpg', 'jpeg', 'png'].includes(extension || '');

    if (!validTypes.includes(file.type) && !isValidExtension) {
      setError('Invalid file format. Only JPG, JPEG, and PNG images are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm(current => ({ ...current, profileImage: String(reader.result) }));
      setError('');
    };
    reader.onerror = () => {
      setError('Failed to read the selected file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!form.guardianName.trim()) {
      setError('Guardian name is required.');
      return;
    }
    if (!/^\d{10}$/.test(form.guardianPhone)) {
      setError('Guardian phone number must contain exactly 10 digits.');
      return;
    }
    if (!form.address.trim()) {
      setError('Address is required.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await authAPI.register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone,
        role: 'STUDENT',
        profileImage: form.profileImage,
        dateOfBirth: form.dob,
        grade: form.grade,
        guardianName: form.guardianName.trim(),
        guardianPhone: form.guardianPhone,
        address: { street: form.address.trim(), city: 'Colombo' },
      });
      setSuccess(true);
    } catch (err: any) {
      console.warn('Registration API notice:', err?.message);
      setError(err?.message || 'Account could not be created. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-full bg-[#F5F8FB] p-5 sm:p-8">
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-[0_28px_90px_rgba(15,23,42,0.14)] lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative hidden overflow-hidden bg-slate-950 lg:block">
            <img
              src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1400&h=1800&fit=crop&auto=format"
              alt="Students learning English in class"
              className="absolute inset-0 h-full w-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,12,24,0.72)_0%,rgba(7,21,42,0.46)_45%,rgba(5,12,24,0.92)_100%)]" />
            <div className="relative z-10 flex h-full flex-col justify-between p-10">
              <Logo size="md" className="[&_span]:text-white [&_.text-slate-500]:text-white/65" />
              <div>
                <p className="mb-4 inline-flex rounded-full border border-white/20 bg-white/12 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-white/85 backdrop-blur-xl">
                  Student profile ready
                </p>
                <h1 className="font-display text-5xl font-extrabold leading-tight tracking-tight text-white">
                  Welcome to your Illumine learning journey.
                </h1>
                <p className="mt-5 max-w-md text-base font-medium leading-7 text-blue-50/82">
                  Courses, schedules, books and payments are ready from one secure student account.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center p-6 sm:p-10">
            <div className="w-full max-w-md text-center fade-in-up">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#12A36B] text-white shadow-[0_20px_45px_rgba(18,163,107,0.26)]">
                <CheckIcon className="h-10 w-10" />
              </div>
              <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.2em] text-[#1E6BB8]">Account created</p>
              <h2 className="font-display text-4xl font-extrabold tracking-tight text-slate-950">You're all set, {form.firstName || 'student'}.</h2>
              <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-slate-500">Your Illumine student account is ready. Sign in to continue to courses, schedules and class updates.</p>
              <div className="my-7 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left">
                <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">Account details</p>
                <div className="space-y-2 text-sm font-semibold text-slate-700">
                  <p><span className="text-slate-400">Email:</span> {form.email || 'ayesha@example.com'}</p>
                  <p><span className="text-slate-400">Grade:</span> {form.grade || 'Grade 10'}</p>
                </div>
              </div>
              <Button fullWidth size="lg" onClick={() => navigate('login')} className="rounded-2xl">Login to Your Account</Button>
              <button onClick={() => navigate('landing')} className="mt-4 text-sm font-bold text-slate-400 hover:text-[#1E6BB8]">Back to website</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-screen min-h-full bg-[#F5F8FB] text-slate-950">
      <div className="grid min-h-full lg:grid-cols-[minmax(23rem,0.82fr)_minmax(0,1.18fr)]">
        <aside className="relative hidden overflow-hidden bg-slate-950 lg:block">
          <img
            src="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1500&h=1900&fit=crop&auto=format"
            alt="Illumine English classroom"
            className="absolute inset-0 h-full w-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,18,35,0.82)_0%,rgba(7,22,44,0.46)_42%,rgba(5,12,24,0.94)_100%)]" />
          <div className="absolute inset-0 opacity-30 bg-[linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[size:72px_72px]" />

          <div className="relative z-10 flex min-h-full flex-col justify-between p-10 xl:p-12">
            <Logo size="md" className="[&_span]:text-white [&_.text-slate-500]:text-white/65" />

            <div className="max-w-xl">
              <p className="mb-5 inline-flex rounded-full border border-white/20 bg-white/12 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-blue-50 backdrop-blur-xl">
                2026 student enrolment
              </p>
              <h1 className="font-display text-5xl font-extrabold leading-[1.03] tracking-tight text-white xl:text-6xl">
                Build confident English from day one.
              </h1>
              <p className="mt-6 max-w-md text-base font-medium leading-7 text-blue-50/82">
                Create one secure account for classes, course materials, books, schedules and parent updates.
              </p>

              <div className="mt-8 grid grid-cols-3 gap-3">
                {trustStats.map(([value, label]) => (
                  <div key={label} className="rounded-3xl border border-white/16 bg-white/12 p-4 backdrop-blur-xl">
                    <p className="font-display text-2xl font-extrabold text-white">{value}</p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-blue-50/70">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                {benefits.map((item) => (
                  <span key={item} className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/10 px-3.5 py-2 text-xs font-bold text-white/86 backdrop-blur-xl">
                    <CheckIcon className="h-3.5 w-3.5 text-[#47D18C]" />
                    {item}
                  </span>
                ))}
              </div>
              <p className="text-xs font-semibold text-blue-100/65">© 2026 Illumine Worldwide Private Limited</p>
            </div>
          </div>
        </aside>

        <main className="flex min-h-full items-start justify-center overflow-y-auto px-5 py-6 sm:px-8 lg:px-10 xl:px-14">
          <div className="w-full max-w-3xl py-3 sm:py-6">
            <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="lg:hidden">
                <Logo size="md" />
              </div>
              <div className="min-w-0">
                <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.2em] text-[#1E6BB8]">Student registration</p>
                <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Create your account</h2>
                <p className="mt-2 text-sm font-medium text-slate-500">Step {step} of 2 · {step === 1 ? 'Personal details' : 'Guardian details'}</p>
              </div>
              <button
                onClick={() => navigate('login')}
                className="inline-flex w-fit items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-600 shadow-sm hover:border-[#1E6BB8]/40 hover:text-[#1E6BB8]"
              >
                Sign in
              </button>
            </header>

            <div className="mb-5 grid gap-3 sm:grid-cols-2">
              <StepPill number={1} title="Personal details" active={step === 1} complete={step > 1} />
              <StepPill number={2} title="Guardian details" active={step === 2} complete={false} />
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
              <div className="h-1.5 bg-slate-100">
                <div className={`h-full rounded-r-full bg-[#1E6BB8] ${step === 1 ? 'w-1/2' : 'w-full'}`} />
              </div>
              <div className="p-5 sm:p-8">
                {step === 1 ? (
                  <FieldSection eyebrow="Profile" title="Personal information">

                    {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</div>}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input label="First Name" placeholder="Ayesha" value={form.firstName} onChange={handleFirstNameChange} required />
                      <Input label="Last Name" placeholder="Fernando" value={form.lastName} onChange={handleLastNameChange} required />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input label="Email Address" type="email" placeholder="ayesha@example.com" value={form.email} onChange={set('email')} required />
                      <Input label="Phone Number" type="tel" inputMode="numeric" maxLength={10} placeholder="0712345678" value={form.phone} onChange={v => set('phone')(v.replace(/\D/g, '').slice(0, 10))} required />
                    </div>

                    <div>
                      <PasswordInput
                        label="Password"
                        placeholder="Create a strong password"
                        value={form.password}
                        onChange={set('password')}
                        visible={showPassword}
                        onToggleVisible={() => setShowPassword(value => !value)}
                      />
                      <PasswordStrength password={form.password} />
                    </div>

                    <PasswordInput
                      label="Confirm Password"
                      placeholder="Repeat your password"
                      value={form.confirmPassword}
                      onChange={set('confirmPassword')}
                      visible={showConfirmPassword}
                      onToggleVisible={() => setShowConfirmPassword(value => !value)}
                      error={form.confirmPassword && form.confirmPassword !== form.password ? "Passwords do not match" : undefined}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input label="Date of Birth" type="date" max={today} value={form.dob} onChange={set('dob')} required />
                      <Select label="Grade" value={form.grade} onChange={set('grade')} options={grades} required />
                    </div>

                    <Button fullWidth size="lg" onClick={continueToGuardianDetails} className="rounded-2xl bg-[#1E6BB8] py-4 shadow-[0_16px_32px_rgba(30,107,184,0.22)]">Continue</Button>
                  </FieldSection>
                ) : (
                  <FieldSection eyebrow="Contact" title="Guardian and address">

                    {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</div>}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input label="Guardian Name" placeholder="Mohamed Fernando" value={form.guardianName} onChange={set('guardianName')} required />
                      <Input label="Guardian Phone" type="tel" inputMode="numeric" maxLength={10} placeholder="0772345678" value={form.guardianPhone} onChange={v => set('guardianPhone')(v.replace(/\D/g, '').slice(0, 10))} required />
                    </div>

                <div>
                  <label className="text-sm font-bold text-slate-700">Address<span className="text-red-500 ml-0.5">*</span></label>
                  <textarea
                    placeholder="45/A, Rajagiriya Road, Nugegoda, Colombo"
                    value={form.address}
                    onChange={e => set('address')(e.target.value)}
                    rows={3}
                    className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#1E6BB8] focus:ring-4 focus:ring-[#1E6BB8]/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Profile Image <span className="text-xs text-slate-400">(optional)</span></label>
                  <label className="block cursor-pointer rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center transition-colors hover:border-[#1E6BB8] hover:bg-blue-50/40">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      className="hidden"
                      onChange={e => {
                        handleProfileImageChange(e.target.files?.[0]);
                        e.target.value = '';
                      }}
                    />

                    {form.profileImage ? (
                      <div className="space-y-3">
                        <img src={form.profileImage} alt="Profile preview" className="mx-auto h-24 w-24 rounded-2xl border border-slate-200 object-cover shadow-sm" />
                        <p className="text-sm font-extrabold text-[#1E6BB8]">Change profile photo</p>
                      </div>
                    ) : (
                      <div>
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#1E6BB8] shadow-sm">
                          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                            <path d="M12 16V8m0 0-3 3m3-3 3 3M5 19h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <p className="text-sm font-bold text-slate-600">Upload student photo</p>
                        <p className="mt-1 text-xs font-medium text-slate-400">PNG or JPG up to 5MB</p>
                      </div>
                    )}
                  </label>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium leading-6 text-slate-600">
                  By creating an account, you agree to Illumine's <span className="cursor-pointer font-bold text-[#1E6BB8]">Terms of Service</span> and <span className="cursor-pointer font-bold text-[#1E6BB8]">Privacy Policy</span>.
                </div>

                <div className="grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
                  <Button variant="outline" size="lg" onClick={() => setStep(1)} className="rounded-2xl">Back</Button>
                  <Button size="lg" onClick={handleSubmit} disabled={loading} className="rounded-2xl py-4 shadow-[0_16px_32px_rgba(30,107,184,0.22)]">
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </div>
                  </FieldSection>
                )}
              </div>
          </div>

          <p className="mt-6 text-center text-xs font-bold text-slate-400">
            <button onClick={() => navigate('landing')} className="hover:text-[#1E6BB8]">Back to website</button>
          </p>
        </div>
        </main>
      </div>
    </div>
  );
}
