'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import StarRating from '@/components/StarRating';
import { Movie as MovieType } from '@/types';
import { Calendar, Clock, Star, Bookmark, Eye, CheckCircle2, MessageSquare, AlertTriangle, Send, Film } from 'lucide-react';

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

  const fetchMovieData = useCallback(async (showSpinner = false) => {
    if (!id) return;
    try {
      if (showSpinner) setLoading(true);
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
      if (showSpinner) {
        setError('Failed to fetch movie details. Please try again.');
      }
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMovieData(true);
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
      
      await fetchMovieData(false);
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
      await fetchMovieData(false);
    } catch (err) {
      console.error('Error marking as watched:', err);
      setError('Failed to mark as watched.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#121212]">
        <div className="card text-center max-w-sm w-full bg-[#1E1E1E] border border-[#333333] p-6 rounded">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00FF66] border-t-transparent mx-auto mb-3" />
          <p className="font-bold text-sm text-[#EDEDED]">Loading movie data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#121212]">
        <div className="card text-center max-w-md w-full bg-[#1E1E1E] border border-[#333333] p-6 rounded">
          <div className="w-12 h-12 bg-[#ff4d4d]/10 text-[#ff4d4d] border border-[#ff4d4d]/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="font-bold text-sm text-[#ff4d4d] mb-4">{error}</p>
          <button 
            onClick={() => {
              setError('');
              fetchMovieData(true);
            }}
            className="btn btn-primary mx-auto text-xs py-2 px-4"
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
    : null;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8 bg-[#121212] text-[#EDEDED]">
      
      {/* Hero Header Card (Section 4.3 Mobile First) */}
      <div className="card bg-[#1E1E1E] border border-[#333333] p-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          
          {/* Aspect 2/3 Poster Container */}
          <div className="w-32 md:w-48 shrink-0 aspect-[2/3] relative rounded overflow-hidden border border-[#333333] bg-[#2A2A2A]">
            {posterUrl ? (
              <img 
                src={posterUrl} 
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-[#A0A0A0]">
                <Film className="w-8 h-8 opacity-40 mb-1" />
                <span className="text-[10px] font-semibold">No Poster</span>
              </div>
            )}
          </div>

          {/* Main Info */}
          <div className="flex-1 space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#00FF66] mb-1 block">
                FEATURE FILM
              </span>
              <h1 className="text-2xl sm:text-4xl font-bold text-[#EDEDED] leading-tight">
                {movie.title}
              </h1>
            </div>

            {/* Metadata Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              {movie.release_date && (
                <span className="bg-[#2A2A2A] border border-[#333333] px-2.5 py-1 rounded text-[#EDEDED] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#00FF66]" />
                  {new Date(movie.release_date).getFullYear()}
                </span>
              )}
              {movie.runtime && (
                <span className="bg-[#2A2A2A] border border-[#333333] px-2.5 py-1 rounded text-[#EDEDED] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#A0A0A0]" />
                  {movie.runtime} mins
                </span>
              )}
              {movie.vote_average != null && (
                <span className="bg-[#2A2A2A] border border-[#333333] px-2.5 py-1 rounded text-[#00FF66] font-bold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-[#00FF66]" />
                  TMDB {Number(movie.vote_average).toFixed(1)} / 10
                </span>
              )}
            </div>

            {/* Genres */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {movie.genres.map(genre => (
                  <span 
                    key={genre.id} 
                    className="px-2 py-0.5 bg-[#121212] border border-[#333333] rounded text-[10px] font-medium text-[#A0A0A0]"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {/* Overview */}
            {movie.overview && (
              <div className="pt-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#A0A0A0] mb-1">Synopsis</h3>
                <p className="text-sm text-[#EDEDED]/90 leading-relaxed font-normal">{movie.overview}</p>
              </div>
            )}

            {/* Quick Actions */}
            {user && (
              <div className="flex flex-wrap gap-3 pt-2">
                <button 
                  onClick={handleWatchlistToggle}
                  disabled={watchlistLoading}
                  className={`btn text-xs py-2 px-4 ${movie.isInWatchlist ? 'btn-secondary' : 'btn-primary'}`}
                >
                  {watchlistLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4" />
                      <span>{movie.isInWatchlist ? 'In Watchlist ✓' : 'Add to Watchlist'}</span>
                    </>
                  )}
                </button>
                
                {!isWatched ? (
                  <button 
                    onClick={handleMarkAsWatched}
                    className="btn btn-secondary text-xs py-2 px-4"
                  >
                    <Eye className="w-4 h-4 text-[#00FF66]" />
                    <span>Mark as Watched</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-[#2A2A2A] border border-[#333333] px-3 py-1.5 rounded text-xs font-semibold text-[#00FF66]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Watched on {new Date(watchedDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Log & Review Form */}
      {user && (
        <div className="card bg-[#1E1E1E] border border-[#333333] p-6 max-w-2xl mx-auto">
          <h3 className="text-lg font-bold mb-4 text-[#EDEDED] flex items-center gap-2">
            <Film className="w-5 h-5 text-[#00FF66]" />
            {rating > 0 || isWatched ? 'Update Log Entry' : 'Log Movie'}
          </h3>
          
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div className="flex items-center gap-2 bg-[#121212] p-3 border border-[#333333] rounded">
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
                className="w-4 h-4 accent-[#00FF66] cursor-pointer"
              />
              <label htmlFor="watchedCheckbox" className="text-xs font-semibold cursor-pointer text-[#EDEDED]">
                I&apos;ve watched this movie
              </label>
            </div>

            {isWatched && (
              <div>
                <label htmlFor="watchedDate" className="block text-xs font-bold uppercase tracking-widest text-[#A0A0A0] mb-1">
                  Watched Date
                </label>
                <input
                  id="watchedDate"
                  type="date"
                  value={watchedDate}
                  onChange={(e) => setWatchedDate(e.target.value)}
                  className="form-input text-xs py-2"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[#A0A0A0] mb-1.5">
                Rating (1 to 10 Scale)
              </label>
              <StarRating 
                rating={rating}
                onRatingChange={setRating}
                size="large"
              />
            </div>

            <div>
              <label htmlFor="review" className="block text-xs font-bold uppercase tracking-widest text-[#A0A0A0] mb-1">
                Review & Notes
              </label>
              <textarea
                id="review"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="form-input h-28 resize-none text-xs"
                placeholder="Share your thoughts on acting, direction, or story..."
              />
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="btn btn-primary text-xs py-2.5 px-6 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#121212] border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{(rating > 0 || isWatched) ? 'Update Log Entry' : 'Save Log Entry'}</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Community Reviews Section */}
      {movie.reviews && movie.reviews.length > 0 && (
        <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-4">
          <h3 className="text-base font-bold flex items-center gap-2 text-[#EDEDED]">
            <MessageSquare className="w-4 h-4 text-[#00FF66]" />
            Community Reviews ({movie.reviews.length})
          </h3>
          
          <div className="space-y-3">
            {movie.reviews.map((review, index) => (
              <div key={index} className="bg-[#121212] border border-[#333333] p-4 rounded text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#00FF66] text-[#121212] rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    {review.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link 
                        href={`/profile/${review.username}`}
                        className="font-bold text-sm text-[#EDEDED] hover:text-[#00FF66] transition-colors"
                      >
                        {review.username}
                      </Link>
                      <StarRating rating={review.rating} readOnly size="small" />
                      <span className="text-[10px] text-[#A0A0A0]">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {review.watched_date && (
                      <div className="text-[10px] text-[#00FF66] font-semibold flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        Watched on {new Date(review.watched_date).toLocaleDateString()}
                      </div>
                    )}
                    <p className="text-xs text-[#EDEDED]/90 leading-relaxed italic">
                      &ldquo;{review.review}&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guest Prompt */}
      {!user && (
        <div className="card bg-[#1E1E1E] border border-[#333333] text-center max-w-xl mx-auto p-6">
          <h3 className="text-base font-bold mb-2">Want to track this movie?</h3>
          <p className="text-xs text-[#A0A0A0] mb-4">
            Log in or sign up to rate, write reviews, and maintain your watchlist.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/login" className="btn btn-primary text-xs py-2 px-5">Login</Link>
            <Link href="/signup" className="btn btn-secondary text-xs py-2 px-5">Sign Up</Link>
          </div>
        </div>
      )}
    </div>
  );
}
