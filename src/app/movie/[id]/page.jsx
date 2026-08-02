'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import StarRating from '@/components/StarRating';

export default function Movie() {
  const params = useParams();
  const id = params?.id;
  const { user } = useAuth();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  // Review form state
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [watchedDate, setWatchedDate] = useState('');
  const [isWatched, setIsWatched] = useState(false);

  const fetchMovieData = useCallback(async () => {
    if (!id) return;
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
  }, [id]);

  useEffect(() => {
    fetchMovieData();
  }, [fetchMovieData]);

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
      
      await fetchMovieData();
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Failed to save review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWatchlistToggle = async () => {
    if (!user) return;
    
    setWatchlistLoading(true);
    try {
      const { data } = await api.post('/api/movies', {
        movieId: id,
        action: 'watchlist'
      });
      
      setMovie(prev => ({
        ...prev,
        isInWatchlist: data.isInWatchlist
      }));
    } catch (err) {
      console.error('Error toggling watchlist:', err);
      setError('Failed to update watchlist.');
    } finally {
      setWatchlistLoading(false);
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
          <p className="text-slate-400">Loading movie details...</p>
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
    : 'https://via.placeholder.com/500x750?text=No+Poster';

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
              
              <div className="flex flex-wrap items-center gap-4 text-slate-300">
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
                {movie.vote_average != null && (
                  <span className="flex items-center gap-2">
                    ⭐ {Number(movie.vote_average).toFixed(1)}/10
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
                  <p className="text-slate-300 leading-relaxed">{movie.overview}</p>
                </div>
              )}

              {/* Quick Actions */}
              {user && (
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={handleWatchlistToggle}
                    disabled={watchlistLoading}
                    className={`btn ${movie.isInWatchlist ? 'btn-secondary' : 'btn-primary'}`}
                  >
                    {watchlistLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    ) : (
                      <>
                        <span className="text-lg">{movie.isInWatchlist ? '✓' : '+'}</span>
                        {movie.isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                      </>
                    )}
                  </button>
                  
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

          {/* Reviews Section */}
          {movie.reviews && movie.reviews.length > 0 && (
            <div className="card mb-8">
              <h3 className="text-2xl font-bold mb-6">User Reviews</h3>
              <div className="space-y-6">
                {movie.reviews.map((review, index) => (
                  <div key={index} className="border-b border-slate-800 last:border-b-0 pb-6 last:pb-0">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold">
                        {review.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <Link 
                            href={`/profile/${review.username}`}
                            className="font-semibold hover:text-primary-400 transition-colors"
                          >
                            {review.username}
                          </Link>
                          <StarRating rating={review.rating} readOnly size="small" />
                          <span className="text-sm text-slate-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {review.watched_date && (
                          <div className="text-sm text-green-400 mb-2 flex items-center gap-1">
                            <span>👁️</span>
                            Watched on {new Date(review.watched_date).toLocaleDateString()}
                          </div>
                        )}
                        <p className="text-slate-300 leading-relaxed">{review.review}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review Form */}
          {user && (
            <div className="card max-w-2xl">
              <h3 className="text-2xl font-bold mb-6">
                {rating > 0 || isWatched ? 'Update Your Review' : 'Write a Review'}
              </h3>
              
              <form onSubmit={handleSubmitReview} className="space-y-6">
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
                      className="w-4 h-4 text-primary-600 bg-slate-800 border-slate-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium">I&apos;ve watched this movie</span>
                  </label>
                </div>

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
              <p className="text-slate-400 mb-6">Sign up or log in to rate, review, and add movies to your watchlist!</p>
              <div className="flex gap-4 justify-center">
                <Link href="/login" className="btn btn-primary">Login</Link>
                <Link href="/signup" className="btn btn-secondary">Sign Up</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
