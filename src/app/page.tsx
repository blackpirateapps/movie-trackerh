'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import MovieCard from '@/components/MovieCard';
import { Movie } from '@/types';
import { Search, Flame, Sparkles, ArrowRight } from 'lucide-react';

export default function Home() {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [trending, setTrending] = useState<Movie[]>([]);

  useEffect(() => {
    const loadTrending = async () => {
      try {
        const { data } = await api.get<Movie[]>('/api/movies?query=popular');
        if (Array.isArray(data)) {
          setTrending(data.slice(0, 8));
        }
      } catch (error) {
        console.error('Failed to load trending movies', error);
      }
    };
    loadTrending();
  }, []);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const { data } = await api.get<Movie[]>(`/api/movies?query=${encodeURIComponent(query)}`);
      setResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 px-4 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 bg-[#fff9c4] border-2 border-[#2d2d2d] rounded-[255px_15px_225px_15px/15px_225px_15px_255px] px-4 py-1 mb-6 shadow-[3px_3px_0px_#2d2d2d] -rotate-1">
            <Sparkles className="w-4 h-4 text-[#ff4d4d] stroke-[2.5]" />
            <span className="font-bold text-sm text-[#2d2d2d] tracking-wide">
              Your Personal Hand-Drawn Cinema Journal
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-heading font-bold mb-6 text-[#2d2d2d] leading-tight">
            Track & Review Your Favorite{' '}
            <span className="relative inline-block text-[#ff4d4d] underline decoration-wavy decoration-[#2d5da1] decoration-3">
              Movies
            </span>
            <span className="inline-block animate-bounce ml-2">!</span>
          </h1>

          <p className="text-xl md:text-2xl text-[#2d2d2d]/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            Discover films, write honest reviews, import your Letterboxd CSVs, and see what your movie-loving friends are watching.
          </p>
          
          {/* Post-it Search Form */}
          <div className="relative max-w-2xl mx-auto">
            <div className="thumbtack" />

            <div className="card-postit">
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for movies, directors, actors..."
                    className="form-input text-lg py-3.5 pr-4 pl-12"
                  />
                  <Search className="w-5 h-5 stroke-[2.5] text-[#2d2d2d]/50 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn btn-primary px-8 py-3.5 text-lg flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-3 border-white" />
                  ) : (
                    <>
                      <span>Search</span>
                      <ArrowRight className="w-5 h-5 stroke-[3]" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Hand-drawn SVG Arrow pointing to search (Desktop Only) */}
            <div className="hidden md:block absolute -right-24 top-12 pointer-events-none">
              <svg width="100" height="70" viewBox="0 0 100 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 10 Q 50 60 90 20" stroke="#ff4d4d" strokeWidth="3" strokeDasharray="4 4" fill="none" />
                <path d="M80 15 L 90 20 L 85 30" stroke="#ff4d4d" strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>
              <span className="font-heading text-sm font-bold text-[#ff4d4d] -rotate-6 block mt-1">
                Type any movie!
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* Search Results */}
      {results.length > 0 && (
        <section className="py-12 px-4 max-w-7xl mx-auto">
          <div className="relative card mb-10">
            <div className="tape-strip" />
            <h2 className="text-3xl md:text-4xl font-heading font-bold flex items-center gap-3">
              <Search className="w-8 h-8 stroke-[3] text-[#2d5da1]" />
              Search Results ({results.length})
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {results.map(movie => (
              <Link key={movie.id} href={`/movie/${movie.id}`}>
                <MovieCard movie={movie} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trending Movies */}
      {trending.length > 0 && (
        <section className="py-12 px-4 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#ff4d4d] text-white border-3 border-[#2d2d2d] rounded-full flex items-center justify-center shadow-[3px_3px_0px_#2d2d2d] -rotate-6">
                <Flame className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-[#2d2d2d]">
                Trending Movies
              </h2>
            </div>
            
            <span className="bg-[#fff9c4] border-2 border-[#2d2d2d] rounded-[255px_15px_225px_15px/15px_225px_15px_255px] px-3 py-1 font-bold text-sm shadow-[2px_2px_0px_#2d2d2d] rotate-1">
              ✏️ Freshly Updated
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {trending.map(movie => (
              <Link key={movie.id} href={`/movie/${movie.id}`}>
                <MovieCard movie={movie} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
