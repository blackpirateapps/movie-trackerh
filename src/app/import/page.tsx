'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Movie } from '@/types';
import { FileUp, Eye, Bookmark, CheckCircle2, SkipForward, RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card-postit text-center max-w-md w-full">
          <h2 className="text-3xl font-heading font-bold mb-4">Please log in to import data</h2>
          <Link href="/login" className="btn btn-primary text-lg">Login Now</Link>
        </div>
      </div>
    );
  }

  const isCompleted = movies.length > 0 && !currentMovie;
  const progress = movies.length > 0 ? Math.round((currentIndex / movies.length) * 100) : 0;

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Page Header */}
        <div className="card mb-8">
          <div className="tape-strip" />
          <h1 className="text-3xl md:text-4xl font-heading font-bold flex items-center gap-3">
            <FileUp className="w-8 h-8 stroke-[3] text-[#2d5da1]" />
            Letterboxd CSV Importer
          </h1>
          <p className="text-lg text-[#2d2d2d]/80 mt-1">
            Import your watched movies or watchlists from Letterboxd with interactive TMDB search matching.
          </p>
        </div>

        {error && (
          <div className="card-postit bg-[#ff4d4d]/10 mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-[#ff4d4d] font-bold">
              <AlertCircle className="w-6 h-6 stroke-[3]" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="btn btn-ghost text-xs">
              Dismiss
            </button>
          </div>
        )}

        {/* Step 1: Choose CSV File */}
        {!movies.length && (
          <div className="card mb-8">
            <div className="thumbtack" />
            <h2 className="text-2xl font-heading font-bold mb-6 text-center">
              Step 1: Select Your Letterboxd Export CSV
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Watched Movies Option */}
              <div className="bg-[#fff9c4] border-3 border-dashed border-[#2d2d2d] rounded-[255px_15px_225px_15px/15px_225px_15px_255px] p-6 text-center shadow-[4px_4px_0px_#2d2d2d] hover:-translate-y-1 transition-all">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileSelect('watched', e)}
                  className="hidden"
                  id="watched-upload"
                />
                <label htmlFor="watched-upload" className="cursor-pointer block">
                  <div className="w-14 h-14 bg-[#2d5da1] text-white border-2 border-[#2d2d2d] rounded-full flex items-center justify-center mx-auto mb-3 shadow-[2px_2px_0px_#2d2d2d]">
                    <Eye className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <h3 className="text-2xl font-heading font-bold mb-1">Watched Movies</h3>
                  <p className="text-base text-[#2d2d2d]/80 mb-4">Upload watched.csv</p>
                  <span className="btn btn-secondary text-sm">Choose File</span>
                </label>
              </div>

              {/* Watchlist Option */}
              <div className="bg-[#fdfbf7] border-3 border-dashed border-[#2d2d2d] rounded-[15px_225px_15px_255px/255px_15px_225px_15px] p-6 text-center shadow-[4px_4px_0px_#2d2d2d] hover:-translate-y-1 transition-all">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileSelect('watchlist', e)}
                  className="hidden"
                  id="watchlist-upload"
                />
                <label htmlFor="watchlist-upload" className="cursor-pointer block">
                  <div className="w-14 h-14 bg-[#ff4d4d] text-white border-2 border-[#2d2d2d] rounded-full flex items-center justify-center mx-auto mb-3 shadow-[2px_2px_0px_#2d2d2d]">
                    <Bookmark className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <h3 className="text-2xl font-heading font-bold mb-1">Watchlist</h3>
                  <p className="text-base text-[#2d2d2d]/80 mb-4">Upload watchlist.csv</p>
                  <span className="btn btn-primary text-sm">Choose File</span>
                </label>
              </div>
            </div>

            {csvData && (
              <div className="mt-8 text-center">
                <button
                  onClick={startImport}
                  disabled={loading}
                  className="btn btn-primary w-full py-4 text-xl flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-3 border-white" />
                      Parsing CSV Data...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-6 h-6 stroke-[3]" />
                      Start Interactive {importType} Import
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Progress Tracker */}
        {movies.length > 0 && (
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-3 font-bold text-lg">
              <span>Import Progress</span>
              <span className="bg-[#fff9c4] border border-[#2d2d2d] px-3 py-0.5 rounded-full text-sm">
                {currentIndex} of {movies.length} ({progress}%)
              </span>
            </div>

            {/* Hand-drawn style progress bar */}
            <div className="w-full bg-[#e5e0d8] border-2 border-[#2d2d2d] rounded-full h-4 overflow-hidden p-0.5 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]">
              <div 
                className="bg-[#ff4d4d] h-full rounded-full transition-all duration-300 border-r-2 border-[#2d2d2d]"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex justify-between text-base font-bold mt-3 text-[#2d2d2d]/80">
              <span className="text-[#2d5da1]">✅ {importedMovies.length} Imported</span>
              <span className="text-[#ff4d4d]">⏭️ {skippedMovies.length} Skipped</span>
            </div>
          </div>
        )}

        {/* Current Movie Matching */}
        {currentMovie && searchResults.length > 0 && (
          <div className="card mb-8">
            <div className="tape-strip" />
            <div className="mb-6">
              <span className="text-sm font-bold text-[#ff4d4d] uppercase tracking-wider block mb-1">
                Now Matching:
              </span>
              <h3 className="text-3xl font-heading font-bold text-[#2d2d2d]">
                &ldquo;{currentMovie.originalName}&rdquo;
              </h3>
              {currentMovie.year && (
                <p className="text-lg text-[#2d2d2d]/70 font-semibold">Year: {currentMovie.year}</p>
              )}
            </div>

            <h4 className="font-heading font-bold text-xl mb-4 text-[#2d5da1]">
              Select the matching movie below:
            </h4>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {searchResults.map((movie) => (
                <div 
                  key={movie.id} 
                  className="flex items-center gap-4 p-3 bg-[#fdfbf7] border-2 border-[#2d2d2d] rounded-[255px_15px_225px_15px/15px_225px_15px_255px] shadow-[3px_3px_0px_#2d2d2d] hover:bg-[#fff9c4] transition-all cursor-pointer group"
                  onClick={() => selectMovie(movie)}
                >
                  <img
                    src={movie.poster_path 
                      ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` 
                      : 'https://via.placeholder.com/92x138?text=No+Cover'
                    }
                    alt={movie.title}
                    className="w-14 h-20 object-cover border border-[#2d2d2d] rounded"
                  />
                  <div className="flex-1">
                    <h5 className="font-heading font-bold text-xl group-hover:text-[#ff4d4d] transition-colors">
                      {movie.title}
                    </h5>
                    <p className="text-sm font-semibold text-[#2d2d2d]/70">
                      {movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown'} 
                      {movie.vote_average ? ` • ⭐ ${movie.vote_average.toFixed(1)}` : ''}
                    </p>
                  </div>
                  <button className="btn btn-primary text-sm">
                    Select
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-4 mt-6 pt-4 border-t-2 border-dashed border-[#2d2d2d]/30">
              <button
                onClick={skipMovie}
                className="btn btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                <SkipForward className="w-4 h-4 stroke-[2.5]" />
                Skip Movie
              </button>
              <button
                onClick={() => searchForMovie(currentMovie)}
                className="btn btn-ghost flex items-center gap-2"
                disabled={loading}
              >
                <RefreshCw className="w-4 h-4 stroke-[2.5]" />
                Re-Search
              </button>
            </div>
          </div>
        )}

        {/* No Results Found */}
        {currentMovie && searchResults.length === 0 && !loading && (
          <div className="card-postit text-center mb-8">
            <h3 className="text-2xl font-heading font-bold mb-2">No Matches Found</h3>
            <p className="text-lg text-[#2d2d2d]/80 mb-6">
              Could not find &ldquo;{currentMovie.originalName}&rdquo; on TMDB.
            </p>
            <div className="flex gap-4 justify-center">
              <button onClick={skipMovie} className="btn btn-secondary">
                Skip Movie
              </button>
              <button onClick={() => searchForMovie(currentMovie)} className="btn btn-primary">
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Import Complete */}
        {isCompleted && (
          <div className="card-postit text-center py-10 px-6">
            <div className="w-20 h-20 bg-[#ff4d4d] text-white border-3 border-[#2d2d2d] rounded-full flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_#2d2d2d] rotate-3">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <h3 className="text-4xl font-heading font-bold mb-4">Import Complete!</h3>

            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto my-6">
              <div className="bg-white border-2 border-[#2d2d2d] rounded-xl p-4 shadow-[3px_3px_0px_#2d2d2d]">
                <div className="text-3xl font-heading font-bold text-[#2d5da1]">{importedMovies.length}</div>
                <div className="text-base font-bold">Imported</div>
              </div>
              <div className="bg-white border-2 border-[#2d2d2d] rounded-xl p-4 shadow-[3px_3px_0px_#2d2d2d]">
                <div className="text-3xl font-heading font-bold text-[#ff4d4d]">{skippedMovies.length}</div>
                <div className="text-base font-bold">Skipped</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/profile/${user.username}`} className="btn btn-primary text-lg">
                View My Profile
              </Link>
              <button onClick={resetImport} className="btn btn-secondary text-lg">
                Import Another CSV
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
