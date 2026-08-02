'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import MovieCard from '@/components/MovieCard';
import TVShowCard from '@/components/TVShowCard';
import StarRating from '@/components/StarRating';
import { User, Movie, TVShow } from '@/types';
import { 
  Film, Tv, Star, MessageSquare, Users, UserPlus, UserCheck, 
  Filter, Clock, AlertTriangle, Heart, Calendar, Tag
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
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Profile Header */}
        <div className="card relative">
          <div className="tape-strip" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
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
                    {profile.movies.length} Movies
                  </span>
                  <span className="bg-[#e5e0d8] border border-[#2d2d2d] px-3 py-1 rounded-full shadow-[2px_2px_0px_#2d2d2d] flex items-center gap-1.5">
                    <Tv className="w-4 h-4 text-[#ff4d4d]" />
                    {tvShows.length} TV Shows
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

        {/* Collection Type Tabs (Movies vs TV Shows) */}
        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('movies')}
                className={`btn text-lg py-2 px-5 flex items-center gap-2 border-3 ${
                  activeTab === 'movies'
                    ? 'bg-[#ff4d4d] text-white border-[#2d2d2d] shadow-[3px_3px_0px_#2d2d2d]'
                    : 'bg-white text-[#2d2d2d] border-[#2d2d2d]'
                }`}
              >
                <Film className="w-5 h-5 stroke-[2.5]" />
                <span>Movies ({profile.movies.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('tv')}
                className={`btn text-lg py-2 px-5 flex items-center gap-2 border-3 ${
                  activeTab === 'tv'
                    ? 'bg-[#2d5da1] text-white border-[#2d2d2d] shadow-[3px_3px_0px_#2d2d2d]'
                    : 'bg-white text-[#2d2d2d] border-[#2d2d2d]'
                }`}
              >
                <Tv className="w-5 h-5 stroke-[2.5]" />
                <span>TV Shows ({tvShows.length})</span>
              </button>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`btn text-xs py-1.5 px-3 ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
              >
                All
              </button>
              {activeTab === 'tv' && (
                <button
                  onClick={() => setFilter('favorites')}
                  className={`btn text-xs py-1.5 px-3 ${filter === 'favorites' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  Favorites ❤️
                </button>
              )}
              <button
                onClick={() => setFilter('rated')}
                className={`btn text-xs py-1.5 px-3 ${filter === 'rated' ? 'btn-primary' : 'btn-ghost'}`}
              >
                Rated ⭐
              </button>
              <button
                onClick={() => setFilter('reviewed')}
                className={`btn text-xs py-1.5 px-3 ${filter === 'reviewed' ? 'btn-primary' : 'btn-ghost'}`}
              >
                Reviewed 📝
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {activeTab === 'movies' ? (
          <div>
            {filteredMovies.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filteredMovies.map(movie => (
                  <div key={movie.id} className="space-y-2">
                    <Link href={`/movie/${movie.id}`}>
                      <MovieCard movie={movie} showUserRating />
                    </Link>

                    {(movie.review || movie.watched_date) && (
                      <div className="bg-white border-2 border-[#2d2d2d] p-3 rounded-[15px_225px_15px_255px/255px_15px_225px_15px] shadow-[3px_3px_0px_#2d2d2d] text-xs font-semibold">
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
            ) : (
              <div className="card-postit text-center py-12 px-6">
                <h3 className="text-3xl font-heading font-bold mb-2">No Movies Found</h3>
                <p className="text-lg text-[#2d2d2d]/80 mb-6">
                  {isOwnProfile ? 'Start searching and rating movies to add them here!' : `${profile.user.username} has no movie entries under this filter.`}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div>
            {filteredTvShows.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filteredTvShows.map(show => (
                  <div key={show.id} className="space-y-2">
                    <Link href={`/tv/${show.id}`}>
                      <TVShowCard show={show} showUserRating />
                    </Link>

                    {/* TV Show Review & Details Card */}
                    <div className="bg-white border-2 border-[#2d2d2d] p-3 rounded-[15px_225px_15px_255px/255px_15px_225px_15px] shadow-[3px_3px_0px_#2d2d2d] text-xs font-semibold space-y-1">
                      {show.start_date && (
                        <div className="text-[#2d5da1] font-bold flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>{show.start_date} {show.end_date ? `to ${show.end_date}` : '(Ongoing)'}</span>
                        </div>
                      )}

                      {show.watched_where && show.watched_where.length > 0 && (
                        <div className="flex flex-wrap gap-1 my-1">
                          {show.watched_where.map((tag, i) => (
                            <span key={i} className="bg-[#fff9c4] border border-[#2d2d2d] px-1.5 py-0.2 rounded text-[10px] font-bold">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {show.review && (
                        <p className="text-[#2d2d2d]/80 font-body text-sm line-clamp-2 italic">
                          &ldquo;{show.review}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card-postit text-center py-12 px-6">
                <h3 className="text-3xl font-heading font-bold mb-2">No TV Shows Found</h3>
                <p className="text-lg text-[#2d2d2d]/80 mb-6">
                  {isOwnProfile ? 'Start searching and tracking TV shows!' : `${profile.user.username} has no TV show entries under this filter.`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
