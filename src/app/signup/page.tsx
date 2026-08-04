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
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-[#121212] text-[#EDEDED]">
      <div className="max-w-md w-full">
        <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-6 rounded">

          <div className="text-center space-y-1">
            <div className="w-10 h-10 bg-[#00FF66] text-[#121212] rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-[#EDEDED]">
              Create Account
            </h1>
            <p className="text-xs text-[#A0A0A0]">
              Start logging your movies & TV series
            </p>
          </div>

          {error && (
            <div className="p-3 bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 rounded flex items-center gap-2 text-[#ff4d4d] text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

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
              <label htmlFor="username" className="block text-xs font-bold uppercase tracking-widest text-[#A0A0A0] mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input text-xs py-2"
                placeholder="movie_fan99"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-widest text-[#A0A0A0] mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input text-xs py-2"
                placeholder="Min 6 characters"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-widest text-[#A0A0A0] mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input text-xs py-2"
                placeholder="Repeat password"
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
                  Creating Account...
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-3 border-t border-[#333333]">
            <p className="text-xs text-[#A0A0A0]">
              Already have an account?{' '}
              <Link href="/login" className="text-[#00FF66] hover:underline font-bold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
