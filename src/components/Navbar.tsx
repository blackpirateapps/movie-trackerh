'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { Film, Home, Users, Rss, FileUp, LogOut, LogIn, UserPlus, Menu, X, Settings } from 'lucide-react';

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
    <nav className="sticky top-0 z-50 bg-[#121212]/90 backdrop-blur-md border-b border-[#333333] h-16 flex items-center">
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 bg-[#00FF66] text-[#121212] rounded flex items-center justify-center font-bold">
              <Film className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="font-bold text-xl text-[#EDEDED] tracking-tight">
              Cine<span className="text-[#00FF66]">Tracker</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6 font-medium text-sm">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-[#A0A0A0] hover:text-[#EDEDED] transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>

            <Link 
              href="/users" 
              className="flex items-center gap-2 text-[#A0A0A0] hover:text-[#EDEDED] transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Community</span>
            </Link>

            {user && (
              <Link 
                href="/feed" 
                className="flex items-center gap-2 text-[#A0A0A0] hover:text-[#EDEDED] transition-colors"
              >
                <Rss className="w-4 h-4" />
                <span>Activity Feed</span>
              </Link>
            )}

            {user && (
              <Link 
                href="/import" 
                className="flex items-center gap-2 text-[#A0A0A0] hover:text-[#EDEDED] transition-colors"
              >
                <FileUp className="w-4 h-4" />
                <span>Import CSV</span>
              </Link>
            )}

            {user && (
              <Link 
                href="/settings" 
                className="flex items-center gap-2 text-[#A0A0A0] hover:text-[#EDEDED] transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Settings API</span>
              </Link>
            )}
          </div>

          {/* Desktop User Menu / Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link 
                  href={`/profile/${user.username}`}
                  className="flex items-center gap-2 px-3 py-1 bg-[#1E1E1E] border border-[#333333] rounded hover:bg-[#2A2A2A] transition-colors text-sm font-medium"
                >
                  <div className="w-5 h-5 bg-[#00FF66] text-[#121212] rounded-full flex items-center justify-center text-xs font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[#EDEDED]">{user.username}</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="btn btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="btn btn-secondary text-xs py-1.5 px-3">
                  <LogIn className="w-3.5 h-3.5" />
                  Login
                </Link>
                <Link href="/signup" className="btn btn-primary text-xs py-1.5 px-3">
                  <UserPlus className="w-3.5 h-3.5" />
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 border border-[#333333] rounded bg-[#1E1E1E] text-[#EDEDED]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#333333] space-y-3 bg-[#121212] animate-in fade-in duration-150">
            <Link 
              href="/" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 font-medium text-sm text-[#A0A0A0] hover:text-[#EDEDED] hover:bg-[#1E1E1E] rounded"
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
            <Link 
              href="/users" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 font-medium text-sm text-[#A0A0A0] hover:text-[#EDEDED] hover:bg-[#1E1E1E] rounded"
            >
              <Users className="w-4 h-4" />
              Community
            </Link>
            {user && (
              <Link 
                href="/feed" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 font-medium text-sm text-[#A0A0A0] hover:text-[#EDEDED] hover:bg-[#1E1E1E] rounded"
              >
                <Rss className="w-4 h-4" />
                Activity Feed
              </Link>
            )}
            {user && (
              <Link 
                href="/import" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 font-medium text-sm text-[#A0A0A0] hover:text-[#EDEDED] hover:bg-[#1E1E1E] rounded"
              >
                <FileUp className="w-4 h-4" />
                Import CSV
              </Link>
            )}
            {user && (
              <Link 
                href="/settings" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 font-medium text-sm text-[#A0A0A0] hover:text-[#EDEDED] hover:bg-[#1E1E1E] rounded"
              >
                <Settings className="w-4 h-4" />
                Settings & API
              </Link>
            )}
            
            <div className="pt-3 border-t border-[#333333] px-3">
              {user ? (
                <div className="space-y-3">
                  <Link 
                    href={`/profile/${user.username}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 py-2 font-medium text-sm text-[#EDEDED]"
                  >
                    <div className="w-6 h-6 bg-[#00FF66] text-[#121212] rounded-full flex items-center justify-center text-xs font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    {user.username} (View Profile)
                  </Link>
                  <button 
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="btn btn-secondary w-full text-xs py-2 flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link 
                    href="/login" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn btn-secondary w-full text-xs py-2"
                  >
                    Login
                  </Link>
                  <Link 
                    href="/signup" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn btn-primary w-full text-xs py-2"
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
