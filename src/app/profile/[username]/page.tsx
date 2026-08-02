'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import MovieCard from '@/components/MovieCard';
import StarRating from '@/components/StarRating';
import { User, Movie } from '@/types';
import { User as UserIcon, Film, Eye, Star, MessageSquare, Users, UserPlus, UserCheck, Filter, Clock, AlertTriangle } from 'lucide-react';

interface ProfileData {
  user: User;
  movies: Movie[];
  stats: {
    followers: number;
    following: number;
  };
  isFollowing: boolean;
}

export default function Profile() {
  const params = useParams();
  const username = params?.username as string | undefined;
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [filter, setFilter] = useState<'all' | 'watched' | 'rated' | 'reviewed'>('all');

  const fetchProfile = useCallback(async () => {
    if (!username) return;
    try {
      setLoading(true);
      const { data } = await api.get<ProfileData>(`/api/user?username=${username}`);
      setProfile(data);
    } catch (err) {
      setError('User not found.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFollow = async () => {
    if (!profile) return;
    setActionLoading(true);
    try {
      const { data } = await api.post<{ followers: number }>(`/api/user`, { 
        action: 'follow', 
        followingId: profile.user.id 
      });

      setProfile(prev => prev ? ({ 
        ...prev, 
        isFollowing: true,
        stats: {
          ...prev.stats,
          followers: data.followers
        }
      }) : null);
    } catch (err) {
      console.error('Follow failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!profile) return;
    setActionLoading(true);
    try {
      const { data } = await api.post<{ followers: number }>(`/api/user`, { 
        action: 'unfollow', 
        followingId: profile.user.id 
      });

      setProfile(prev => prev ? ({ 
        ...prev, 
        isFollowing: false,
        stats: {
          ...prev.stats,
          followers: data.followers
        }
      }) : null);
    } catch (err) {
      console.error('Unfollow failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card text-center max-w-sm w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-[#ff4d4d] mx-auto mb-4" />
          <p className="font-bold text-xl text-[#2d2d2d]">Loading profile sketchbook...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card-postit text-center max-w-md w-full">
          <div className="w-16 h-16 bg-[#ff4d4d] text-white border-3 border-[#2d2d2d] rounded-full flex items-center justify-center mx-auto mb-4 shadow-[3px_3px_0px_#2d2d2d]">
            <AlertTriangle className="w-8 h-8 stroke-[3]" />
          </div>
          <h2 className="text-3xl font-heading font-bold mb-2">Profile Not Found</h2>
          <p className="text-lg text-[#2d2d2d]/80 mb-6">{error || 'User not found.'}</p>
          <Link href="/users" className="btn btn-primary mx-auto">
            Browse Community
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.username === profile.user.username;

  const watchedMovies = profile.movies.filter(movie => movie.watched_date);
  const ratedMovies = profile.movies.filter(movie => movie.rating && movie.rating > 0);
  const reviewedMovies = profile.movies.filter(movie => movie.review && movie.review.trim().length > 0);

  const filteredMovies = profile.movies.filter(movie => {
    switch (filter) {
      case 'watched':
        return movie.watched_date;
      case 'rated':
        return movie.rating && movie.rating > 0;
      case 'reviewed':
        return movie.review && movie.review.trim().length > 0;
      default:
        return true;
    }
  });

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Profile Header */}
        <div className="card relative">
          <div className="tape-strip" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              {/* Hand-drawn avatar circle */}
              <div className="w-20 h-20 md:w-24 md:h-24 bg-[#ff4d4d] text-white border-3 border-[#2d2d2d] rounded-full flex items-center justify-center font-heading text-4xl font-bold shadow-[4px_4px_0px_#2d2d2d] shrink-0 -rotate-3">
                {profile.user.username.charAt(0).toUpperCase()}
              </div>

              <div>
                <h1 className="text-3xl md:text-5xl font-heading font-bold text-[#2d2d2d] mb-2 flex items-center gap-3">
                  {profile.user.username}
                  {isOwnProfile && (
                    <span className="bg-[#fff9c4] border border-[#2d2d2d] px-2.5 py-0.5 rounded-full text-xs font-bold text-[#2d5da1] shadow-[1px_1px_0px_#2d2d2d]">
                      (Your Profile)
                    </span>
                  )}
                </h1>

                {/* Stats Tags */}
                <div className="flex flex-wrap items-center gap-3 text-sm font-bold">
                  <span className="bg-[#fff9c4] border border-[#2d2d2d] px-3 py-1 rounded-full shadow-[2px_2px_0px_#2d2d2d] flex items-center gap-1.5">
                    <Film className="w-4 h-4 text-[#2d5da1]" />
                    {profile.movies.length} Tracked
                  </span>
                  <span className="bg-[#e5e0d8] border border-[#2d2d2d] px-3 py-1 rounded-full shadow-[2px_2px_0px_#2d2d2d] flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-[#ff4d4d]" />
                    {watchedMovies.length} Watched
                  </span>
                  <span className="bg-[#fff9c4] border border-[#2d2d2d] px-3 py-1 rounded-full shadow-[2px_2px_0px_#2d2d2d] flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-[#ff4d4d] text-[#2d2d2d] stroke-[2]" />
                    {ratedMovies.length} Rated
                  </span>
                  <span className="bg-[#e5e0d8] border border-[#2d2d2d] px-3 py-1 rounded-full shadow-[2px_2px_0px_#2d2d2d] flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-[#2d5da1]" />
                    {reviewedMovies.length} Reviews
                  </span>
                  <span className="bg-[#fff9c4] border border-[#2d2d2d] px-3 py-1 rounded-full shadow-[2px_2px_0px_#2d2d2d] flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#ff4d4d]" />
                    {profile.stats?.followers || 0} Followers
                  </span>
                </div>
              </div>
            </div>

            {/* Follow / Unfollow Button */}
            {!isOwnProfile && currentUser && (
              <button 
                onClick={profile.isFollowing ? handleUnfollow : handleFollow}
                disabled={actionLoading}
                className={`btn ${
                  profile.isFollowing ? 'btn-secondary' : 'btn-primary'
                } text-lg px-6 py-3 flex items-center gap-2`}
              >
                {actionLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
                ) : (
                  <>
                    {profile.isFollowing ? (
                      <>
                        <UserCheck className="w-5 h-5 stroke-[2.5]" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5 stroke-[2.5]" />
                        <span>Follow</span>
                      </>
                    )}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        {profile.movies.length > 0 && (
          <div className="card">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 font-bold text-lg">
                <Filter className="w-5 h-5 text-[#2d5da1] stroke-[2.5]" />
                <span>Filter Collection:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`btn text-sm py-1.5 px-4 ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  All ({profile.movies.length})
                </button>
                <button
                  onClick={() => setFilter('watched')}
                  className={`btn text-sm py-1.5 px-4 ${filter === 'watched' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  Watched ({watchedMovies.length})
                </button>
                <button
                  onClick={() => setFilter('rated')}
                  className={`btn text-sm py-1.5 px-4 ${filter === 'rated' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  Rated ({ratedMovies.length})
                </button>
                <button
                  onClick={() => setFilter('reviewed')}
                  className={`btn text-sm py-1.5 px-4 ${filter === 'reviewed' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  Reviewed ({reviewedMovies.length})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Movies Grid */}
        <div>
          {filteredMovies.length > 0 ? (
            <>
              <h2 className="text-3xl font-heading font-bold mb-6 text-[#2d2d2d]">
                🎭 {isOwnProfile ? 'Your Collection' : `${profile.user.username}'s Collection`}
                <span className="text-[#ff4d4d] text-xl ml-2">
                  ({filteredMovies.length})
                </span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filteredMovies.map(movie => (
                  <div key={movie.id} className="space-y-2">
                    <Link href={`/movie/${movie.id}`}>
                      <MovieCard movie={movie} showUserRating />
                    </Link>

                    {/* Review Snippet Card */}
                    {(movie.review || movie.watched_date) && (
                      <div className="bg-white border-2 border-[#2d2d2d] p-3 rounded-[15px_225px_15px_255px/255px_15px_225px_15px] shadow-[3px_3px_0px_#2d2d2d] text-xs font-semibold">
                        {movie.watched_date && (
                          <div className="text-[#2d5da1] font-bold mb-1 flex items-center gap-1">
                            <Eye className="w-3 h-3 stroke-[2.5]" />
                            <span>{new Date(movie.watched_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {movie.review && (
                          <p className="text-[#2d2d2d]/80 font-body text-sm line-clamp-2 italic">
                            &ldquo;{movie.review}&rdquo;
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="card-postit text-center py-12 px-6">
              <h3 className="text-3xl font-heading font-bold mb-2">No Movies in Collection</h3>
              <p className="text-lg text-[#2d2d2d]/80 mb-6">
                {isOwnProfile ? 'Start searching and rating movies to add them to your collection!' : `${profile.user.username} hasn't added any movies yet.`}
              </p>
              {isOwnProfile && (
                <Link href="/" className="btn btn-primary text-lg mx-auto">
                  Discover Movies
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        {profile.movies.length > 0 && (
          <div className="card relative">
            <div className="thumbtack" />
            <h3 className="text-2xl font-heading font-bold mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6 stroke-[2.5] text-[#2d5da1]" />
              Recent Activity
            </h3>
            
            <div className="space-y-3">
              {profile.movies
                .sort((a, b) => new Date(b.updated_at || b.created_at || '').getTime() - new Date(a.updated_at || a.created_at || '').getTime())
                .slice(0, 5)
                .map(movie => (
                  <Link 
                    key={movie.id} 
                    href={`/movie/${movie.id}`}
                    className="flex items-center gap-4 p-3 bg-[#fdfbf7] border-2 border-[#2d2d2d] rounded-[255px_15px_225px_15px/15px_225px_15px_255px] shadow-[2px_2px_0px_#2d2d2d] hover:bg-[#fff9c4] transition-all group"
                  >
                    <img 
                      src={movie.poster_path 
                        ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` 
                        : 'https://via.placeholder.com/92x138?text=No+Cover'
                      }
                      alt={movie.title}
                      className="w-10 h-14 object-cover border border-[#2d2d2d] rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-heading font-bold text-lg group-hover:text-[#ff4d4d] transition-colors">
                        {movie.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs font-bold text-[#2d2d2d]/70 mt-0.5">
                        {movie.rating && movie.rating > 0 && (
                          <StarRating rating={movie.rating} readOnly size="small" />
                        )}
                        <span>
                          {movie.updated_at ? `Updated ${new Date(movie.updated_at).toLocaleDateString()}` : `Added ${new Date(movie.created_at || '').toLocaleDateString()}`}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
