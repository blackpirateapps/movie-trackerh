'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

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
      <div className="max-w-md w-full space-y-6">
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-gray-400">Sign in to your account</p>
          </div>

          {success && (
            <div className="mb-6 bg-green-900/20 border border-green-700 rounded-lg p-4 flex items-center gap-2 text-green-300">
              <span>✅</span>
              {success}
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-900/20 border border-red-700 rounded-lg p-4 flex items-center gap-2 text-red-300">
              <span>⚠️</span>
              {error}
            </div>
          )}

          {!showReset ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-medium">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setSuccess('');
                      setShowReset(true);
                    }}
                    className="text-xs text-primary-400 hover:text-primary-300 font-medium"
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
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-primary w-full py-3"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="p-3 bg-amber-900/20 border border-amber-700/40 rounded-lg text-xs text-amber-300 mb-4">
                🔑 <strong>Admin Password Reset (Temporary)</strong>: Requires the Root Admin Password configured in Vercel environment variables (`ROOT_ADMIN_PASSWORD`).
              </div>

              <div>
                <label htmlFor="targetUser" className="block text-sm font-medium mb-2">
                  Target Username or Email
                </label>
                <input
                  id="targetUser"
                  type="text"
                  value={targetUser}
                  onChange={(e) => setTargetUser(e.target.value)}
                  className="form-input"
                  placeholder="Username or email of account"
                  required
                />
              </div>

              <div>
                <label htmlFor="rootPassword" className="block text-sm font-medium mb-2">
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
                <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-input"
                  placeholder="Enter new password (min 6 chars)"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowReset(false)}
                  className="btn btn-secondary flex-1 py-3"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={resetLoading}
                  className="btn btn-primary flex-1 py-3"
                >
                  {resetLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-primary-400 hover:text-primary-300 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
