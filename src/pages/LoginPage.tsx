import { useState } from 'react';
import Logo from '../components/Logo';
import { Button } from '../components/ui';
import { View } from '../types';
import { authAPI } from '../services/api';

interface Props {
  navigate: (view: View) => void;
  onLoginSuccess?: (
    role: 'student' | 'teacher' | 'admin',
    user?: any
  ) => void;
}

type LoginRole = 'student' | 'teacher' | 'admin';

const ROLE_CONFIG = {
  student: {
    title: 'Student Portal',
    description: 'Access your courses, classes and learning materials.',
    icon: '🎓',
  },
  teacher: {
    title: 'Teacher Portal',
    description: 'Manage your classes, students and announcements.',
    icon: '👩‍🏫',
  },
  admin: {
    title: 'Admin Portal',
    description: 'Manage students, teachers, courses and the institute.',
    icon: '🛡️',
  },
};

export default function LoginPage({ navigate, onLoginSuccess }: Props) {
  const [selectedRole, setSelectedRole] = useState<LoginRole>('student');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const loginEmail = email.trim();
    const loginPassword = password;

    if (!loginEmail || !loginPassword) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use the existing backend login API
      const data = await authAPI.login(loginEmail, loginPassword);

      const backendRole = data.user?.role;

      if (!backendRole) {
        setError('Unable to determine your account role.');
        setLoading(false);
        return;
      }

      // Convert backend role to frontend role
      const actualRole: LoginRole =
        backendRole === 'ADMIN'
          ? 'admin'
          : backendRole === 'TEACHER'
            ? 'teacher'
            : 'student';

      // IMPORTANT:
      // Make sure the selected portal matches the actual
      // role returned by the backend.
      if (actualRole !== selectedRole) {
        setError(
          `This account is registered as a ${ROLE_CONFIG[actualRole].title.replace(
            ' Portal',
            ''
          )}. Please select the correct portal.`
        );

        // Clear the login session created by the API
        localStorage.removeItem('illumine_token');
        localStorage.removeItem('illumine_user');

        setLoading(false);
        return;
      }

      // Login successful
      if (onLoginSuccess) {
        onLoginSuccess(actualRole, data.user);
      }

      // Redirect to the correct portal
      if (actualRole === 'admin') {
        navigate('admin-dashboard');
      } else if (actualRole === 'teacher') {
        navigate('teacher-dashboard');
      } else {
        navigate('student-dashboard');
      }
    } catch (err: any) {
      console.warn('Backend login notice:', err?.message);

      setError(
        err?.message &&
        !err.message.toLowerCase().includes('request failed')
          ? err.message
          : 'Incorrect email or password.'
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedConfig = ROLE_CONFIG[selectedRole];

  return (
    <div className="relative min-h-full overflow-hidden bg-slate-950">
      <img
        src="https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=2400&h=1600&fit=crop&auto=format"
        alt="Online English class on a laptop"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,12,24,0.94)_0%,rgba(8,22,43,0.82)_44%,rgba(8,22,43,0.44)_100%)]" />
      <div className="absolute inset-0 opacity-25 bg-[linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[size:56px_56px]" />

      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-7xl flex-col px-5 py-6 sm:px-8">
        <header className="flex items-center justify-center sm:justify-start">
          <Logo size="md" className="[&_span]:text-white [&_.text-slate-500]:text-white/60" />
        </header>

        <main className="grid flex-1 items-center gap-10 py-8 lg:grid-cols-[1fr_30rem] lg:py-4">
          <section className="hidden max-w-2xl lg:block">
            <p className="mb-6 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-100 backdrop-blur-xl">
              Illumine Online Portal
            </p>
            <h1 className="font-display text-6xl font-extrabold leading-[0.98] tracking-tight text-white xl:text-7xl">
              Your smart English learning space.
            </h1>
            <p className="mt-7 max-w-xl text-lg font-medium leading-8 text-slate-200">
              Join live online classes, open notes and recordings, track payments, and manage your learning from one secure portal.
            </p>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {[
                ['Live', 'Class links'],
                ['24/7', 'Resources'],
                ['Secure', 'Payments'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-3xl border border-white/16 bg-white/10 p-5 backdrop-blur-xl">
                  <p className="font-display text-2xl font-extrabold text-white">{value}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-100/75">{label}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mx-auto w-full max-w-[30rem]">
            <div className="rounded-[2rem] border border-white/20 bg-white/[0.92] p-5 shadow-[0_32px_90px_rgba(0,0,0,0.34)] backdrop-blur-2xl sm:p-7">
              <div className="mb-7 text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-xl font-extrabold text-white shadow-[0_16px_35px_rgba(15,23,42,0.28)]">
                  I
                </div>
                <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.2em] text-[#1E6BB8]">
                  Secure sign in
                </p>
                <h2 className="font-display text-4xl font-extrabold tracking-tight text-slate-950">
                  Welcome back
                </h2>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
                  Select your portal and continue to your Illumine account.
                </p>
              </div>

              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-800">
                    Portal
                  </label>
                  <span className="text-xs font-semibold text-slate-400">
                    {selectedConfig.title}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100 p-1.5">
                  {(Object.keys(ROLE_CONFIG) as LoginRole[]).map((role) => {
                    const isSelected = selectedRole === role;
                    const label =
                      role === 'student'
                        ? 'Student'
                        : role === 'teacher'
                          ? 'Teacher'
                          : 'Admin';

                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          setSelectedRole(role);
                          setError('');
                        }}
                        className={`rounded-xl px-3 py-3 text-sm font-extrabold transition-all ${
                          isSelected
                            ? 'bg-white text-[#1E6BB8] shadow-[0_10px_24px_rgba(15,23,42,0.11)]'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold leading-5 text-slate-500">
                  {selectedConfig.description}
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-800">
                    Email Address
                    <span className="ml-0.5 text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-13 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#1E6BB8] focus:ring-4 focus:ring-[#1E6BB8]/10"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-800">
                    Password
                    <span className="ml-0.5 text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleLogin();
                        }
                      }}
                      className="h-13 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-12 text-sm font-semibold text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#1E6BB8] focus:ring-4 focus:ring-[#1E6BB8]/10"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPass((s) => !s)}
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                      title={showPass ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#1E6BB8] focus:outline-none focus:ring-2 focus:ring-[#1E6BB8]/40"
                    >
                      {showPass ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A10.8 10.8 0 0112 4.9c5.1 0 8.6 4.1 9.8 6.1a1.9 1.9 0 010 2c-.5.8-1.3 2-2.5 3.1M6.2 6.2C4.5 7.4 3.3 9 2.2 11a1.9 1.9 0 000 2c1.2 2 4.7 6.1 9.8 6.1 1.1 0 2.1-.2 3-.5" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.2 12c1.2-2 4.7-6.1 9.8-6.1s8.6 4.1 9.8 6.1c-1.2 2-4.7 6.1-9.8 6.1S3.4 14 2.2 12z" />
                          <circle cx="12" cy="12" r="2.7" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {selectedRole === 'student' && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => navigate('forgot-password')}
                      className="cursor-pointer text-sm font-bold text-[#1E6BB8] hover:text-[#155a9c] focus:outline-none focus:ring-2 focus:ring-[#1E6BB8]/50 focus:ring-offset-2 rounded"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                <Button
                  fullWidth
                  size="lg"
                  onClick={handleLogin}
                  disabled={loading}
                  className="mt-2 rounded-2xl bg-[#1E6BB8] py-4 text-base font-extrabold shadow-[0_16px_34px_rgba(30,107,184,0.28)] hover:bg-slate-950 hover:shadow-[0_18px_42px_rgba(15,23,42,0.28)]"
                >
                  {loading
                    ? 'Signing in...'
                    : `Continue as ${
                        selectedRole === 'student'
                          ? 'Student'
                          : selectedRole === 'teacher'
                            ? 'Teacher'
                            : 'Admin'
                      }`}
                </Button>
              </div>

              <div className="mt-6 border-t border-slate-200 pt-5 text-center">
                {selectedRole === 'student' ? (
                  <p className="text-sm text-slate-500">
                    New to Illumine?{' '}
                    <button
                      onClick={() => navigate('register')}
                      className="font-bold text-[#1E6BB8] hover:text-[#155a9c]"
                    >
                      Create account
                    </button>
                  </p>
                ) : (
                  <p className="text-xs font-medium leading-5 text-slate-400">
                    {selectedRole === 'teacher'
                      ? 'Teacher accounts are created by the administration.'
                      : 'Admin accounts are managed by the system administrator.'}
                  </p>
                )}
              </div>
            </div>
          </section>
        </main>

        <footer className="pb-1 text-center text-xs font-semibold text-white/45 sm:text-left">
          © 2026 Illumine Worldwide Private Limited
        </footer>
      </div>

    </div>
  );
}
