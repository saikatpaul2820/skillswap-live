import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess?: () => void;
  onSuccessRegistered?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
  onSuccessRegistered,
}) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'register') {
      if (!name.trim() || !email.trim() || !password) {
        setError('Please fill in all required fields.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await register({
          name: name.trim(),
          email: email.trim(),
          password,
          confirmPassword,
        });
        onClose();
        if (onSuccess) onSuccess();
        if (result.isNewUser && onSuccessRegistered) {
          onSuccessRegistered();
        }
      } catch (err: any) {
        setError(err.message || 'Registration failed.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!email.trim() || !password) {
        setError('Please enter your email and password.');
        return;
      }

      setIsSubmitting(true);
      try {
        await login(email.trim(), password);
        onClose();
        if (onSuccess) onSuccess();
      } catch (err: any) {
        setError(err.message || 'Invalid email or password.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(demoEmail, 'password123');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {mode === 'login' ? 'Welcome Back' : 'Join SkillSwap'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === 'login'
                ? 'Sign in to access your skills and exchanges'
                : 'Create your account and start peer-to-peer skill exchange'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {forgotSent && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl">
              Password reset link sent to {email || 'your email'}! (For demo, use password: password123)
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => setForgotSent(true)}
                  className="text-[11px] text-indigo-600 hover:underline"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === 'login' ? 'Login' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Mode Switcher */}
          <div className="text-center pt-2">
            {mode === 'login' ? (
              <p className="text-xs text-slate-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  className="font-semibold text-indigo-600 hover:underline"
                >
                  Create Account
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-600">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="font-semibold text-indigo-600 hover:underline"
                >
                  Login here
                </button>
              </p>
            )}
          </div>
        </form>

        {/* Demo Fast Login Banner */}
        <div className="bg-slate-50 border-t border-slate-100 p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Instant Demo Test Accounts</span>
          </div>
          <p className="text-[11px] text-slate-500 mb-2.5">
            Click any profile to test peer-to-peer match exchanges:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('sarah@skillswap.io')}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-lg text-left transition-colors"
            >
              <span className="font-semibold text-slate-800 block text-[11px]">Sarah Chen</span>
              <span className="text-[10px] text-slate-500">UI/UX ↔ Java</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('rahul@skillswap.io')}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-lg text-left transition-colors"
            >
              <span className="font-semibold text-slate-800 block text-[11px]">Rahul Sharma</span>
              <span className="text-[10px] text-slate-500">Java ↔ UI/UX</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('elena@skillswap.io')}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-lg text-left transition-colors"
            >
              <span className="font-semibold text-slate-800 block text-[11px]">Elena Rostova</span>
              <span className="text-[10px] text-slate-500">Python ↔ React</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('marcus@skillswap.io')}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-lg text-left transition-colors"
            >
              <span className="font-semibold text-slate-800 block text-[11px]">Marcus Brody</span>
              <span className="text-[10px] text-slate-500">Video ↔ Python</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
