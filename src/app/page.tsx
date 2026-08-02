'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import MovieCard from '@/components/MovieCard';
import { Movie } from '@/types';

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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
            Track Your Favorite 
            <span className="text-gradient"> Movies</span>
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto animate-fade-in">
            Discover, rate, and review movies. Share your thoughts with friends and build your personal movie collection.
          </p>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto animate-fade-in">
            <div className="flex gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for movies, actors, genres..."
                className="form-input flex-1 text-lg py-4"
              />
              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-primary px-8 py-4 text-lg"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <>🔍 Search</>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Search Results */}
      {results.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Search Results</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {results.map(movie => (
                <Link key={movie.id} href={`/movie/${movie.id}`} className="group">
                  <MovieCard movie={movie} />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending Movies */}
      {trending.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              🔥 Trending Movies
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {trending.map(movie => (
                <Link key={movie.id} href={`/movie/${movie.id}`} className="group">
                  <MovieCard movie={movie} />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
