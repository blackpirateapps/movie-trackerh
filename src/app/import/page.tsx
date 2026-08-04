'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Movie } from '@/types';
import { FileUp, Eye, Bookmark, CheckCircle2, SkipForward, RefreshCw, AlertCircle } from 'lucide-react';

interface ImportedMovieItem {
  id: number;
  title: string;
  year?: number | null;
  poster_path?: string | null;
  originalName: string;
  date?: string | null;
}

interface ParsedMovie {
  originalName: string;
  year?: string;
  date?: string | null;
  letterboxdURI?: string;
}

export default function Import() {
  const { user } = useAuth();
  const [csvData, setCsvData] = useState<string>('');
  const [importType, setImportType] = useState<string>('');
  const [movies, setMovies] = useState<ParsedMovie[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentMovie, setCurrentMovie] = useState<ParsedMovie | null>(null);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [importedMovies, setImportedMovies] = useState<ImportedMovieItem[]>([]);
  const [skippedMovies, setSkippedMovies] = useState<ParsedMovie[]>([]);
  const [error, setError] = useState<string>('');

  const handleFileSelect = (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      setImportType(type);
      file.text().then(setCsvData);
      setError('');
    } else {
      setError('Please select a valid CSV file.');
    }
  };

  const startImport = async () => {
    if (!csvData || !importType) return;
    
    setLoading(true);
    setError('');

    try {
      const response = await api.post<{ movies: ParsedMovie[] }>('/api/import', {
        action: 'parse',
        csvData,
        importType
      });

      setMovies(response.data.movies);
      setCurrentIndex(0);
      if (response.data.movies.length > 0) {
        await searchForMovie(response.data.movies[0]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to parse CSV file.');
    } finally {
      setLoading(false);
    }
  };

  const searchForMovie = async (movie: ParsedMovie) => {
    setCurrentMovie(movie);
    setLoading(true);
    setSearchResults([]);

    try {
      const response = await api.post<{ results: Movie[] }>('/api/import', {
        action: 'search',
        movieName: movie.originalName
      });

      setSearchResults(response.data.results || []);
    } catch (err) {
      setError(`Failed to search for "${movie.originalName}"`);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const selectMovie = async (selectedMovie: Movie) => {
    if (!currentMovie || !selectedMovie) return;

    setLoading(true);
    try {
      const response = await api.post<{ movie: { id: number; title: string; year?: number | null; poster_path?: string | null } }>('/api/import', {
        action: 'import',
        movieId: selectedMovie.id,
        originalData: currentMovie,
        importType
      });

      setImportedMovies(prev => [...prev, {
        ...response.data.movie,
        originalName: currentMovie.originalName,
        date: currentMovie.date
      }]);

      await moveToNext();
    } catch (err) {
      setError(`Failed to import "${currentMovie.originalName}"`);
    } finally {
      setLoading(false);
    }
  };

  const skipMovie = async () => {
    if (!currentMovie) return;

    setSkippedMovies(prev => [...prev, currentMovie]);
    await moveToNext();
  };

  const moveToNext = async () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < movies.length) {
      setCurrentIndex(nextIndex);
      await searchForMovie(movies[nextIndex]);
    } else {
      setCurrentMovie(null);
      setSearchResults([]);
    }
  };

  const resetImport = () => {
    setCsvData('');
    setImportType('');
    setMovies([]);
    setCurrentIndex(0);
    setCurrentMovie(null);
    setSearchResults([]);
    setImportedMovies([]);
    setSkippedMovies([]);
    setError('');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#121212]">
        <div className="card bg-[#1E1E1E] border border-[#333333] text-center max-w-md w-full p-6 rounded space-y-4">
          <h2 className="text-base font-bold text-[#EDEDED]">Please log in to import data</h2>
          <Link href="/login" className="btn btn-primary text-xs py-2 px-5 inline-block">Login Now</Link>
        </div>
      </div>
    );
  }

  const isCompleted = movies.length > 0 && !currentMovie;
  const progress = movies.length > 0 ? Math.round((currentIndex / movies.length) * 100) : 0;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6 bg-[#121212] text-[#EDEDED]">
      {/* Header */}
      <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-[#EDEDED]">
          <FileUp className="w-5 h-5 text-[#00FF66]" />
          Letterboxd CSV Importer
        </h1>
        <p className="text-xs text-[#A0A0A0]">
          Import watched movies or watchlists from Letterboxd with interactive TMDB search matching.
        </p>
      </div>

      {error && (
        <div className="card bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 p-4 flex items-center justify-between gap-4 text-xs font-semibold text-[#ff4d4d]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="btn btn-ghost text-[10px] py-1 px-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Step 1: Upload File */}
      {!movies.length && (
        <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#A0A0A0] text-center">
            Select Your Letterboxd Export CSV
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Watched Movies */}
            <div className="bg-[#121212] border border-[#333333] rounded p-6 text-center hover:border-[#00FF66] transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileSelect('watched', e)}
                className="hidden"
                id="watched-upload"
              />
              <label htmlFor="watched-upload" className="cursor-pointer block space-y-2">
                <div className="w-10 h-10 bg-[#00FF66] text-[#121212] rounded-full flex items-center justify-center mx-auto font-bold">
                  <Eye className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#EDEDED]">Watched Movies</h3>
                <p className="text-xs text-[#A0A0A0]">Upload watched.csv</p>
                <span className="btn btn-secondary text-xs py-1.5 px-4 inline-block">Choose File</span>
              </label>
            </div>

            {/* Watchlist */}
            <div className="bg-[#121212] border border-[#333333] rounded p-6 text-center hover:border-[#00FF66] transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileSelect('watchlist', e)}
                className="hidden"
                id="watchlist-upload"
              />
              <label htmlFor="watchlist-upload" className="cursor-pointer block space-y-2">
                <div className="w-10 h-10 bg-[#00FF66] text-[#121212] rounded-full flex items-center justify-center mx-auto font-bold">
                  <Bookmark className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#EDEDED]">Watchlist</h3>
                <p className="text-xs text-[#A0A0A0]">Upload watchlist.csv</p>
                <span className="btn btn-primary text-xs py-1.5 px-4 inline-block">Choose File</span>
              </label>
            </div>
          </div>

          {csvData && (
            <div className="text-center pt-2">
              <button
                onClick={startImport}
                disabled={loading}
                className="btn btn-primary w-full py-3 text-xs flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#121212] border-t-transparent" />
                    Parsing CSV...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Start Interactive {importType} Import
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Progress */}
      {movies.length > 0 && (
        <div className="card bg-[#1E1E1E] border border-[#333333] p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-[#EDEDED]">Import Progress</span>
            <span className="bg-[#121212] border border-[#333333] px-2.5 py-0.5 rounded text-[#00FF66]">
              {currentIndex} of {movies.length} ({progress}%)
            </span>
          </div>

          <div className="w-full bg-[#121212] border border-[#333333] rounded-full h-2 overflow-hidden">
            <div 
              className="bg-[#00FF66] h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] font-bold text-[#A0A0A0]">
            <span className="text-[#00FF66]">✓ {importedMovies.length} Imported</span>
            <span>⏭ {skippedMovies.length} Skipped</span>
          </div>
        </div>
      )}

      {/* Current Movie Matching */}
      {currentMovie && searchResults.length > 0 && (
        <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#00FF66]">
              Now Matching:
            </span>
            <h3 className="text-xl font-bold text-[#EDEDED]">
              &ldquo;{currentMovie.originalName}&rdquo;
            </h3>
            {currentMovie.year && (
              <p className="text-xs text-[#A0A0A0]">Year: {currentMovie.year}</p>
            )}
          </div>

          <h4 className="text-xs font-bold uppercase tracking-widest text-[#A0A0A0]">
            Select matching TMDB record:
          </h4>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {searchResults.map((movie) => (
              <div 
                key={movie.id} 
                className="flex items-center gap-3 p-3 bg-[#121212] border border-[#333333] rounded hover:border-[#00FF66] transition-colors cursor-pointer"
                onClick={() => selectMovie(movie)}
              >
                <img
                  src={movie.poster_path 
                    ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` 
                    : 'https://via.placeholder.com/92x138?text=No+Cover'
                  }
                  alt={movie.title}
                  className="w-10 h-14 object-cover border border-[#333333] rounded shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h5 className="font-bold text-sm text-[#EDEDED] truncate">
                    {movie.title}
                  </h5>
                  <p className="text-xs text-[#A0A0A0]">
                    {movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown'} 
                    {movie.vote_average ? ` • ⭐ ${movie.vote_average.toFixed(1)}` : ''}
                  </p>
                </div>
                <button className="btn btn-primary text-xs py-1 px-3 shrink-0">
                  Select
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2 border-t border-[#333333]">
            <button
              onClick={skipMovie}
              className="btn btn-secondary text-xs py-2 px-4 flex-1 flex items-center justify-center gap-1.5"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Skip Movie
            </button>
            <button
              onClick={() => searchForMovie(currentMovie)}
              className="btn btn-ghost text-xs py-2 px-4 flex items-center gap-1.5"
              disabled={loading}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Re-Search
            </button>
          </div>
        </div>
      )}

      {/* No Results */}
      {currentMovie && searchResults.length === 0 && !loading && (
        <div className="card bg-[#1E1E1E] border border-[#333333] text-center p-6 space-y-3">
          <h3 className="text-sm font-bold text-[#EDEDED]">No Matches Found</h3>
          <p className="text-xs text-[#A0A0A0]">
            Could not find &ldquo;{currentMovie.originalName}&rdquo; on TMDB.
          </p>
          <div className="flex gap-2 justify-center">
            <button onClick={skipMovie} className="btn btn-secondary text-xs py-1.5 px-4">
              Skip
            </button>
            <button onClick={() => searchForMovie(currentMovie)} className="btn btn-primary text-xs py-1.5 px-4">
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Complete */}
      {isCompleted && (
        <div className="card bg-[#1E1E1E] border border-[#333333] text-center p-8 space-y-4">
          <div className="w-12 h-12 bg-[#00FF66] text-[#121212] rounded-full flex items-center justify-center mx-auto font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-bold text-[#EDEDED]">Import Complete!</h3>

          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto text-center">
            <div className="bg-[#121212] border border-[#333333] rounded p-3">
              <div className="text-lg font-bold text-[#00FF66]">{importedMovies.length}</div>
              <div className="text-xs text-[#A0A0A0]">Imported</div>
            </div>
            <div className="bg-[#121212] border border-[#333333] rounded p-3">
              <div className="text-lg font-bold text-[#EDEDED]">{skippedMovies.length}</div>
              <div className="text-xs text-[#A0A0A0]">Skipped</div>
            </div>
          </div>
          
          <div className="flex gap-3 justify-center pt-2">
            <Link href={`/profile/${user.username}`} className="btn btn-primary text-xs py-2 px-5">
              View Profile
            </Link>
            <button onClick={resetImport} className="btn btn-secondary text-xs py-2 px-5">
              Import Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
