'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import api from '@/lib/api';
import { 
  Film, 
  Home, 
  Users, 
  Rss, 
  FileUp, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Menu, 
  X, 
  Settings, 
  BarChart3, 
  Search, 
  Sparkles, 
  Tv, 
  Star 
} from 'lucide-react';

interface UniversalSearchResult {
  id: number;
  title: string;
  media_type: 'movie' | 'tv';
  overview: string | null;
  release_date: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number | null;
  in_db: boolean;
}

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Universal Search Modal State
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [results, setResults] = useState<UniversalSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Keyboard shortcut (Escape to close search, / or Ctrl+K to open)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto focus search input when modal opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [searchOpen]);

  // Live search effect as user types
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get<UniversalSearchResult[]>(
          `/api/search?q=${encodeURIComponent(query.trim())}&type=${searchFilter}`
        );
        setResults(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Navbar universal search failed:', err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, searchFilter]);

  const handleSelectResult = (item: UniversalSearchResult) => {
    setSearchOpen(false);
    const path = item.media_type === 'movie' ? `/movie/${item.id}` : `/tv/${item.id}`;
    router.push(path);
  };

  return (
    <>
      <nav className="sticky top-0 z-40 bg-[#121212]/90 backdrop-blur-md border-b border-[#333333] h-16 flex items-center">
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Logo */}
            <Link 
              href="/" 
              className="flex items-center gap-2.5 group shrink-0"
            >
              <div className="w-8 h-8 bg-[#00FF66] text-[#121212] rounded flex items-center justify-center font-bold">
                <Film className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="font-bold text-xl text-[#EDEDED] tracking-tight">
                Cine<span className="text-[#00FF66]">Tracker</span>
              </span>
            </Link>

            {/* Universal Search Quick Trigger Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#1E1E1E] border border-[#333333] hover:border-[#00FF66] rounded-md text-xs text-[#A0A0A0] hover:text-[#EDEDED] transition-all max-w-[200px] sm:max-w-xs w-full mx-2 sm:mx-4"
              title="Universal Search (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-[#00FF66] shrink-0" />
              <span className="truncate flex-1 text-left">Universal Search...</span>
              <kbd className="hidden sm:inline-block text-[10px] font-mono bg-[#121212] border border-[#333333] px-1.5 py-0.5 rounded text-[#A0A0A0]">
                ⌘K
              </kbd>
            </button>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-5 font-medium text-sm">
              <Link 
                href="/" 
                className="flex items-center gap-1.5 text-[#A0A0A0] hover:text-[#EDEDED] transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>

              <Link 
                href="/users" 
                className="flex items-center gap-1.5 text-[#A0A0A0] hover:text-[#EDEDED] transition-colors"
              >
                <Users className="w-4 h-4" />
                <span>Community</span>
              </Link>

              {user && (
                <Link 
                  href="/feed" 
                  className="flex items-center gap-1.5 text-[#A0A0A0] hover:text-[#EDEDED] transition-colors"
                >
                  <Rss className="w-4 h-4" />
                  <span>Feed</span>
                </Link>
              )}

              {user && (
                <Link 
                  href="/stats" 
                  className="flex items-center gap-1.5 text-[#A0A0A0] hover:text-[#EDEDED] transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Analytics</span>
                </Link>
              )}

              {user && (
                <Link 
                  href="/import" 
                  className="flex items-center gap-1.5 text-[#A0A0A0] hover:text-[#EDEDED] transition-colors"
                >
                  <FileUp className="w-4 h-4" />
                  <span>Import</span>
                </Link>
              )}

              {user && (
                <Link 
                  href="/settings" 
                  className="flex items-center gap-1.5 text-[#A0A0A0] hover:text-[#EDEDED] transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>API</span>
                </Link>
              )}
            </div>

            {/* Desktop User Menu / Auth Buttons */}
            <div className="hidden md:flex items-center gap-3 shrink-0">
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
                  href="/stats" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 font-medium text-sm text-[#A0A0A0] hover:text-[#EDEDED] hover:bg-[#1E1E1E] rounded"
                >
                  <BarChart3 className="w-4 h-4" />
                  Analytics & Stats
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

      {/* UNIVERSAL SEARCH MODAL OVERLAY */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-[#121212]/95 backdrop-blur-md p-4 sm:p-6 overflow-y-auto flex flex-col items-center animate-fadeIn">
          <div className="max-w-3xl w-full space-y-4 my-4 sm:my-8">
            
            {/* Modal Search Input Box */}
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Universal Search Movies & TV Shows..."
                className="form-input text-base sm:text-lg py-3.5 pr-12 pl-12 bg-[#1E1E1E] border-2 border-[#00FF66] rounded-xl shadow-2xl"
              />
              <Search className="w-5 h-5 text-[#00FF66] absolute left-4 top-1/2 -translate-y-1/2" />
              <button
                onClick={() => setSearchOpen(false)}
                className="p-2 text-[#A0A0A0] hover:text-[#EDEDED] absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-[#121212]"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSearchFilter('all')}
                  className={`btn text-xs py-1 px-3 ${
                    searchFilter === 'all' ? 'btn-primary' : 'btn-ghost'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setSearchFilter('movie')}
                  className={`btn text-xs py-1 px-3 ${
                    searchFilter === 'movie' ? 'btn-primary' : 'btn-ghost'
                  }`}
                >
                  <Film className="w-3 h-3" />
                  Movies
                </button>
                <button
                  type="button"
                  onClick={() => setSearchFilter('tv')}
                  className={`btn text-xs py-1 px-3 ${
                    searchFilter === 'tv' ? 'btn-primary' : 'btn-ghost'
                  }`}
                >
                  <Tv className="w-3 h-3" />
                  TV Shows
                </button>
              </div>

              <span className="text-xs text-[#A0A0A0] hidden sm:inline">
                Fast Vercel Function Search (DB + TMDB)
              </span>
            </div>

            {/* Search Results List */}
            <div className="space-y-2 pt-2">
              {searching ? (
                <div className="card p-6 text-center text-xs text-[#A0A0A0] flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#00FF66] border-t-transparent" />
                  Searching database and API...
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
                  {results.map((item) => {
                    const year = item.release_date ? new Date(item.release_date).getFullYear() : null;

                    return (
                      <div
                        key={`${item.media_type}_${item.id}`}
                        onClick={() => handleSelectResult(item)}
                        className="flex gap-3 bg-[#1E1E1E] hover:bg-[#2A2A2A] p-2.5 rounded border border-[#333333] hover:border-[#00FF66] transition-all cursor-pointer group"
                      >
                        {/* Thumbnail */}
                        <div className="w-12 aspect-[2/3] bg-[#2A2A2A] rounded border border-[#333333] overflow-hidden shrink-0">
                          {item.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px] text-[#A0A0A0]">
                              No Image
                            </div>
                          )}
                        </div>

                        {/* Metadata */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-bold text-sm text-[#EDEDED] group-hover:text-[#00FF66] transition-colors truncate">
                              {item.title}
                            </h4>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {item.in_db && (
                                <span className="bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/40 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                                  IN LIBRARY
                                </span>
                              )}
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border border-[#333333] ${
                                item.media_type === 'movie' ? 'bg-[#121212] text-[#00FF66]' : 'bg-[#121212] text-purple-400'
                              }`}>
                                {item.media_type === 'movie' ? 'FILM' : 'TV'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-[#A0A0A0]">
                            {year && <span>{year}</span>}
                            {item.vote_average != null && (
                              <span className="flex items-center gap-1 text-[#00FF66]">
                                <Star className="w-3 h-3 fill-[#00FF66]" />
                                {Number(item.vote_average).toFixed(1)}
                              </span>
                            )}
                          </div>

                          {item.overview && (
                            <p className="text-xs text-[#A0A0A0] line-clamp-1">
                              {item.overview}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : query.trim() ? (
                <div className="card p-6 text-center text-xs text-[#A0A0A0]">
                  No movies or TV shows found matching "{query}".
                </div>
              ) : (
                <div className="card p-6 text-center text-xs text-[#A0A0A0]">
                  Type title of any movie or TV series to search across database and TMDB.
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
