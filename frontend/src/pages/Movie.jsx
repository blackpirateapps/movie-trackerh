import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import StarRating from '../components/StarRating';
import './Movie.css';

const Movie = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Review form state
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const fetchMovieData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/movies?id=${id}`);
      setMovie(data);
      
      if (data.currentUserReview) {
        setRating(data.currentUserReview.rating || 0);
        setReviewText(data.currentUserReview.review || '');
      }
    } catch (err) {
      setError('Failed to fetch movie data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovieData();
  }, [id]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      await api.post('/api/movies', {
        movieId: id,
        rating: rating,
        review: reviewText.trim()
      });
      
      await fetchMovieData(); // Refresh movie data
    } catch (err) {
      setError('Failed to save review');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="movie-loading">
        <div className="loading-spinner" />
        <p>Loading movie details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="movie-error">
        <span className="error-icon">⚠️</span>
        <p>{error}</p>
      </div>
    );
  }

  if (!movie) return null;

  const posterUrl = movie.poster_path 
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : '/api/placeholder/500/750';

  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
    : null;

  return (
    <div className="movie-page">
      {backdropUrl && (
        <div className="movie-backdrop" style={{backgroundImage: `url(${backdropUrl})`}}>
          <div className="backdrop-overlay"></div>
        </div>
      )}
      
      <div className="movie-content">
        <div className="container">
          <div className="movie-header">
            <div className="movie-poster-section">
              <img 
                src={posterUrl} 
                alt={movie.title}
                className="movie-poster-large"
              />
            </div>

            <div className="movie-details">
              <h1 className="movie-title">{movie.title}</h1>
              
              <div className="movie-meta">
                {movie.release_date && (
                  <span className="meta-item">
                    📅 {new Date(movie.release_date).getFullYear()}
                  </span>
                )}
                {movie.runtime && (
                  <span className="meta-item">
                    ⏱️ {movie.runtime} min
                  </span>
                )}
                {movie.vote_average && (
                  <span className="meta-item">
                    ⭐ {movie.vote_average.toFixed(1)}/10
                  </span>
                )}
              </div>

              {movie.genres && movie.genres.length > 0 && (
                <div className="movie-genres">
                  {movie.genres.map(genre => (
                    <span key={genre.id} className="genre-tag">
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              {movie.overview && (
                <div className="movie-overview">
                  <h3>Overview</h3>
                  <p>{movie.overview}</p>
                </div>
              )}
            </div>
          </div>

          {user && (
            <div className="review-section">
              <div className="review-card card">
                <h3 className="review-title">
                  {rating > 0 ? 'Update Your Review' : 'Write a Review'}
                </h3>
                
                <form onSubmit={handleSubmitReview} className="review-form">
                  <div className="rating-section">
                    <label className="form-label">Your Rating</label>
                    <StarRating 
                      rating={rating}
                      onRatingChange={setRating}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="review" className="form-label">
                      Your Review (Optional)
                    </label>
                    <textarea
                      id="review"
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      className="form-input review-textarea"
                      placeholder="Share your thoughts about this movie..."
                      rows="4"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={submitting || rating === 0}
                    className="btn btn-primary"
                  >
                    {submitting ? (
                      <>
                        <div className="loading-spinner" />
                        Saving...
                      </>
                    ) : (
                      rating > 0 ? 'Update Review' : 'Save Review'
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Movie;