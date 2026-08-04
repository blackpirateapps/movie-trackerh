'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { LogIn, Key, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Forgot / Reset password state
  const [showReset, setShowReset] = useState<boolean>(false);
  const [targetUser, setTargetUser] = useState<string>('');
  const [rootPassword, setRootPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [resetLoading, setResetLoading] = useState<boolean>(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setResetLoading(true);

    try {
      const { data } = await api.post<{ message: string }>('/api/auth', {
        action: 'reset-password',
        usernameOrEmail: targetUser.trim(),
        rootPassword: rootPassword,
        newPassword: newPassword,
      });

      setSuccess(data.message || 'Password updated successfully. You can now sign in.');
      setShowReset(false);
      setEmail(targetUser);
      setPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-[#121212] text-[#EDEDED]">
      <div className="max-w-md w-full">
        <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-6 rounded">

          <div className="text-center space-y-1">
            <div className="w-10 h-10 bg-[#00FF66] text-[#121212] rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
              <LogIn className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-[#EDEDED]">
              Sign In
            </h1>
            <p className="text-xs text-[#A0A0A0]">
              Access your media collection & logs
            </p>
          </div>

          {success && (
            <div className="p-3 bg-[#00FF66]/10 border border-[#00FF66]/30 rounded flex items-center gap-2 text-[#00FF66] text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 rounded flex items-center gap-2 text-[#ff4d4d] text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!showReset ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-widest text-[#A0A0A0] mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input text-xs py-2"
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="block text-xs font-bold uppercase tracking-widest text-[#A0A0A0]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setSuccess('');
                      setShowReset(true);
                    }}
                    className="text-xs text-[#00FF66] hover:underline font-semibold"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input text-xs py-2"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-1.5 mt-4"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#121212] border-t-transparent" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div className="p-2.5 bg-[#121212] border border-[#333333] rounded text-xs text-[#00FF66] font-semibold flex items-center gap-2">
                <Key className="w-4 h-4 text-[#00FF66]" />
                <span>Admin Password Reset</span>
              </div>

              <div>
                <label htmlFor="targetUser" className="block text-[10px] font-bold uppercase tracking-widest text-[#A0A0A0] mb-1">
                  Username or Email
                </label>
                <input
                  id="targetUser"
                  type="text"
                  value={targetUser}
                  onChange={(e) => setTargetUser(e.target.value)}
                  className="form-input text-xs py-1.5"
                  required
                />
              </div>

              <div>
                <label htmlFor="rootPassword" className="block text-[10px] font-bold uppercase tracking-widest text-[#A0A0A0] mb-1">
                  Root Admin Password
                </label>
                <input
                  id="rootPassword"
                  type="password"
                  value={rootPassword}
                  onChange={(e) => setRootPassword(e.target.value)}
                  className="form-input text-xs py-1.5"
                  required
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-[10px] font-bold uppercase tracking-widest text-[#A0A0A0] mb-1">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-input text-xs py-1.5"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowReset(false)}
                  className="btn btn-secondary flex-1 text-xs py-2"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={resetLoading}
                  className="btn btn-primary flex-1 text-xs py-2"
                >
                  {resetLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}

          <div className="text-center pt-3 border-t border-[#333333]">
            <p className="text-xs text-[#A0A0A0]">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-[#00FF66] hover:underline font-bold">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
