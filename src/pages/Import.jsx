import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';

const Import = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState({ watched: null, watchlist: null });
  const [importing, setImporting] = useState({ watched: false, watchlist: false });
  const [results, setResults] = useState({ watched: null, watchlist: null });
  const [error, setError] = useState('');

  const handleFileSelect = (type, e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFiles(prev => ({ ...prev, [type]: selectedFile }));
      setError('');
    } else {
      setError(`Please select a valid CSV file for ${type}.`);
      setFiles(prev => ({ ...prev, [type]: null }));
    }
  };

  const handleImport = async (type) => {
    const file = files[type];
    if (!file || !user) return;

    setImporting(prev => ({ ...prev, [type]: true }));
    setError('');

    try {
      const csvData = await file.text();
      
      const response = await api.post('/api/import', {
        csvData,
        importType: type
      });

      setResults(prev => ({ ...prev, [type]: response.data }));
    } catch (err) {
      console.error('Import failed:', err);
      setError(err.response?.data?.message || `${type} import failed. Please try again.`);
    } finally {
      setImporting(prev => ({ ...prev, [type]: false }));
    }
  };

  const resetImport = (type) => {
    setFiles(prev => ({ ...prev, [type]: null }));
    setResults(prev => ({ ...prev, [type]: null }));
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

  const ImportSection = ({ type, title, icon, description }) => {
    const file = files[type];
    const isImporting = importing[type];
    const result = results[type];

    return (
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{icon}</span>
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        
        <p className="text-slate-400 mb-6">{description}</p>

        {!result ? (
          <>
            <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center mb-4">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileSelect(type, e)}
                className="hidden"
                id={`${type}-upload`}
              />
              <label 
                htmlFor={`${type}-upload`} 
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <div className="text-3xl">📁</div>
                <div>
                  <p className="font-medium">Choose {type}.csv file</p>
                  <p className="text-sm text-slate-400">From your Letterboxd export</p>
                </div>
                {file && (
                  <div className="mt-3 p-3 bg-slate-800 rounded-lg">
                    <p className="text-sm">Selected: <span className="font-medium">{file.name}</span></p>
                    <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                )}
              </label>
            </div>

            <button
              onClick={() => handleImport(type)}
              disabled={!file || isImporting}
              className="btn btn-primary w-full"
            >
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Importing {title}...
                </>
              ) : (
                <>
                  <span className="text-lg mr-2">🚀</span>
                  Import {title}
                </>
              )}
            </button>
          </>
        ) : (
          <div className="space-y-4">
            {/* Import Results */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <h3 className="font-semibold text-green-400 mb-2">✅ Import Complete!</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-green-400">{result.imported}</div>
                  <div className="text-xs text-green-300">Imported</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-400">{result.errors}</div>
                  <div className="text-xs text-red-300">Errors</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-400">{result.total}</div>
                  <div className="text-xs text-blue-300">Total</div>
                </div>
              </div>
            </div>

            {/* Sample Results */}
            {result.results && result.results.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Sample Results:</h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {result.results.slice(0, 5).map((movie, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-slate-800/30 rounded text-sm">
                      <div>
                        <span className="font-medium">{movie.title}</span>
                        {movie.year && <span className="text-slate-400 ml-2">({movie.year})</span>}
                      </div>
                      <span className="text-green-400 text-xs">✓</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => resetImport(type)}
              className="btn btn-secondary"
            >
              Import Another {title} File
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 flex items-center gap-3">
            📥 Import from Letterboxd
          </h1>
          <p className="text-slate-400">
            Import your watched movies and watchlist from your Letterboxd export
          </p>
        </div>

        <div className="mb-8 card">
          <h2 className="text-xl font-semibold mb-4">How to export from Letterboxd:</h2>
          <ol className="list-decimal list-inside space-y-2 text-slate-300">
            <li>Go to <a href="https://letterboxd.com/settings/data/" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300">Letterboxd Settings → Data</a></li>
            <li>Click "Export your data"</li>
            <li>Download the ZIP file and extract it</li>
            <li>Upload the <strong>watched.csv</strong> and/or <strong>watchlist.csv</strong> files below</li>
          </ol>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ImportSection
            type="watched"
            title="Watched Movies"
            icon="👁️"
            description="Import movies you've already watched with their watch dates"
          />

          <ImportSection
            type="watchlist"
            title="Watchlist"
            icon="🔖"
            description="Import movies from your watchlist that you want to watch"
          />
        </div>

        {(results.watched || results.watchlist) && (
          <div className="mt-8 text-center">
            <a href={`/profile/${user.username}`} className="btn btn-primary">
              <span className="text-lg mr-2">👤</span>
              View My Profile
            </a>
          </div>
        )}

        <div className="mt-8 card">
          <h3 className="font-semibold mb-3">⚠️ Important Notes:</h3>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>• <strong>Watched movies</strong> will be added to your collection with watch dates</li>
            <li>• <strong>Watchlist movies</strong> will be added to your watchlist for future viewing</li>
            <li>• Movies are matched using TMDB database for accurate information</li>
            <li>• Large imports may take several minutes to process</li>
            <li>• You can import both files or just one - whatever you prefer</li>
            <li>• Duplicate movies won't be imported twice</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Import;