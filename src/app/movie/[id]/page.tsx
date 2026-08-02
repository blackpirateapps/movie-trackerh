'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import StarRating from '@/components/StarRating';
import { Movie as MovieType } from '@/types';
import { Calendar, Clock, Star, Bookmark, Eye, CheckCircle2, MessageSquare, AlertTriangle, Send } from 'lucide-react';

export default function MoviePage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const { user } = useAuth();
  const [movie, setMovie] = useState<MovieType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [watchlistLoading, setWatchlistLoading] = useState<boolean>(false);

  // Review form state
  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [watchedDate, setWatchedDate] = useState<string>('');
  const [isWatched, setIsWatched] = useState<boolean>(false);

  const fetchMovieData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data } = await api.get<MovieType>(`/api/movies?id=${id}`);
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

  const handleSubmitReview = async (e: React.FormEvent<HTMLFormElement>) => {
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
      const { data } = await api.post<{ isInWatchlist: boolean }>('/api/movies', {
        movieId: id,
        action: 'watchlist'
      });
      
      setMovie(prev => prev ? {
        ...prev,
        isInWatchlist: data.isInWatchlist
      } : null);
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card text-center max-w-sm w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-[#ff4d4d] mx-auto mb-4" />
          <p className="font-bold text-xl text-[#2d2d2d]">Fetching movie details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card-postit text-center max-w-md w-full">
          <div className="w-16 h-16 bg-[#ff4d4d] text-white border-3 border-[#2d2d2d] rounded-full flex items-center justify-center mx-auto mb-4 shadow-[3px_3px_0px_#2d2d2d]">
            <AlertTriangle className="w-8 h-8 stroke-[3]" />
          </div>
          <p className="font-bold text-xl text-[#ff4d4d] mb-4">{error}</p>
          <button 
            onClick={() => {
              setError('');
              fetchMovieData();
            }}
            className="btn btn-primary mx-auto"
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

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Movie Header Card */}
        <div className="card relative">
          <div className="tape-strip" />

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Taped Poster Photo */}
            <div className="w-full lg:w-72 shrink-0 relative pt-2">
              <div className="tape-strip" />
              <div 
                className="bg-white border-3 border-[#2d2d2d] p-3 shadow-[6px_6px_0px_#2d2d2d] -rotate-1"
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
              >
                <img 
                  src={posterUrl} 
                  alt={movie.title}
                  className="w-full h-auto rounded-[15px_225px_15px_255px/255px_15px_225px_15px] border-2 border-[#2d2d2d]"
                />
              </div>
            </div>

            {/* Main Movie Info */}
            <div className="flex-1 space-y-5">
              <h1 className="text-4xl lg:text-6xl font-heading font-bold text-[#2d2d2d] leading-tight">
                {movie.title}
              </h1>

              {/* Metadata Badges */}
              <div className="flex flex-wrap items-center gap-3 text-sm font-bold">
                {movie.release_date && (
                  <span className="bg-[#fff9c4] border-2 border-[#2d2d2d] px-3 py-1 rounded-full shadow-[2px_2px_0px_#2d2d2d] flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#ff4d4d] stroke-[2.5]" />
                    {new Date(movie.release_date).getFullYear()}
                  </span>
                )}
                {movie.runtime && (
                  <span className="bg-[#e5e0d8] border-2 border-[#2d2d2d] px-3 py-1 rounded-full shadow-[2px_2px_0px_#2d2d2d] flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#2d5da1] stroke-[2.5]" />
                    {movie.runtime} mins
                  </span>
                )}
                {movie.vote_average != null && (
                  <span className="bg-[#fff9c4] border-2 border-[#2d2d2d] px-3 py-1 rounded-full shadow-[2px_2px_0px_#2d2d2d] flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-[#ff4d4d] text-[#2d2d2d] stroke-[2]" />
                    {Number(movie.vote_average).toFixed(1)} / 10
                  </span>
                )}
              </div>

              {/* Genres */}
              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map(genre => (
                    <span 
                      key={genre.id} 
                      className="px-3 py-0.5 bg-white border border-[#2d2d2d] rounded-full text-xs font-bold shadow-[1px_1px_0px_#2d2d2d]"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Overview */}
              {movie.overview && (
                <div className="bg-[#fdfbf7] border-2 border-[#2d2d2d] p-4 rounded-[15px_225px_15px_255px/255px_15px_225px_15px] shadow-[3px_3px_0px_#2d2d2d]">
                  <h3 className="font-heading font-bold text-xl mb-1 text-[#2d5da1]">Overview</h3>
                  <p className="text-lg text-[#2d2d2d] font-body leading-relaxed">{movie.overview}</p>
                </div>
              )}

              {/* Quick Actions */}
              {user && (
                <div className="flex flex-wrap gap-4 pt-2">
                  <button 
                    onClick={handleWatchlistToggle}
                    disabled={watchlistLoading}
                    className={`btn text-lg ${movie.isInWatchlist ? 'btn-secondary' : 'btn-primary'}`}
                  >
                    {watchlistLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
                    ) : (
                      <>
                        <Bookmark className="w-5 h-5 stroke-[2.5]" />
                        <span>{movie.isInWatchlist ? 'In Watchlist ✓' : 'Add to Watchlist'}</span>
                      </>
                    )}
                  </button>
                  
                  {!isWatched ? (
                    <button 
                      onClick={handleMarkAsWatched}
                      className="btn btn-secondary text-lg"
                    >
                      <Eye className="w-5 h-5 stroke-[2.5]" />
                      <span>Mark as Watched</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-[#fff9c4] border-2 border-[#2d2d2d] px-4 py-2 rounded-full font-bold text-base shadow-[2px_2px_0px_#2d2d2d]">
                      <CheckCircle2 className="w-5 h-5 text-[#2d5da1] stroke-[2.5]" />
                      <span>Watched on {new Date(watchedDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Reviews Section */}
        {movie.reviews && movie.reviews.length > 0 && (
          <div className="card relative">
            <div className="thumbtack" />
            <h3 className="text-3xl font-heading font-bold mb-6 flex items-center gap-3">
              <MessageSquare className="w-7 h-7 stroke-[2.5] text-[#2d5da1]" />
              Public Reviews ({movie.reviews.length})
            </h3>
            
            <div className="space-y-6">
              {movie.reviews.map((review, index) => (
                <div key={index} className="bg-[#fdfbf7] border-2 border-[#2d2d2d] p-5 rounded-[20px_255px_20px_255px/255px_20px_255px_20px] shadow-[4px_4px_0px_#2d2d2d]">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#ff4d4d] text-white border-2 border-[#2d2d2d] rounded-full flex items-center justify-center font-heading text-lg font-bold shrink-0 shadow-[2px_2px_0px_#2d2d2d]">
                      {review.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <Link 
                          href={`/profile/${review.username}`}
                          className="font-heading font-bold text-xl text-[#2d2d2d] hover:text-[#ff4d4d] transition-colors"
                        >
                          {review.username}
                        </Link>
                        <StarRating rating={review.rating} readOnly size="small" />
                        <span className="text-xs font-semibold text-[#2d2d2d]/60">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {review.watched_date && (
                        <div className="text-xs font-bold text-[#2d5da1] mb-2 flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 stroke-[2.5]" />
                          Watched on {new Date(review.watched_date).toLocaleDateString()}
                        </div>
                      )}
                      <p className="text-lg font-body text-[#2d2d2d] leading-relaxed italic">
                        &ldquo;{review.review}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Form */}
        {user && (
          <div className="card-postit max-w-2xl mx-auto relative">
            <div className="thumbtack" />
            <h3 className="text-3xl font-heading font-bold mb-6">
              {rating > 0 || isWatched ? 'Update Your Entry' : 'Write a Review'}
            </h3>
            
            <form onSubmit={handleSubmitReview} className="space-y-6">
              <div className="flex items-center gap-3 bg-white p-3 border-2 border-[#2d2d2d] rounded-xl shadow-[2px_2px_0px_#2d2d2d]">
                <input
                  type="checkbox"
                  id="watchedCheckbox"
                  checked={isWatched}
                  onChange={(e) => {
                    setIsWatched(e.target.checked);
                    if (e.target.checked && !watchedDate) {
                      setWatchedDate(new Date().toISOString().split('T')[0]);
                    }
                  }}
                  className="w-5 h-5 accent-[#ff4d4d] cursor-pointer"
                />
                <label htmlFor="watchedCheckbox" className="text-lg font-bold cursor-pointer text-[#2d2d2d]">
                  I&apos;ve watched this movie!
                </label>
              </div>

              {isWatched && (
                <div>
                  <label htmlFor="watchedDate" className="block text-lg font-bold mb-1 text-[#2d2d2d]">
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
                <label className="block text-lg font-bold mb-2 text-[#2d2d2d]">
                  Your Rating
                </label>
                <StarRating 
                  rating={rating}
                  onRatingChange={setRating}
                  size="large"
                />
              </div>

              <div>
                <label htmlFor="review" className="block text-lg font-bold mb-1 text-[#2d2d2d]">
                  Your Thoughts & Review (Optional)
                </label>
                <textarea
                  id="review"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="form-input h-36 resize-none"
                  placeholder="What did you think of the direction, story, or acting?"
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="btn btn-primary text-xl py-3.5 px-8 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-3 border-white" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 stroke-[2.5]" />
                    <span>{(rating > 0 || isWatched) ? 'Update Review' : 'Save Review'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Login Prompt for Guests */}
        {!user && (
          <div className="card-postit text-center max-w-2xl mx-auto py-8 px-6">
            <h3 className="text-3xl font-heading font-bold mb-3">Want to track this movie?</h3>
            <p className="text-lg text-[#2d2d2d]/80 mb-6">
              Sign up or log in to rate, review, and keep movies in your watchlist!
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/login" className="btn btn-primary text-lg">Login</Link>
              <Link href="/signup" className="btn btn-secondary text-lg">Sign Up</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
