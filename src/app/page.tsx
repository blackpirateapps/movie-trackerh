'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import MovieCard from '@/components/MovieCard';
import TVShowCard from '@/components/TVShowCard';
import { Movie, TVShow } from '@/types';
import { Search, Flame, Sparkles, ArrowRight, Film, Tv } from 'lucide-react';

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
          setTrendingMovies(movieRes.data.slice(0, 8));
        }
        if (Array.isArray(tvRes.data)) {
          setTrendingTv(tvRes.data.slice(0, 8));
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
    <div className="min-h-screen pb-16">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 px-4 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 bg-[#fff9c4] border-2 border-[#2d2d2d] rounded-[255px_15px_225px_15px/15px_225px_15px_255px] px-4 py-1 mb-6 shadow-[3px_3px_0px_#2d2d2d] -rotate-1">
            <Sparkles className="w-4 h-4 text-[#ff4d4d] stroke-[2.5]" />
            <span className="font-bold text-sm text-[#2d2d2d] tracking-wide">
              Your Personal Hand-Drawn Cinema & TV Journal
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-heading font-bold mb-6 text-[#2d2d2d] leading-tight">
            Track Movies &{' '}
            <span className="relative inline-block text-[#ff4d4d] underline decoration-wavy decoration-[#2d5da1] decoration-3">
              TV Shows
            </span>
            <span className="inline-block animate-bounce ml-2">!</span>
          </h1>

          <p className="text-xl md:text-2xl text-[#2d2d2d]/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            Discover films and series, track episode progress, review seasons, and share your watch history with friends.
          </p>
          
          {/* Post-it Search Form */}
          <div className="relative max-w-2xl mx-auto">
            <div className="thumbtack" />

            <div className="card-postit">
              {/* Search Type Switcher */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setSearchType('movie')}
                  className={`btn text-sm py-1.5 px-4 flex items-center gap-2 border-2 ${
                    searchType === 'movie' 
                      ? 'bg-[#ff4d4d] text-white border-[#2d2d2d]' 
                      : 'bg-white text-[#2d2d2d] border-[#2d2d2d]'
                  }`}
                >
                  <Film className="w-4 h-4 stroke-[2.5]" />
                  <span>Movies</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSearchType('tv')}
                  className={`btn text-sm py-1.5 px-4 flex items-center gap-2 border-2 ${
                    searchType === 'tv' 
                      ? 'bg-[#2d5da1] text-white border-[#2d2d2d]' 
                      : 'bg-white text-[#2d2d2d] border-[#2d2d2d]'
                  }`}
                >
                  <Tv className="w-4 h-4 stroke-[2.5]" />
                  <span>TV Shows</span>
                </button>
              </div>

              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchType === 'movie' ? "Search movies..." : "Search TV shows, series..."}
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
          </div>

        </div>
      </section>

      {/* Search Results */}
      {(movieResults.length > 0 || tvResults.length > 0) && (
        <section className="py-12 px-4 max-w-7xl mx-auto">
          <div className="relative card mb-10">
            <div className="tape-strip" />
            <h2 className="text-3xl md:text-4xl font-heading font-bold flex items-center gap-3">
              <Search className="w-8 h-8 stroke-[3] text-[#2d5da1]" />
              Search Results ({movieResults.length || tvResults.length})
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
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

      {/* Trending Section */}
      <section className="py-12 px-4 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#ff4d4d] text-white border-3 border-[#2d2d2d] rounded-full flex items-center justify-center shadow-[3px_3px_0px_#2d2d2d] -rotate-6">
              <Flame className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-[#2d2d2d]">
              Trending Entertainment
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTrendingTab('movie')}
              className={`btn text-xs py-1.5 px-3 border-2 ${
                trendingTab === 'movie' ? 'btn-primary' : 'btn-ghost'
              }`}
            >
              Movies
            </button>
            <button
              onClick={() => setTrendingTab('tv')}
              className={`btn text-xs py-1.5 px-3 border-2 ${
                trendingTab === 'tv' ? 'btn-primary' : 'btn-ghost'
              }`}
            >
              TV Shows
            </button>
          </div>
        </div>

        {trendingTab === 'movie' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {trendingMovies.map(movie => (
              <Link key={movie.id} href={`/movie/${movie.id}`}>
                <MovieCard movie={movie} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
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
