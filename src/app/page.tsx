'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import MovieCard from '@/components/MovieCard';
import TVShowCard from '@/components/TVShowCard';
import { Movie, TVShow } from '@/types';
import { Search, Flame, ArrowRight, Film, Tv } from 'lucide-react';

export default function Home() {
  const [searchType, setSearchType] = useState<'movie' | 'tv'>('movie');
  const [query, setQuery] = useState<string>('');
  const [movieResults, setMovieResults] = useState<Movie[]>([]);
  const [tvResults, setTvResults] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [trendingTv, setTrendingTv] = useState<TVShow[]>([]);
  const [trendingTab, setTrendingTab] = useState<'movie' | 'tv'>('movie');

  useEffect(() => {
    const loadTrending = async () => {
      try {
        const [movieRes, tvRes] = await Promise.all([
          api.get<Movie[]>('/api/movies?query=popular'),
          api.get<TVShow[]>('/api/tv?query=popular')
        ]);
        if (Array.isArray(movieRes.data)) {
          setTrendingMovies(movieRes.data.slice(0, 12));
        }
        if (Array.isArray(tvRes.data)) {
          setTrendingTv(tvRes.data.slice(0, 12));
        }
      } catch (error) {
        console.error('Failed to load trending items', error);
      }
    };
    loadTrending();
  }, []);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      if (searchType === 'movie') {
        const { data } = await api.get<Movie[]>(`/api/movies?query=${encodeURIComponent(query)}`);
        setMovieResults(Array.isArray(data) ? data : []);
        setTvResults([]);
      } else {
        const { data } = await api.get<TVShow[]>(`/api/tv?query=${encodeURIComponent(query)}`);
        setTvResults(Array.isArray(data) ? data : []);
        setMovieResults([]);
      }
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-16 bg-[#121212] text-[#EDEDED]">
      {/* Hero Section */}
      <section className="relative py-12 md:py-16 px-4 border-b border-[#333333] bg-[#1E1E1E]/50">
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          
          {/* Metadata Tagline */}
          <span className="text-xs uppercase font-bold text-[#00FF66] tracking-widest block">
            DATA-DENSE MEDIA TRACKING SYSTEM
          </span>

          <h1 className="text-3xl md:text-5xl font-bold text-[#EDEDED] tracking-tight leading-tight">
            Track Movies & <span className="text-[#00FF66]">TV Shows</span>
          </h1>

          <p className="text-sm md:text-base text-[#A0A0A0] max-w-xl mx-auto leading-relaxed">
            Minimalist media tracker. Rate films, log seasons, track individual episodes, and analyze watch history.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto pt-2">
            <div className="card-surface p-4 border border-[#333333]">
              {/* Type Switcher */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setSearchType('movie')}
                  className={`btn text-xs py-1 px-3 ${
                    searchType === 'movie' ? 'btn-primary' : 'btn-ghost'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Movies</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSearchType('tv')}
                  className={`btn text-xs py-1 px-3 ${
                    searchType === 'tv' ? 'btn-primary' : 'btn-ghost'
                  }`}
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>TV Shows</span>
                </button>
              </div>

              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchType === 'movie' ? "Search movies..." : "Search TV shows..."}
                    className="form-input text-sm py-2.5 pr-4 pl-10"
                  />
                  <Search className="w-4 h-4 text-[#A0A0A0] absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn btn-primary px-5 py-2.5 text-xs flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#121212] border-t-transparent" />
                  ) : (
                    <>
                      <span>SEARCH</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>
      </section>

      {/* Search Results Grid */}
      {(movieResults.length > 0 || tvResults.length > 0) && (
        <section className="py-8 px-4 max-w-6xl mx-auto">
          <h2 className="text-lg font-bold mb-4 text-[#EDEDED] flex items-center gap-2">
            <Search className="w-4 h-4 text-[#00FF66]" />
            Search Results ({movieResults.length || tvResults.length})
          </h2>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
            {movieResults.map(movie => (
              <Link key={movie.id} href={`/movie/${movie.id}`}>
                <MovieCard movie={movie} />
              </Link>
            ))}
            {tvResults.map(show => (
              <Link key={show.id} href={`/tv/${show.id}`}>
                <TVShowCard show={show} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trending Media Grid */}
      <section className="py-8 px-4 max-w-6xl mx-auto">
        <div className="flex flex-row items-center justify-between gap-4 mb-4 pb-2 border-b border-[#333333]">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#00FF66]" />
            <h2 className="text-base font-bold text-[#EDEDED] uppercase tracking-wider text-xs">
              Trending Releases
            </h2>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setTrendingTab('movie')}
              className={`btn text-xs py-1 px-2.5 ${
                trendingTab === 'movie' ? 'btn-primary' : 'btn-ghost'
              }`}
            >
              Movies
            </button>
            <button
              onClick={() => setTrendingTab('tv')}
              className={`btn text-xs py-1 px-2.5 ${
                trendingTab === 'tv' ? 'btn-primary' : 'btn-ghost'
              }`}
            >
              TV Shows
            </button>
          </div>
        </div>

        {trendingTab === 'movie' ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
            {trendingMovies.map(movie => (
              <Link key={movie.id} href={`/movie/${movie.id}`}>
                <MovieCard movie={movie} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
            {trendingTv.map(show => (
              <Link key={show.id} href={`/tv/${show.id}`}>
                <TVShowCard show={show} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
