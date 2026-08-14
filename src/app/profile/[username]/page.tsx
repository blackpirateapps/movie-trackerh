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
  AlertTriangle, Calendar, Edit3, Globe, Clock, Star, Heart, Bookmark, History, BarChart3
} from 'lucide-react';

interface ProfileData {
  user: User;
  movies: Movie[];
  tvShows?: TVShow[];
  top4?: Array<{ id: number; title: string; poster_path?: string | null; type: 'movie' | 'tv' }>;
  recentActivity?: Array<{ id: number; title: string; poster_path?: string | null; rating?: number; review?: string; updated_at: string; type: 'movie' | 'tv' }>;
  watchlist?: Array<{ id: number; title: string; poster_path?: string | null; release_date?: string }>;
  stats: {
    movies: number;
    tv_shows?: number;
    hours_watched?: number;
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

  const [activeTab, setActiveTab] = useState<'overview' | 'movies' | 'tv' | 'watchlist' | 'diary'>('overview');
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
  const top4 = profile.top4 || [];
  const recentActivity = profile.recentActivity || [];
  const watchlist = profile.watchlist || [];

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
      
      {/* 1. User Header Container */}
      <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-6">
        
        {/* Header Top Section with Top-Right Anchored Action Buttons */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-4">
          
          {/* User Details */}
          <div className="flex items-start gap-4">
            {/* Avatar */}
            {profile.user.avatar_url ? (
              <img 
                src={profile.user.avatar_url} 
                alt={profile.user.username}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-[#00FF66] shrink-0"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#00FF66] text-[#121212] rounded-full flex items-center justify-center font-bold text-2xl sm:text-3xl shrink-0">
                {profile.user.username.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-3xl font-bold text-[#EDEDED]">
                  {profile.user.display_name || profile.user.username}
                </h1>
                {profile.user.display_name && (
                  <span className="text-xs font-semibold text-[#A0A0A0]">
                    @{profile.user.username}
                  </span>
                )}
                {isOwnProfile && (
                  <span className="bg-[#121212] border border-[#333333] px-2 py-0.5 rounded text-[10px] font-bold text-[#00FF66]">
                    YOU
                  </span>
                )}
              </div>

              {/* Bio */}
              {profile.user.bio && (
                <p className="text-xs text-[#EDEDED]/90 leading-relaxed max-w-lg font-normal">
                  {profile.user.bio}
                </p>
              )}

              {/* Metadata row: Join Date & Website */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#A0A0A0] pt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#00FF66]" />
                  Member since {profile.user.created_at ? new Date(profile.user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '2026'}
                </span>
                {profile.user.website && (
                  <a 
                    href={profile.user.website.startsWith('http') ? profile.user.website : `https://${profile.user.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[#00FF66] hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{profile.user.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons: Anchored to Top-Right Corner */}
          <div className="shrink-0 flex items-center gap-2 self-start pt-1">
            <Link
              href="/stats"
              className="btn btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <BarChart3 className="w-4 h-4 text-[#00FF66]" />
              <span>Stats</span>
            </Link>
            {isOwnProfile ? (
              <Link 
                href="/settings?tab=profile" 
                className="btn btn-secondary text-xs py-2 px-4 flex items-center gap-1.5"
              >
                <Edit3 className="w-4 h-4 text-[#00FF66]" />
                <span>Edit Profile</span>
              </Link>
            ) : currentUser ? (
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
            ) : null}
          </div>

        </div>

        {/* Flatter Utilitarian Lifetime Stats Counters (No Box-in-Box, Thin Vertical Dividers, Uniform Neon Green Numbers) */}
        <div className="grid grid-cols-3 pt-5 border-t border-[#333333] divide-x divide-[#333333]">
          <div className="px-2 text-center">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#A0A0A0] block mb-0.5">Films</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#00FF66]">{profile.stats.movies}</span>
          </div>

          <div className="px-2 text-center">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#A0A0A0] block mb-0.5">TV Series</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#00FF66]">{profile.stats.tv_shows || 0}</span>
          </div>

          <div className="px-2 text-center">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#A0A0A0] block mb-0.5">Hours Watched</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#00FF66]">{profile.stats.hours_watched || 0}h</span>
          </div>
        </div>

      </div>

      {/* Navigation Sub-Tabs (Clean Non-Heavy Tabs) */}
      <div className="card bg-[#1E1E1E] border border-[#333333] p-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('overview')}
              className={`text-xs font-bold py-1.5 px-3.5 rounded transition-all uppercase tracking-wider ${
                activeTab === 'overview' 
                  ? 'bg-[#121212] text-[#00FF66] border border-[#00FF66]/40 shadow-sm' 
                  : 'text-[#A0A0A0] hover:text-[#EDEDED] hover:bg-[#121212]/50'
              }`}
            >
              <span>SHOWCASE</span>
            </button>

            <button
              onClick={() => setActiveTab('diary')}
              className={`text-xs font-bold py-1.5 px-3.5 rounded transition-all uppercase tracking-wider flex items-center gap-1.5 ${
                activeTab === 'diary' 
                  ? 'bg-[#121212] text-[#00FF66] border border-[#00FF66]/40 shadow-sm' 
                  : 'text-[#A0A0A0] hover:text-[#EDEDED] hover:bg-[#121212]/50'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Diary</span>
            </button>

            <button
              onClick={() => setActiveTab('movies')}
              className={`text-xs font-bold py-1.5 px-3.5 rounded transition-all uppercase tracking-wider flex items-center gap-1.5 ${
                activeTab === 'movies' 
                  ? 'bg-[#121212] text-[#00FF66] border border-[#00FF66]/40 shadow-sm' 
                  : 'text-[#A0A0A0] hover:text-[#EDEDED] hover:bg-[#121212]/50'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Films ({profile.movies.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('tv')}
              className={`text-xs font-bold py-1.5 px-3.5 rounded transition-all uppercase tracking-wider flex items-center gap-1.5 ${
                activeTab === 'tv' 
                  ? 'bg-[#121212] text-[#00FF66] border border-[#00FF66]/40 shadow-sm' 
                  : 'text-[#A0A0A0] hover:text-[#EDEDED] hover:bg-[#121212]/50'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>TV ({tvShows.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('watchlist')}
              className={`text-xs font-bold py-1.5 px-3.5 rounded transition-all uppercase tracking-wider flex items-center gap-1.5 ${
                activeTab === 'watchlist' 
                  ? 'bg-[#121212] text-[#00FF66] border border-[#00FF66]/40 shadow-sm' 
                  : 'text-[#A0A0A0] hover:text-[#EDEDED] hover:bg-[#121212]/50'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Watchlist ({watchlist.length})</span>
            </button>
          </div>

          {/* Sub filters when viewing movies/tv */}
          {(activeTab === 'movies' || activeTab === 'tv') && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilter('all')}
                className={`text-[11px] font-bold py-1 px-2.5 rounded transition-all ${
                  filter === 'all' ? 'bg-[#121212] text-[#00FF66] border border-[#00FF66]/40' : 'text-[#A0A0A0] hover:text-[#EDEDED]'
                }`}
              >
                All
              </button>
              {activeTab === 'tv' && (
                <button
                  onClick={() => setFilter('favorites')}
                  className={`text-[11px] font-bold py-1 px-2.5 rounded transition-all ${
                    filter === 'favorites' ? 'bg-[#121212] text-[#00FF66] border border-[#00FF66]/40' : 'text-[#A0A0A0] hover:text-[#EDEDED]'
                  }`}
                >
                  Favorites
                </button>
              )}
              <button
                onClick={() => setFilter('rated')}
                className={`text-[11px] font-bold py-1 px-2.5 rounded transition-all ${
                  filter === 'rated' ? 'bg-[#121212] text-[#00FF66] border border-[#00FF66]/40' : 'text-[#A0A0A0] hover:text-[#EDEDED]'
                }`}
              >
                Rated
              </button>
              <button
                onClick={() => setFilter('reviewed')}
                className={`text-[11px] font-bold py-1 px-2.5 rounded transition-all ${
                  filter === 'reviewed' ? 'bg-[#121212] text-[#00FF66] border border-[#00FF66]/40' : 'text-[#A0A0A0] hover:text-[#EDEDED]'
                }`}
              >
                Reviewed
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab 1: Overview Showcase (Top 4 & Recent Activity) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* The "Top 4" (Favorites) with Strict Physical Media Aspect 2/3 Framing */}
          <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#00FF66] flex items-center gap-2">
              <Heart className="w-4 h-4 text-[#00FF66] fill-[#00FF66]" />
              THE TOP 4 (FAVORITE RELEASES)
            </h2>

            {top4.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {top4.map((item) => (
                  <Link key={`${item.type}-${item.id}`} href={`/${item.type}/${item.id}`}>
                    <div className="relative aspect-[2/3] overflow-hidden rounded border border-[#333333] bg-[#2A2A2A] group cursor-pointer shadow-md">
                      {item.poster_path ? (
                        <img 
                          src={`https://image.tmdb.org/t/p/w342${item.poster_path}`} 
                          alt={item.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-2 text-center text-[#A0A0A0] text-[10px]">
                          {item.title}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-[#121212]/80 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex items-end">
                        <span className="text-[11px] font-bold text-[#00FF66] line-clamp-2">{item.title}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#A0A0A0] italic">
                {isOwnProfile ? 'Mark films or TV shows as favorites to highlight your Top 4 here!' : 'No favorites selected yet.'}
              </p>
            )}
          </div>

          {/* Recent Activity */}
          <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#EDEDED] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#00FF66]" />
              RECENT LOGS & REVIEWS
            </h2>

            {recentActivity.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4">
                {recentActivity.map((item) => (
                  <Link key={`${item.type}-${item.id}`} href={`/${item.type}/${item.id}`}>
                    <div className="group cursor-pointer space-y-1">
                      <div className="relative aspect-[2/3] overflow-hidden rounded border border-[#333333] bg-[#2A2A2A]">
                        {item.poster_path ? (
                          <img 
                            src={`https://image.tmdb.org/t/p/w342${item.poster_path}`} 
                            alt={item.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#A0A0A0] text-[10px] p-2 text-center">
                            {item.title}
                          </div>
                        )}
                        {item.rating && (
                          <div className="absolute top-1 right-1 z-10 bg-[#121212]/90 text-[#00FF66] border border-[#333333] px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-[#00FF66]" />
                            <span>{item.rating}</span>
                          </div>
                        )}
                      </div>
                      <h4 className="text-[11px] font-bold text-[#EDEDED] line-clamp-1 group-hover:text-[#00FF66] transition-colors">
                        {item.title}
                      </h4>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#A0A0A0] italic">No recent logging activity.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Diary */}
      {activeTab === 'diary' && (
        <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#00FF66] flex items-center gap-2">
            <History className="w-4 h-4 text-[#00FF66]" />
            CHRONOLOGICAL WATCH DIARY
          </h3>

          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((item, index) => (
                <div key={index} className="bg-[#121212] border border-[#333333] p-3 rounded flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-14 aspect-[2/3] overflow-hidden rounded border border-[#333333] bg-[#2A2A2A] shrink-0">
                      {item.poster_path && (
                        <img 
                          src={`https://image.tmdb.org/t/p/w154${item.poster_path}`} 
                          alt={item.title} 
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover" 
                        />
                      )}
                    </div>
                    <div>
                      <Link href={`/${item.type}/${item.id}`} className="font-bold text-sm text-[#EDEDED] hover:text-[#00FF66] transition-colors">
                        {item.title}
                      </Link>
                      <span className="text-[10px] text-[#A0A0A0] block uppercase font-semibold">
                        Logged on {new Date(item.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {item.rating && (
                    <div className="bg-[#1E1E1E] border border-[#333333] px-2 py-1 rounded text-xs font-bold text-[#00FF66] flex items-center gap-1">
                      <Star className="w-3 h-3 fill-[#00FF66]" />
                      <span>{item.rating}/10</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#A0A0A0] italic">Diary is currently empty.</p>
          )}
        </div>
      )}

      {/* Tab 3: Films Grid */}
      {activeTab === 'movies' && (
        <div>
          {filteredMovies.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
              {filteredMovies.map(movie => (
                <div key={movie.id} className="space-y-1">
                  <Link href={`/movie/${movie.id}`}>
                    <MovieCard movie={movie} showUserRating />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="card bg-[#1E1E1E] border border-[#333333] text-center py-8 px-4">
              <p className="text-xs text-[#A0A0A0]">No movie entries found under this filter.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: TV Shows Grid */}
      {activeTab === 'tv' && (
        <div>
          {filteredTvShows.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
              {filteredTvShows.map(show => (
                <div key={show.id} className="space-y-1">
                  <Link href={`/tv/${show.id}`}>
                    <TVShowCard show={show} showUserRating />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="card bg-[#1E1E1E] border border-[#333333] text-center py-8 px-4">
              <p className="text-xs text-[#A0A0A0]">No TV show entries found under this filter.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Watchlist */}
      {activeTab === 'watchlist' && (
        <div>
          {watchlist.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
              {watchlist.map(movie => (
                <Link key={movie.id} href={`/movie/${movie.id}`}>
                  <MovieCard movie={movie as Movie} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="card bg-[#1E1E1E] border border-[#333333] text-center py-8 px-4">
              <p className="text-xs text-[#A0A0A0]">Watchlist is currently empty.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
