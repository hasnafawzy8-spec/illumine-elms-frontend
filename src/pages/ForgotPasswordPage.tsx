import { useEffect, useState } from 'react';
import Logo from '../components/Logo';
import { Button, Input } from '../components/ui';
import { View } from '../types';
import { authAPI } from '../services/api';

interface Props {
  navigate: (view: View) => void;
}

const strongPasswordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,100}$/;

export default function ForgotPasswordPage({ navigate }: Props) {
  const token = new URLSearchParams(window.location.search).get('resetToken') || '';
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!success || !token) return;
    const redirectTimer = window.setTimeout(() => {
      window.history.replaceState(null, '', window.location.pathname);
      navigate('login');
    }, 1800);
    return () => window.clearTimeout(redirectTimer);
  }, [navigate, success, token]);

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!token) {
      const normalizedEmail = email.trim();
      if (!normalizedEmail) {
        setError('Enter your registered email address.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        setError('Enter a valid email address.');
        return;
      }

      setLoading(true);
      try {
        await authAPI.requestPasswordReset(normalizedEmail);
        setSubmitted(true);
        setSuccess('A password reset link has been sent to your registered email address. The link expires in 10 minutes.');
      } catch (err: any) {
        setError(err.message || 'Unable to send the reset link. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError('Enter and confirm your new password.');
      return;
    }
    if (!strongPasswordPattern.test(newPassword)) {
      setError('Password must be 8–100 characters and include an uppercase letter, a number, and a special character.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.resetPassword(token, newPassword);
      setSuccess(response.message || 'Password reset successfully. Redirecting you to sign in…');
    } catch (err: any) {
      setError(err.message || 'The reset link is invalid or expired. Request a new link and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-full overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_rgba(30,107,184,0.4),_transparent_48%),linear-gradient(135deg,#050c18,#08162b_55%,#12304a)]">

      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-7xl flex-col px-5 py-6 sm:px-8">
        <header className="flex justify-center sm:justify-start">
          <Logo size="md" className="[&_span]:text-white [&_.text-slate-500]:text-white/60" />
        </header>

        <main className="grid flex-1 items-center gap-10 py-8 lg:grid-cols-[1fr_30rem] lg:py-4">
          <section className="hidden max-w-2xl lg:block">
            <p className="mb-6 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-100 backdrop-blur-xl">
              Illumine Student Portal
            </p>
            <h1 className="font-display text-6xl font-extrabold leading-[0.98] tracking-tight text-white xl:text-7xl">
              Get back to learning.
            </h1>
            <p className="mt-7 max-w-xl text-lg font-medium leading-8 text-slate-200">
              Reset your password securely using a one-time link sent to your registered student email address.
            </p>
          </section>

          <section className="mx-auto w-full max-w-[30rem]">
            <div className="rounded-[2rem] border border-white/20 bg-white/[0.92] p-5 shadow-[0_32px_90px_rgba(0,0,0,0.34)] backdrop-blur-2xl sm:p-7">
              <div className="mb-7 text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-xl font-extrabold text-white shadow-[0_16px_35px_rgba(15,23,42,0.28)]">I</div>
                <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.2em] text-[#1E6BB8]">Account recovery</p>
                <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-950">
                  {token ? 'Create a new password' : 'Forgot Password?'}
                </h2>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
                  {token
                    ? 'Choose a strong password for your student portal account.'
                    : 'Enter your registered email and we’ll send you a secure reset link.'}
                </p>
              </div>

              {error && (
                <p role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </p>
              )}
              {success && (
                <p role="status" className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  {success}
                </p>
              )}

              {!token ? (
                <div className="space-y-4">
                  <Input
                    label="Registered Email Address"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={setEmail}
                    disabled={submitted}
                    required
                  />
                  {!submitted && (
                    <Button fullWidth size="lg" onClick={handleSubmit} disabled={loading}>
                      {loading ? 'Sending reset link…' : 'Send Reset Link'}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <Input
                    label="New Password"
                    type="password"
                    autoComplete="new-password"
                    hint="8–100 characters, with an uppercase letter, a number, and a special character."
                    value={newPassword}
                    onChange={setNewPassword}
                    required
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    required
                  />
                  {!success && (
                    <Button fullWidth size="lg" onClick={handleSubmit} disabled={loading}>
                      {loading ? 'Resetting password…' : 'Reset Password'}
                    </Button>
                  )}
                </div>
              )}

              <div className="mt-6 border-t border-slate-200 pt-5 text-center">
                <button
                  type="button"
                  onClick={() => {
                    if (token) window.history.replaceState(null, '', window.location.pathname);
                    navigate('login');
                  }}
                  className="cursor-pointer text-sm font-bold text-[#1E6BB8] hover:text-[#155a9c] focus:outline-none focus:ring-2 focus:ring-[#1E6BB8]/50 focus:ring-offset-2 rounded"
                >
                  Back to sign in
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
