'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import MovieCard from '@/components/MovieCard';
import StarRating from '@/components/StarRating';
import { User, Movie } from '@/types';

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">😔</span>
          <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
          <p className="text-slate-400 mb-6">{error || 'User not found.'}</p>
          <Link href="/users" className="btn btn-primary">
            Browse Users
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
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="card mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-2xl md:text-3xl font-bold shadow-xl ring-4 ring-primary-500/20">
                {profile.user.username.charAt(0).toUpperCase()}
              </div>

              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  {profile.user.username}
                  {isOwnProfile && <span className="text-primary-400 ml-2 text-lg">(You)</span>}
                </h1>

                <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
                  <div className="flex items-center gap-1">
                    <span className="text-primary-400">🎬</span>
                    <span className="font-semibold text-white">{profile.movies.length}</span>
                    <span>Movies</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-green-400">👁️</span>
                    <span className="font-semibold text-white">{watchedMovies.length}</span>
                    <span>Watched</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400">⭐</span>
                    <span className="font-semibold text-white">{ratedMovies.length}</span>
                    <span>Rated</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-blue-400">📝</span>
                    <span className="font-semibold text-white">{reviewedMovies.length}</span>
                    <span>Reviews</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-pink-400">👥</span>
                    <span className="font-semibold text-white">{profile.stats?.followers || 0}</span>
                    <span>Followers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-purple-400">➕</span>
                    <span className="font-semibold text-white">{profile.stats?.following || 0}</span>
                    <span>Following</span>
                  </div>
                </div>
              </div>
            </div>

            {!isOwnProfile && currentUser && (
              <div className="flex items-center gap-3">
                <button 
                  onClick={profile.isFollowing ? handleUnfollow : handleFollow}
                  disabled={actionLoading}
                  className={`btn ${
                    profile.isFollowing 
                      ? 'btn-secondary border-slate-600 hover:border-red-500 hover:text-red-400' 
                      : 'btn-primary'
                  } px-6`}
                >
                  {actionLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  ) : (
                    <>
                      <span className="text-lg">
                        {profile.isFollowing ? '👤' : '➕'}
                      </span>
                      {profile.isFollowing ? 'Unfollow' : 'Follow'}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        {profile.movies.length > 0 && (
          <div className="card mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-slate-300">Filter Movies:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`btn text-sm ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  All ({profile.movies.length})
                </button>
                <button
                  onClick={() => setFilter('watched')}
                  className={`btn text-sm ${filter === 'watched' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  <span className="text-green-400 mr-1">👁️</span>
                  Watched ({watchedMovies.length})
                </button>
                <button
                  onClick={() => setFilter('rated')}
                  className={`btn text-sm ${filter === 'rated' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  <span className="text-yellow-400 mr-1">⭐</span>
                  Rated ({ratedMovies.length})
                </button>
                <button
                  onClick={() => setFilter('reviewed')}
                  className={`btn text-sm ${filter === 'reviewed' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  <span className="text-blue-400 mr-1">📝</span>
                  Reviewed ({reviewedMovies.length})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Movies Section */}
        <div className="mb-8">
          {filteredMovies.length > 0 ? (
            <>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                🎭 {isOwnProfile ? 'Your Movies' : `${profile.user.username}'s Movies`}
                <span className="text-primary-400 text-lg">
                  ({filteredMovies.length}{filter !== 'all' && ` ${filter}`})
                </span>
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredMovies.map(movie => (
                  <div key={movie.id} className="group animate-fade-in">
                    <Link href={`/movie/${movie.id}`} className="block">
                      <MovieCard movie={movie} showUserRating />
                    </Link>

                    <div className="mt-3 p-4 bg-slate-900/30 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        {movie.rating && movie.rating > 0 && (
                          <StarRating rating={movie.rating} readOnly size="small" />
                        )}
                        <span className="text-xs text-slate-500">
                          {movie.created_at && new Date(movie.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {movie.watched_date && (
                        <div className="flex items-center gap-2 mb-2 text-sm text-green-400">
                          <span>👁️</span>
                          <span>Watched {new Date(movie.watched_date).toLocaleDateString()}</span>
                        </div>
                      )}

                      {movie.review && (
                        <blockquote className="text-sm text-slate-300 italic line-clamp-3">
                          &quot;{movie.review}&quot;
                        </blockquote>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="mb-6">
                <span className="text-6xl block mb-4">
                  {filter === 'watched' ? '👁️' : 
                   filter === 'rated' ? '⭐' : 
                   filter === 'reviewed' ? '📝' : '🎭'}
                </span>
                <h3 className="text-xl font-semibold mb-2 text-slate-300">
                  {filter === 'all' 
                    ? (isOwnProfile ? 'No movies in your collection yet' : 'No movies tracked')
                    : `No ${filter} movies found`
                  }
                </h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  {filter === 'all' 
                    ? (isOwnProfile 
                        ? 'Start exploring and rating movies to build your collection!' 
                        : `${profile.user.username} hasn't added any movies yet.`
                      )
                    : `${isOwnProfile ? 'You haven\'t' : `${profile.user.username} hasn't`} ${filter} any movies yet.`
                  }
                </p>
              </div>
              {isOwnProfile && (
                <div className="flex gap-4 justify-center">
                  <Link href="/" className="btn btn-primary">
                    <span className="text-lg">🔍</span>
                    Discover Movies
                  </Link>
                  {filter !== 'all' && (
                    <button 
                      onClick={() => setFilter('all')}
                      className="btn btn-secondary"
                    >
                      View All Movies
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        {profile.movies.length > 0 && filteredMovies.length > 0 && (
          <div className="card">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              📈 Recent Activity
            </h3>
            <div className="space-y-4">
              {profile.movies
                .sort((a, b) => new Date(b.updated_at || b.created_at || '').getTime() - new Date(a.updated_at || a.created_at || '').getTime())
                .slice(0, 5)
                .map(movie => (
                <div key={movie.id} className="flex items-center gap-4 p-3 bg-slate-900/20 rounded-lg hover:bg-slate-900/30 transition-colors">
                  <Link href={`/movie/${movie.id}`} className="flex items-center gap-4 flex-1">
                    <img 
                      src={movie.poster_path 
                        ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` 
                        : 'https://via.placeholder.com/92x138?text=No+Cover'
                      }
                      alt={movie.title}
                      className="w-12 h-18 object-cover rounded shadow-md"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium hover:text-primary-400 transition-colors">{movie.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        {movie.rating && movie.rating > 0 && (
                          <StarRating rating={movie.rating} readOnly size="small" />
                        )}
                        {movie.watched_date && (
                          <span className="text-xs text-green-400 flex items-center gap-1">
                            <span>👁️</span>
                            {new Date(movie.watched_date).toLocaleDateString()}
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          {movie.updated_at ? 
                            `Updated ${new Date(movie.updated_at).toLocaleDateString()}` :
                            `Added ${new Date(movie.created_at || '').toLocaleDateString()}`
                          }
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
