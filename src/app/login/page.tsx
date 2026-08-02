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
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="card-postit relative">
          <div className="thumbtack" />

          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-[#2d5da1] text-white border-3 border-[#2d2d2d] rounded-full flex items-center justify-center mx-auto mb-3 shadow-[3px_3px_0px_#2d2d2d] -rotate-3">
              <LogIn className="w-7 h-7 stroke-[2.5]" />
            </div>
            <h1 className="text-4xl font-heading font-bold text-[#2d2d2d] mb-1">
              Welcome Back!
            </h1>
            <p className="text-lg text-[#2d2d2d]/80 font-semibold">
              Sign in to your CineTracker account
            </p>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-[#2d5da1]/10 border-2 border-[#2d5da1] rounded-xl flex items-center gap-3 text-[#2d5da1] font-bold">
              <CheckCircle2 className="w-6 h-6 stroke-[3] shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-[#ff4d4d]/10 border-2 border-[#ff4d4d] rounded-xl flex items-center gap-3 text-[#ff4d4d] font-bold">
              <AlertTriangle className="w-6 h-6 stroke-[3] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!showReset ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-lg font-bold mb-1 text-[#2d2d2d]">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="block text-lg font-bold text-[#2d2d2d]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setSuccess('');
                      setShowReset(true);
                    }}
                    className="text-sm text-[#2d5da1] hover:underline font-bold"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-primary w-full py-3 text-xl flex items-center justify-center gap-2 mt-6"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-3 border-white" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-5 h-5 stroke-[3]" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3 bg-[#fff9c4] border-2 border-[#2d2d2d] rounded-xl text-sm text-[#2d2d2d] font-bold mb-4 flex items-center gap-2">
                <Key className="w-5 h-5 stroke-[2.5] text-[#ff4d4d]" />
                <span>Admin Password Reset Mode</span>
              </div>

              <div>
                <label htmlFor="targetUser" className="block text-base font-bold mb-1">
                  Target Username or Email
                </label>
                <input
                  id="targetUser"
                  type="text"
                  value={targetUser}
                  onChange={(e) => setTargetUser(e.target.value)}
                  className="form-input"
                  placeholder="Username or email"
                  required
                />
              </div>

              <div>
                <label htmlFor="rootPassword" className="block text-base font-bold mb-1">
                  Root Admin Password
                </label>
                <input
                  id="rootPassword"
                  type="password"
                  value={rootPassword}
                  onChange={(e) => setRootPassword(e.target.value)}
                  className="form-input"
                  placeholder="Vercel ROOT_ADMIN_PASSWORD"
                  required
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-base font-bold mb-1">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-input"
                  placeholder="Min 6 characters"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowReset(false)}
                  className="btn btn-secondary flex-1 py-2.5 text-base"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={resetLoading}
                  className="btn btn-primary flex-1 py-2.5 text-base"
                >
                  {resetLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 text-center pt-4 border-t-2 border-dashed border-[#2d2d2d]/30">
            <p className="text-base font-semibold text-[#2d2d2d]/80">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-[#ff4d4d] hover:underline font-bold">
                Sign up here!
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
