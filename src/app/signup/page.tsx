'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { UserPlus, AlertTriangle, ArrowRight } from 'lucide-react';

export default function Signup() {
  const [email, setEmail] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { signup } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await signup(email, username, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="card-postit relative">
          <div className="tape-strip" />

          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-[#ff4d4d] text-white border-3 border-[#2d2d2d] rounded-full flex items-center justify-center mx-auto mb-3 shadow-[3px_3px_0px_#2d2d2d] rotate-3">
              <UserPlus className="w-7 h-7 stroke-[2.5]" />
            </div>
            <h1 className="text-4xl font-heading font-bold text-[#2d2d2d] mb-1">
              Join CineTracker!
            </h1>
            <p className="text-lg text-[#2d2d2d]/80 font-semibold">
              Create your movie tracking notebook
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-[#ff4d4d]/10 border-2 border-[#ff4d4d] rounded-xl flex items-center gap-3 text-[#ff4d4d] font-bold">
              <AlertTriangle className="w-6 h-6 stroke-[3] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <label htmlFor="username" className="block text-lg font-bold mb-1 text-[#2d2d2d]">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
                placeholder="movie_buff99"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-lg font-bold mb-1 text-[#2d2d2d]">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="Min. 6 characters"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-lg font-bold mb-1 text-[#2d2d2d]">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
                placeholder="Repeat your password"
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
                  Creating Account...
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-5 h-5 stroke-[3]" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center pt-4 border-t-2 border-dashed border-[#2d2d2d]/30">
            <p className="text-base font-semibold text-[#2d2d2d]/80">
              Already have an account?{' '}
              <Link href="/login" className="text-[#2d5da1] hover:underline font-bold">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
