import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';

const Import = () => {
  const { user } = useAuth();
  const [csvData, setCsvData] = useState('');
  const [importType, setImportType] = useState('');
  const [movies, setMovies] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentMovie, setCurrentMovie] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importedMovies, setImportedMovies] = useState([]);
  const [skippedMovies, setSkippedMovies] = useState([]);
  const [error, setError] = useState('');

  const handleFileSelect = (type, e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
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
      const response = await api.post('/api/import', {
        action: 'parse',
        csvData,
        importType
      });

      setMovies(response.data.movies);
      setCurrentIndex(0);
      if (response.data.movies.length > 0) {
        await searchForMovie(response.data.movies[0]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to parse CSV file.');
    } finally {
      setLoading(false);
    }
  };

  const searchForMovie = async (movie) => {
    setCurrentMovie(movie);
    setLoading(true);
    setSearchResults([]);

    try {
      const response = await api.post('/api/import', {
        action: 'search',
        movieName: movie.originalName
      });

      setSearchResults(response.data.results);
    } catch (err) {
      setError(`Failed to search for "${movie.originalName}"`);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const selectMovie = async (selectedMovie) => {
    if (!currentMovie || !selectedMovie) return;

    setLoading(true);
    try {
      const response = await api.post('/api/import', {
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
      // Import completed
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in to import data</h2>
          <a href="/login" className="btn btn-primary">Login</a>
        </div>
      </div>
    );
  }

  const isCompleted = movies.length > 0 && !currentMovie;
  const progress = movies.length > 0 ? ((currentIndex / movies.length) * 100) : 0;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 flex items-center gap-3">
            📥 Interactive Letterboxd Import
          </h1>
          <p className="text-slate-400">
            Import your movies one by one with manual selection for accuracy
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400">{error}</p>
            <button onClick={() => setError('')} className="text-red-300 hover:text-red-200 text-sm mt-2">
              Dismiss
            </button>
          </div>
        )}

        {!movies.length && (
          <div className="card mb-8">
            <h2 className="text-xl font-semibold mb-6">Step 1: Choose CSV File</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Watched Movies */}
              <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileSelect('watched', e)}
                  className="hidden"
                  id="watched-upload"
                />
                <label htmlFor="watched-upload" className="cursor-pointer">
                  <div className="text-3xl mb-3">👁️</div>
                  <h3 className="font-semibold mb-2">Watched Movies</h3>
                  <p className="text-sm text-slate-400 mb-3">Import watched.csv</p>
                  <div className="btn btn-primary">Choose File</div>
                </label>
              </div>

              {/* Watchlist */}
              <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileSelect('watchlist', e)}
                  className="hidden"
                  id="watchlist-upload"
                />
                <label htmlFor="watchlist-upload" className="cursor-pointer">
                  <div className="text-3xl mb-3">🔖</div>
                  <h3 className="font-semibold mb-2">Watchlist</h3>
                  <p className="text-sm text-slate-400 mb-3">Import watchlist.csv</p>
                  <div className="btn btn-primary">Choose File</div>
                </label>
              </div>
            </div>

            {csvData && (
              <div className="mt-6">
                <button
                  onClick={startImport}
                  disabled={loading}
                  className="btn btn-primary w-full"
                >
                  {loading ? 'Parsing CSV...' : `Start Interactive ${importType} Import`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Progress Bar */}
        {movies.length > 0 && (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Import Progress</h3>
              <span className="text-sm text-slate-400">
                {currentIndex} of {movies.length} movies
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div 
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <span>✅ {importedMovies.length} imported</span>
              <span>⏭️ {skippedMovies.length} skipped</span>
            </div>
          </div>
        )}

        {/* Current Movie Selection */}
        {currentMovie && searchResults.length > 0 && (
          <div className="card mb-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">
                Looking for: "{currentMovie.originalName}"
              </h3>
              {currentMovie.year && (
                <p className="text-slate-400">Year: {currentMovie.year}</p>
              )}
              {currentMovie.date && (
                <p className="text-slate-400">
                  {importType === 'watched' ? 'Watched on:' : 'Added on:'} {new Date(currentMovie.date).toLocaleDateString()}
                </p>
              )}
            </div>

            <h4 className="font-semibold mb-4">Choose the correct movie:</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {searchResults.map((movie) => (
                <div 
                  key={movie.id} 
                  className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer"
                  onClick={() => selectMovie(movie)}
                >
                  <img
                    src={movie.poster_path 
                      ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` 
                      : '/api/placeholder/92/138'
                    }
                    alt={movie.title}
                    className="w-12 h-18 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h5 className="font-medium">{movie.title}</h5>
                    <p className="text-sm text-slate-400">
                      {movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown'} 
                      {movie.vote_average ? ` • ⭐ ${movie.vote_average.toFixed(1)}` : ''}
                    </p>
                    {movie.overview && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {movie.overview}
                      </p>
                    )}
                  </div>
                  <button className="btn btn-primary text-sm">
                    Select
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={skipMovie}
                className="btn btn-secondary flex-1"
              >
                Skip This Movie
              </button>
              <button
                onClick={() => searchForMovie(currentMovie)}
                className="btn btn-ghost"
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Search Again'}
              </button>
            </div>
          </div>
        )}

        {/* No Results */}
        {currentMovie && searchResults.length === 0 && !loading && (
          <div className="card mb-6 text-center">
            <div className="text-4xl mb-4">😔</div>
            <h3 className="text-xl font-semibold mb-2">No movies found</h3>
            <p className="text-slate-400 mb-6">
              Couldn't find any matches for "{currentMovie.originalName}"
            </p>
            <div className="flex gap-4 justify-center">
              <button onClick={skipMovie} className="btn btn-secondary">
                Skip This Movie
              </button>
              <button onClick={() => searchForMovie(currentMovie)} className="btn btn-primary">
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Import Complete */}
        {isCompleted && (
          <div className="card text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold mb-2">Import Complete!</h3>
            <div className="grid grid-cols-2 gap-4 my-6">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400">{importedMovies.length}</div>
                <div className="text-sm text-green-300">Movies Imported</div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-400">{skippedMovies.length}</div>
                <div className="text-sm text-yellow-300">Movies Skipped</div>
              </div>
            </div>
            
            <div className="flex gap-4 justify-center">
              <a href={`/profile/${user.username}`} className="btn btn-primary">
                View My Profile
              </a>
              <button onClick={resetImport} className="btn btn-secondary">
                Import Another File
              </button>
            </div>

            {/* Recently Imported */}
            {importedMovies.length > 0 && (
              <div className="mt-8">
                <h4 className="font-semibold mb-4 text-left">Recently Imported:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {importedMovies.slice(-8).map((movie, index) => (
                    <div key={index} className="text-center">
                      <img
                        src={movie.poster_path 
                          ? `https://image.tmdb.org/t/p/w154${movie.poster_path}` 
                          : '/api/placeholder/154/231'
                        }
                        alt={movie.title}
                        className="w-full aspect-[2/3] object-cover rounded-lg mb-2"
                      />
                      <p className="text-xs font-medium line-clamp-2">{movie.title}</p>
                      <p className="text-xs text-slate-400">{movie.year}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && currentMovie && (
          <div className="card text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4" />
            <p className="text-slate-400">Searching for "{currentMovie.originalName}"...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Import;