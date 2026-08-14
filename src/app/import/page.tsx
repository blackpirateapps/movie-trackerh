'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Movie } from '@/types';
import { FileUp, Eye, Bookmark, CheckCircle2, SkipForward, RefreshCw, AlertCircle, Zap, Layers } from 'lucide-react';

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

  // Chunked Batch Import State (Avoids Vercel Serverless Function Timeouts)
  const [bulkImporting, setBulkImporting] = useState<boolean>(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

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

  const bulkImportInBatches = async () => {
    if (!movies.length || bulkImporting) return;
    setBulkImporting(true);
    setError('');

    const chunkSize = 25; // Safe batch size per serverless request
    const totalCount = movies.length;
    setBulkProgress({ current: 0, total: totalCount });

    try {
      for (let i = 0; i < totalCount; i += chunkSize) {
        const chunk = movies.slice(i, i + chunkSize);
        const batchItems = chunk.map(m => ({
          movieId: null,
          originalData: m
        }));

        const res = await api.post('/api/import', {
          action: 'batch_import',
          items: batchItems,
          importType
        });

        if (Array.isArray(res.data?.imported)) {
          setImportedMovies(prev => [...prev, ...res.data.imported]);
        }

        const processed = Math.min(i + chunkSize, totalCount);
        setBulkProgress({ current: processed, total: totalCount });
      }

      setCurrentIndex(totalCount);
      setCurrentMovie(null);
      setSearchResults([]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed during batch chunk import.');
    } finally {
      setBulkImporting(false);
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
    setBulkImporting(false);
    setBulkProgress({ current: 0, total: 0 });
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

  const isCompleted = movies.length > 0 && !currentMovie && !bulkImporting;
  const progress = movies.length > 0 ? Math.round(((bulkImporting ? bulkProgress.current : currentIndex) / movies.length) * 100) : 0;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6 bg-[#121212] text-[#EDEDED]">
      {/* Header */}
      <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-[#EDEDED]">
          <FileUp className="w-5 h-5 text-[#00FF66]" />
          Letterboxd CSV Importer
        </h1>
        <p className="text-xs text-[#A0A0A0]">
          Import watched movies or watchlists from Letterboxd using high-performance chunked batch execution.
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
                <span className="btn btn-secondary text-xs py-1.5 px-4 inline-block">Choose File</span>
              </label>
            </div>
          </div>

          {csvData && (
            <div className="pt-4 border-t border-[#333333] flex flex-col items-center space-y-3">
              <span className="text-xs font-semibold text-[#00FF66]">
                ✓ CSV file loaded successfully. Ready to process.
              </span>
              <button
                onClick={startImport}
                disabled={loading}
                className="btn btn-primary text-xs py-2 px-6 flex items-center gap-2"
              >
                {loading ? 'Parsing File...' : 'Start Import Wizard'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Import Progress Bar & Batch Control Header */}
      {movies.length > 0 && (
        <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#EDEDED]">
                Import Progress: {bulkImporting ? bulkProgress.current : currentIndex} / {movies.length} Movies
              </h2>
              <p className="text-xs text-[#A0A0A0]">
                {importType === 'watchlist' ? 'Watchlist Import' : 'Watched Movies Import'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!isCompleted && !bulkImporting && (
                <button
                  onClick={bulkImportInBatches}
                  className="btn bg-[#00FF66] text-[#121212] font-bold text-xs py-1.5 px-3 flex items-center gap-1.5 hover:bg-[#00CC52]"
                  title="Chunk into arrays of 25 movies and process sequentially without timeout"
                >
                  <Zap className="w-3.5 h-3.5 fill-[#121212]" />
                  <span>Auto-Import All in Chunks</span>
                </button>
              )}
              <button
                onClick={resetImport}
                className="btn btn-ghost text-xs py-1.5 px-3 flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>
          </div>

          <div className="w-full bg-[#121212] border border-[#333333] rounded-full h-2.5 overflow-hidden">
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

      {/* Bulk Batch Progress Loading Overlay */}
      {bulkImporting && (
        <div className="card bg-[#1E1E1E] border border-[#00FF66] p-8 text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-[#00FF66] border-t-transparent mx-auto" />
          <h3 className="font-bold text-sm text-[#EDEDED]">Processing Chunked Batch Import...</h3>
          <p className="text-xs text-[#A0A0A0]">
            Processing items in batches of 25 to respect TMDB rate limits and Vercel serverless execution constraints. ({bulkProgress.current} / {bulkProgress.total})
          </p>
        </div>
      )}

      {/* Current Movie Matching */}
      {currentMovie && searchResults.length > 0 && !bulkImporting && (
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

          <div className="flex justify-end pt-2">
            <button
              onClick={skipMovie}
              className="btn btn-ghost text-xs py-1.5 px-4 flex items-center gap-1.5"
            >
              <SkipForward className="w-4 h-4" />
              Skip Movie
            </button>
          </div>
        </div>
      )}

      {/* Completion View */}
      {isCompleted && (
        <div className="card bg-[#1E1E1E] border border-[#333333] p-8 text-center space-y-4">
          <div className="w-12 h-12 bg-[#00FF66] text-[#121212] rounded-full flex items-center justify-center mx-auto font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#EDEDED]">Import Complete!</h2>
          <p className="text-xs text-[#A0A0A0]">
            Successfully imported {importedMovies.length} movies into your CineTracker profile.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link href={`/profile/${user.username}`} className="btn btn-primary text-xs py-2 px-5">
              View Profile
            </Link>
            <button onClick={resetImport} className="btn btn-secondary text-xs py-2 px-5">
              Import Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
