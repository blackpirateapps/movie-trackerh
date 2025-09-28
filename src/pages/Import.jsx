import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';

const Import = () => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please select a valid CSV file.');
      setFile(null);
    }
  };

  const handleImport = async () => {
    if (!file || !user) return;

    setImporting(true);
    setError('');

    try {
      const csvData = await file.text();
      
      const response = await api.post('/api/import', {
        csvData,
        importType: 'diary'
      });

      setResults(response.data);
    } catch (err) {
      console.error('Import failed:', err);
      setError(err.response?.data?.message || 'Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
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

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 flex items-center gap-3">
            📥 Import from Letterboxd
          </h1>
          <p className="text-slate-400">
            Import your movie ratings, reviews, and watch history from Letterboxd
          </p>
        </div>

        {!results ? (
          <div className="card max-w-2xl">
            <h2 className="text-xl font-semibold mb-6">How to export from Letterboxd:</h2>
            
            <ol className="list-decimal list-inside space-y-3 text-slate-300 mb-8">
              <li>Go to <a href="https://letterboxd.com/settings/data/" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300">Letterboxd Settings → Data</a></li>
              <li>Click "Export your data"</li>
              <li>Download the ZIP file and extract it</li>
              <li>Upload the <strong>diary.csv</strong> file below</li>
            </ol>

            <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
              />
              <label 
                htmlFor="csv-upload" 
                className="cursor-pointer flex flex-col items-center gap-4"
              >
                <div className="text-4xl">📁</div>
                <div>
                  <p className="text-lg font-medium">Choose your Letterboxd CSV file</p>
                  <p className="text-sm text-slate-400">diary.csv, ratings.csv, or watchlist.csv</p>
                </div>
                {file && (
                  <div className="mt-4 p-3 bg-slate-800 rounded-lg">
                    <p className="text-sm">Selected: <span className="font-medium">{file.name}</span></p>
                    <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                )}
              </label>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            <div className="mt-6 flex gap-4">
              <button
                onClick={handleImport}
                disabled={!file || importing}
                className="btn btn-primary flex-1"
              >
                {importing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Importing Movies...
                  </>
                ) : (
                  <>
                    <span className="text-lg mr-2">🚀</span>
                    Import Movies
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 p-4 bg-slate-800/50 rounded-lg">
              <h3 className="font-semibold mb-2">⚠️ Important Notes:</h3>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• Large imports may take several minutes</li>
                <li>• Movies are matched using TMDB database</li>
                <li>• Existing ratings won't be overwritten</li>
                <li>• You can import multiple CSV files</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Import Results */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                ✅ Import Complete!
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{results.imported}</div>
                  <div className="text-sm text-green-300">Movies Imported</div>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-400">{results.errors}</div>
                  <div className="text-sm text-red-300">Errors</div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{results.total}</div>
                  <div className="text-sm text-blue-300">Total Processed</div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setResults(null)}
                  className="btn btn-secondary"
                >
                  Import Another File
                </button>
                <a href={`/profile/${user.username}`} className="btn btn-primary">
                  View My Profile
                </a>
              </div>
            </div>

            {/* Sample Results */}
            {results.results && results.results.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Sample Imported Movies:</h3>
                <div className="space-y-3">
                  {results.results.map((movie, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                      <div>
                        <h4 className="font-medium">{movie.title}</h4>
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          {movie.year && <span>📅 {movie.year}</span>}
                          {movie.rating && <span>⭐ {movie.rating}/5</span>}
                          {movie.watchedDate && <span>👁️ {movie.watchedDate}</span>}
                        </div>
                      </div>
                      <span className="text-green-400 text-sm">✓ Imported</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {results.errors && results.errors.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-4 text-red-400">Import Errors:</h3>
                <div className="space-y-2">
                  {results.errors.map((error, index) => (
                    <div key={index} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="text-sm">
                        <strong>Row {error.row}:</strong> {error.title || 'Unknown movie'}
                      </div>
                      <div className="text-xs text-red-300">{error.error}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Import;