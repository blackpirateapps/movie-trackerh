'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import MovieCard from '@/components/MovieCard';
import TVShowCard from '@/components/TVShowCard';
import { User, Movie, TVShow } from '@/types';
import { 
  Film, Tv, Users, UserPlus, UserCheck, 
  AlertTriangle, Calendar
} from 'lucide-react';

interface ProfileData {
  user: User;
  movies: Movie[];
  tvShows?: TVShow[];
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

  const [activeTab, setActiveTab] = useState<'movies' | 'tv'>('movies');
  const [filter, setFilter] = useState<'all' | 'watched' | 'rated' | 'reviewed' | 'favorites'>('all');

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
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#121212]">
        <div className="card text-center max-w-sm w-full bg-[#1E1E1E] border border-[#333333] p-6 rounded">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00FF66] border-t-transparent mx-auto mb-3" />
          <p className="font-bold text-sm text-[#EDEDED]">Loading profile data...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#121212]">
        <div className="card text-center max-w-md w-full bg-[#1E1E1E] border border-[#333333] p-6 rounded space-y-3">
          <div className="w-12 h-12 bg-[#ff4d4d]/10 text-[#ff4d4d] border border-[#ff4d4d]/30 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-[#EDEDED]">Profile Not Found</h2>
          <p className="text-xs text-[#A0A0A0]">{error || 'User not found.'}</p>
          <Link href="/users" className="btn btn-primary text-xs py-2 px-4 inline-block">
            Browse Community
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.username === profile.user.username;
  const tvShows = profile.tvShows || [];

  const filteredMovies = profile.movies.filter(movie => {
    switch (filter) {
      case 'watched': return movie.watched_date;
      case 'rated': return movie.rating && movie.rating > 0;
      case 'reviewed': return movie.review && movie.review.trim().length > 0;
      default: return true;
    }
  });

  const filteredTvShows = tvShows.filter(show => {
    switch (filter) {
      case 'favorites': return show.is_favorite;
      case 'rated': return show.rating && show.rating > 0;
      case 'reviewed': return show.review && show.review.trim().length > 0;
      default: return true;
    }
  });

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6 bg-[#121212] text-[#EDEDED]">
      
      {/* Profile Header */}
      <div className="card bg-[#1E1E1E] border border-[#333333] p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#00FF66] text-[#121212] rounded-full flex items-center justify-center font-bold text-2xl shrink-0">
              {profile.user.username.charAt(0).toUpperCase()}
            </div>

            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-[#EDEDED] flex items-center gap-2">
                {profile.user.username}
                {isOwnProfile && (
                  <span className="bg-[#121212] border border-[#333333] px-2 py-0.5 rounded text-[10px] font-bold text-[#00FF66]">
                    YOU
                  </span>
                )}
              </h1>

              {/* Stats Tags */}
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-semibold text-[#A0A0A0]">
                <span className="bg-[#121212] border border-[#333333] px-2.5 py-1 rounded flex items-center gap-1">
                  <Film className="w-3.5 h-3.5 text-[#00FF66]" />
                  {profile.movies.length} Movies
                </span>
                <span className="bg-[#121212] border border-[#333333] px-2.5 py-1 rounded flex items-center gap-1">
                  <Tv className="w-3.5 h-3.5 text-[#00FF66]" />
                  {tvShows.length} TV Shows
                </span>
                <span className="bg-[#121212] border border-[#333333] px-2.5 py-1 rounded flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#00FF66]" />
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
              className={`btn text-xs py-2 px-5 ${
                profile.isFollowing ? 'btn-secondary' : 'btn-primary'
              }`}
            >
              {actionLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
              ) : (
                <>
                  {profile.isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Follow User</span>
                    </>
                  )}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs & Filters */}
      <div className="card bg-[#1E1E1E] border border-[#333333] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('movies')}
              className={`btn text-xs py-1.5 px-4 ${
                activeTab === 'movies' ? 'btn-primary' : 'btn-ghost'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Movies ({profile.movies.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('tv')}
              className={`btn text-xs py-1.5 px-4 ${
                activeTab === 'tv' ? 'btn-primary' : 'btn-ghost'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>TV Shows ({tvShows.length})</span>
            </button>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-1.5 overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`btn text-[11px] py-1 px-2.5 ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            >
              All
            </button>
            {activeTab === 'tv' && (
              <button
                onClick={() => setFilter('favorites')}
                className={`btn text-[11px] py-1 px-2.5 ${filter === 'favorites' ? 'btn-primary' : 'btn-ghost'}`}
              >
                Favorites
              </button>
            )}
            <button
              onClick={() => setFilter('rated')}
              className={`btn text-[11px] py-1 px-2.5 ${filter === 'rated' ? 'btn-primary' : 'btn-ghost'}`}
            >
              Rated
            </button>
            <button
              onClick={() => setFilter('reviewed')}
              className={`btn text-[11px] py-1 px-2.5 ${filter === 'reviewed' ? 'btn-primary' : 'btn-ghost'}`}
            >
              Reviewed
            </button>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      {activeTab === 'movies' ? (
        <div>
          {filteredMovies.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
              {filteredMovies.map(movie => (
                <div key={movie.id} className="space-y-1">
                  <Link href={`/movie/${movie.id}`}>
                    <MovieCard movie={movie} showUserRating />
                  </Link>

                  {movie.review && (
                    <div className="bg-[#1E1E1E] border border-[#333333] p-2 rounded text-[10px] text-[#A0A0A0] line-clamp-2 italic">
                      &ldquo;{movie.review}&rdquo;
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="card bg-[#1E1E1E] border border-[#333333] text-center py-8 px-4">
              <h3 className="text-sm font-bold text-[#EDEDED] mb-1">No Movies Found</h3>
              <p className="text-xs text-[#A0A0A0]">
                {isOwnProfile ? 'Search and rate movies to populate your list.' : `${profile.user.username} has no movie entries under this filter.`}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div>
          {filteredTvShows.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
              {filteredTvShows.map(show => (
                <div key={show.id} className="space-y-1">
                  <Link href={`/tv/${show.id}`}>
                    <TVShowCard show={show} showUserRating />
                  </Link>

                  {(show.review || show.watched_where) && (
                    <div className="bg-[#1E1E1E] border border-[#333333] p-2 rounded text-[10px] text-[#A0A0A0] space-y-1">
                      {show.start_date && (
                        <div className="text-[#00FF66] font-semibold flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{show.start_date}</span>
                        </div>
                      )}
                      {show.review && (
                        <p className="line-clamp-2 italic">&ldquo;{show.review}&rdquo;</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="card bg-[#1E1E1E] border border-[#333333] text-center py-8 px-4">
              <h3 className="text-sm font-bold text-[#EDEDED] mb-1">No TV Shows Found</h3>
              <p className="text-xs text-[#A0A0A0]">
                {isOwnProfile ? 'Search and track TV shows to populate your list.' : `${profile.user.username} has no TV show entries under this filter.`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
