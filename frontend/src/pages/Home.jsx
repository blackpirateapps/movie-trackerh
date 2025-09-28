import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import MovieCard from '../components/MovieCard';
import './Home.css';

const Home = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    // Load trending movies on component mount
    const loadTrending = async () => {
      try {
        const { data } = await api.get('/api/movies?query=popular');
        setTrending(data.slice(0, 8));
      } catch (error) {
        console.error('Failed to load trending movies', error);
      }
    };
    loadTrending();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const { data } = await api.get(`/api/movies?query=${encodeURIComponent(query)}`);
      setResults(data);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Track Your Favorite 
            <span className="text-gradient"> Movies</span>
          </h1>
          <p className="hero-subtitle">
            Discover, rate, and review movies. Share your thoughts with friends and build your personal movie collection.
          </p>
          
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-group">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for movies, actors, genres..."
                className="search-input form-input"
              />
              <button 
                type="submit" 
                disabled={loading}
                className="search-button btn btn-primary"
              >
                {loading ? (
                  <div className="loading-spinner" />
                ) : (
                  <>🔍 Search</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {results.length > 0 && (
        <section className="search-results">
          <div className="container">
            <h2 className="section-title">Search Results</h2>
            <div className="movies-grid grid grid-4">
              {results.map(movie => (
                <Link key={movie.id} to={`/movie/${movie.id}`} className="movie-link">
                  <MovieCard movie={movie} />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {trending.length > 0 && (
        <section className="trending-section">
          <div className="container">
            <h2 className="section-title">
              🔥 Trending Movies
            </h2>
            <div className="movies-grid grid grid-4">
              {trending.map(movie => (
                <Link key={movie.id} to={`/movie/${movie.id}`} className="movie-link">
                  <MovieCard movie={movie} />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;