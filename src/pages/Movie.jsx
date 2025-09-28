import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import StarRating from '../components/StarRating';

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
  const [watchedDate, setWatchedDate] = useState('');
  const [isWatched, setIsWatched] = useState(false);

  const fetchMovieData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/movies?id=${id}`);
      setMovie(data);
      
      if (data.currentUserReview) {
        setRating(data.currentUserReview.rating || 0);
        setReviewText(data.currentUserReview.review || '');
        setWatchedDate(data.currentUserReview.watched_date || '');
        setIsWatched(!!data.currentUserReview.watched_date);
      }
    } catch (err) {
      console.error('Error fetching movie:', err);
      setError('Failed to fetch movie details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovieData();
  }, [id]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Please log in to submit a review.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/movies', {
        movieId: id,
        rating: rating,
        review: reviewText.trim(),
        watchedDate: isWatched ? watchedDate : null
      });
      
      await fetchMovieData(); // Refresh movie data
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Failed to save review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsWatched = async () => {
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0];
    setIsWatched(true);
    setWatchedDate(today);
    
    try {
      await api.post('/api/movies', {
        movieId: id,
        rating: rating || 0,
        review: reviewText.trim(),
        watchedDate: today
      });
      await fetchMovieData();
    } catch (err) {
      console.error('Error marking as watched:', err);
      setError('Failed to mark as watched.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading movie details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl mb-4 block">⚠️</span>
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => {
              setError('');
              fetchMovieData();
            }}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
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
    <div className="min-h-screen">
      {/* Backdrop */}
      {backdropUrl && (
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{backgroundImage: `url(${backdropUrl})`}}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        </div>
      )}
      
      <div className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Movie Header */}
          <div className="flex flex-col lg:flex-row gap-8 mb-12">
            <div className="flex-shrink-0">
              <img 
                src={posterUrl} 
                alt={movie.title}
                className="w-80 h-auto rounded-xl shadow-2xl mx-auto lg:mx-0"
              />
            </div>

            <div className="flex-1 space-y-6">
              <h1 className="text-4xl lg:text-5xl font-bold">{movie.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 text-gray-300">
                {movie.release_date && (
                  <span className="flex items-center gap-2">
                    📅 {new Date(movie.release_date).getFullYear()}
                  </span>
                )}
                {movie.runtime && (
                  <span className="flex items-center gap-2">
                    ⏱️ {movie.runtime} min
                  </span>
                )}
                {movie.vote_average && (
                  <span className="flex items-center gap-2">
                    ⭐ {movie.vote_average.toFixed(1)}/10
                  </span>
                )}
              </div>

              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map(genre => (
                    <span key={genre.id} className="px-3 py-1 bg-primary-600/20 text-primary-300 rounded-full text-sm">
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              {movie.overview && (
                <div>
                  <h3 className="text-xl font-semibold mb-3">Overview</h3>
                  <p className="text-gray-300 leading-relaxed">{movie.overview}</p>
                </div>
              )}

              {/* Quick Actions */}
              {user && (
                <div className="flex flex-wrap gap-4">
                  {!isWatched ? (
                    <button 
                      onClick={handleMarkAsWatched}
                      className="btn btn-secondary"
                    >
                      <span className="text-lg">👁️</span>
                      Mark as Watched
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-green-400">
                      <span className="text-lg">✅</span>
                      <span>Watched on {new Date(watchedDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Review Section */}
          {user && (
            <div className="card max-w-2xl">
              <h3 className="text-2xl font-bold mb-6">
                {rating > 0 || isWatched ? 'Update Your Review' : 'Write a Review'}
              </h3>
              
              <form onSubmit={handleSubmitReview} className="space-y-6">
                {/* Watched Status */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isWatched}
                      onChange={(e) => {
                        setIsWatched(e.target.checked);
                        if (e.target.checked && !watchedDate) {
                          setWatchedDate(new Date().toISOString().split('T')[0]);
                        }
                      }}
                      className="w-4 h-4 text-primary-600 bg-gray-800 border-gray-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium">I've watched this movie</span>
                  </label>
                </div>

                {/* Watched Date */}
                {isWatched && (
                  <div>
                    <label htmlFor="watchedDate" className="block text-sm font-medium mb-2">
                      When did you watch it?
                    </label>
                    <input
                      id="watchedDate"
                      type="date"
                      value={watchedDate}
                      onChange={(e) => setWatchedDate(e.target.value)}
                      className="form-input"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-3">Your Rating</label>
                  <StarRating 
                    rating={rating}
                    onRatingChange={setRating}
                    size="large"
                  />
                </div>

                <div>
                  <label htmlFor="review" className="block text-sm font-medium mb-2">
                    Your Review (Optional)
                  </label>
                  <textarea
                    id="review"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="form-input h-32 resize-none"
                    placeholder="Share your thoughts about this movie..."
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Saving...
                    </>
                  ) : (
                    (rating > 0 || isWatched) ? 'Update Review' : 'Save Review'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Login prompt for non-users */}
          {!user && (
            <div className="card max-w-2xl text-center">
              <h3 className="text-xl font-bold mb-4">Want to track this movie?</h3>
              <p className="text-gray-400 mb-6">Sign up or log in to rate, review, and track your watched movies!</p>
              <div className="flex gap-4 justify-center">
                <a href="/login" className="btn btn-primary">Login</a>
                <a href="/signup" className="btn btn-secondary">Sign Up</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Movie;