'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { Film, Home, Users, Rss, FileUp, LogOut, LogIn, UserPlus, Menu, X } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="bg-[#fdfbf7] border-b-[3px] border-[#2d2d2d] sticky top-0 z-50 shadow-[0_4px_0_0_#2d2d2d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Hand-sketched Brand Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-3 group transition-transform hover:-rotate-1"
          >
            <div className="w-11 h-11 bg-[#fff9c4] border-3 border-[#2d2d2d] rounded-[255px_15px_225px_15px/15px_225px_15px_255px] flex items-center justify-center shadow-[3px_3px_0px_#2d2d2d] group-hover:bg-[#ff4d4d] group-hover:text-white transition-all">
              <Film className="w-6 h-6 stroke-[2.5]" />
            </div>
            <span className="font-heading font-bold text-2xl md:text-3xl text-[#2d2d2d] tracking-tight">
              Cine<span className="text-[#ff4d4d]">Tracker</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6 font-semibold text-lg">
            <Link 
              href="/" 
              className="flex items-center gap-2 px-3 py-1 text-[#2d2d2d] hover:text-[#ff4d4d] transition-colors relative group"
            >
              <Home className="w-4 h-4 stroke-[2.5]" />
              <span>Home</span>
              <span className="absolute bottom-0 left-0 w-0 h-1 bg-[#ff4d4d] transition-all group-hover:w-full rounded-full"></span>
            </Link>

            <Link 
              href="/users" 
              className="flex items-center gap-2 px-3 py-1 text-[#2d2d2d] hover:text-[#2d5da1] transition-colors relative group"
            >
              <Users className="w-4 h-4 stroke-[2.5]" />
              <span>Community</span>
              <span className="absolute bottom-0 left-0 w-0 h-1 bg-[#2d5da1] transition-all group-hover:w-full rounded-full"></span>
            </Link>

            {user && (
              <Link 
                href="/feed" 
                className="flex items-center gap-2 px-3 py-1 text-[#2d2d2d] hover:text-[#ff4d4d] transition-colors relative group"
              >
                <Rss className="w-4 h-4 stroke-[2.5]" />
                <span>Activity Feed</span>
                <span className="absolute bottom-0 left-0 w-0 h-1 bg-[#ff4d4d] transition-all group-hover:w-full rounded-full"></span>
              </Link>
            )}

            {user && (
              <Link 
                href="/import" 
                className="flex items-center gap-2 px-3 py-1 text-[#2d2d2d] hover:text-[#2d5da1] transition-colors relative group"
              >
                <FileUp className="w-4 h-4 stroke-[2.5]" />
                <span>Import CSV</span>
                <span className="absolute bottom-0 left-0 w-0 h-1 bg-[#2d5da1] transition-all group-hover:w-full rounded-full"></span>
              </Link>
            )} 
          </div>

          {/* Desktop User Menu / Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <Link 
                  href={`/profile/${user.username}`}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#e5e0d8] border-2 border-[#2d2d2d] rounded-[255px_15px_225px_15px/15px_225px_15px_255px] shadow-[2px_2px_0px_#2d2d2d] hover:bg-[#fff9c4] transition-all"
                >
                  <div className="w-7 h-7 bg-[#ff4d4d] text-white border border-[#2d2d2d] rounded-full flex items-center justify-center font-heading text-sm font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold text-[#2d2d2d] text-base">{user.username}</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="btn btn-ghost text-base flex items-center gap-1.5"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4 stroke-[2.5]" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="btn btn-secondary text-base">
                  <LogIn className="w-4 h-4 stroke-[2.5]" />
                  Login
                </Link>
                <Link href="/signup" className="btn btn-primary text-base">
                  <UserPlus className="w-4 h-4 stroke-[2.5]" />
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 border-2 border-[#2d2d2d] rounded-[15px_225px_15px_255px/255px_15px_225px_15px] bg-[#fff9c4] shadow-[2px_2px_0px_#2d2d2d]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 stroke-[3]" />
              ) : (
                <Menu className="w-6 h-6 stroke-[3]" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t-2 border-[#2d2d2d] space-y-3 bg-[#fdfbf7] animate-fade-in">
            <Link 
              href="/" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2 font-semibold text-lg hover:bg-[#e5e0d8] rounded-lg"
            >
              <Home className="w-5 h-5 stroke-[2.5]" />
              Home
            </Link>
            <Link 
              href="/users" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2 font-semibold text-lg hover:bg-[#e5e0d8] rounded-lg"
            >
              <Users className="w-5 h-5 stroke-[2.5]" />
              Community
            </Link>
            {user && (
              <Link 
                href="/feed" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2 font-semibold text-lg hover:bg-[#e5e0d8] rounded-lg"
              >
                <Rss className="w-5 h-5 stroke-[2.5]" />
                Activity Feed
              </Link>
            )}
            {user && (
              <Link 
                href="/import" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2 font-semibold text-lg hover:bg-[#e5e0d8] rounded-lg"
              >
                <FileUp className="w-5 h-5 stroke-[2.5]" />
                Import CSV
              </Link>
            )}
            
            <div className="pt-3 border-t border-[#2d2d2d]/30 px-4">
              {user ? (
                <div className="space-y-3">
                  <Link 
                    href={`/profile/${user.username}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 py-2 font-bold text-lg"
                  >
                    <div className="w-8 h-8 bg-[#ff4d4d] text-white border border-[#2d2d2d] rounded-full flex items-center justify-center font-heading text-sm font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    {user.username} (View Profile)
                  </Link>
                  <button 
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="btn btn-secondary w-full text-base flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4 stroke-[2.5]" />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link 
                    href="/login" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn btn-secondary w-full text-base"
                  >
                    Login
                  </Link>
                  <Link 
                    href="/signup" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn btn-primary w-full text-base"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
