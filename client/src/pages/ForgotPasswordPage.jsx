import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { Mail, ArrowLeft, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [devToken, setDevToken] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setMessage('');
    setIsSubmitting(true);
    try {
      const res = await authApi.forgotPassword(email);
      setMessage(res.message);
      if (res.data?.devToken) {
        setDevToken(res.data.devToken);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to submit password reset request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="card-surface max-w-md w-full p-8 shadow-card border border-border space-y-6">
        <div>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-main mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>
          <h1 className="text-2xl font-extrabold text-primary tracking-tight">
            Reset Password
          </h1>
          <p className="text-xs text-muted mt-1">
            Enter your registered email address to receive password reset instructions.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {message && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-3">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{message}</span>
            </div>
            {devToken && (
              <div className="pt-2 border-t border-emerald-200 text-stone-700">
                <p className="font-semibold text-emerald-900 mb-1">
                  Development Simulation Mode:
                </p>
                <p className="text-[11px] mb-2">
                  Since live external SMTP email delivery is optional in local development, you can proceed directly using the generated token:
                </p>
                <Link
                  to={`/reset-password?token=${devToken}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white font-bold rounded-lg text-xs hover:bg-emerald-800 transition"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Proceed to Reset Password
                </Link>
              </div>
            )}
          </div>
        )}

        {!devToken && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-main mb-1.5">
                Registered Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-muted absolute left-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary text-sm py-3 font-bold"
            >
              {isSubmitting ? 'Submitting...' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
