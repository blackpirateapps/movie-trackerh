'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import StarRating from '@/components/StarRating';
import { FeedItem } from '@/types';
import { Rss, Film, Tv, User, Eye, AlertTriangle, RefreshCw } from 'lucide-react';

export default function Feed() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'movies' | 'tv' | 'reviews'>('all');

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const { data } = await api.get<FeedItem[]>('/api/user?action=feed');
        setFeedItems(Array.isArray(data) ? data : []);
      } catch (err) {
        setError('Failed to load your feed.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []);

  const filteredItems = feedItems.filter(item => {
    if (filter === 'movies') return item.type === 'movie' || item.movieId;
    if (filter === 'tv') return item.type === 'tv' || item.tvShowId;
    if (filter === 'reviews') return item.review && item.review.trim().length > 0;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#121212]">
        <div className="card text-center max-w-sm w-full bg-[#1E1E1E] border border-[#333333] p-6 rounded">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00FF66] border-t-transparent mx-auto mb-3" />
          <p className="font-bold text-sm text-[#EDEDED]">Loading activity feed...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#121212]">
        <div className="card text-center max-w-md w-full bg-[#1E1E1E] border border-[#333333] p-6 rounded space-y-3">
          <div className="w-12 h-12 bg-[#ff4d4d]/10 text-[#ff4d4d] border border-[#ff4d4d]/30 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-[#EDEDED]">Something went wrong</h2>
          <p className="text-xs text-[#A0A0A0]">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5 mx-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6 bg-[#121212] text-[#EDEDED]">
      {/* Header Card */}
      <div className="card bg-[#1E1E1E] border border-[#333333] p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-[#EDEDED]">
              <Rss className="w-5 h-5 text-[#00FF66]" />
              Community Activity Stream
            </h1>
            <p className="text-xs text-[#A0A0A0] mt-1">
              Latest reviews and logging activity from users you follow.
            </p>
          </div>
          
          <span className="bg-[#121212] border border-[#333333] text-[#00FF66] px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
            LIVE FEED
          </span>
        </div>
      </div>

      {feedItems.length > 0 ? (
        <>
          {/* Filter Bar */}
          <div className="card bg-[#1E1E1E] border border-[#333333] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-widest text-[#A0A0A0]">Filter Stream:</span>
              
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setFilter('all')}
                  className={`btn text-xs py-1 px-3 ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  All ({feedItems.length})
                </button>
                <button
                  onClick={() => setFilter('movies')}
                  className={`btn text-xs py-1 px-3 ${filter === 'movies' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  Movies
                </button>
                <button
                  onClick={() => setFilter('tv')}
                  className={`btn text-xs py-1 px-3 ${filter === 'tv' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  TV Shows
                </button>
                <button
                  onClick={() => setFilter('reviews')}
                  className={`btn text-xs py-1 px-3 ${filter === 'reviews' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  Reviews
                </button>
              </div>
            </div>
          </div>

          {/* Feed Items */}
          <div className="space-y-4">
            {filteredItems.map((item, index) => {
              const isTv = item.type === 'tv' || item.tvShowId || item.tv_show_id;
              const title = isTv ? (item.tvShowName || 'TV Show') : (item.movieTitle || 'Movie');
              const linkHref = isTv ? `/tv/${item.tvShowId || item.tv_show_id}` : `/movie/${item.movieId || item.movie_id}`;

              return (
                <div 
                  key={index} 
                  className="card bg-[#1E1E1E] border border-[#333333] p-5 rounded space-y-3"
                >
                  {/* Feed Item Header */}
                  <div className="flex items-center justify-between border-b border-[#333333] pb-3">
                    <Link 
                      href={`/profile/${item.username}`} 
                      className="flex items-center gap-2.5 group"
                    >
                      <div className="w-8 h-8 bg-[#00FF66] text-[#121212] rounded-full flex items-center justify-center text-xs font-bold">
                        {item.username ? item.username.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <span className="font-bold text-sm text-[#EDEDED] group-hover:text-[#00FF66] transition-colors">
                          {item.username}
                        </span>
                        <span className="text-[#A0A0A0] text-xs ml-1.5">
                          {isTv ? 'logged a TV Show' : 'logged a movie'}
                        </span>
                      </div>
                    </Link>

                    <time className="text-[10px] text-[#A0A0A0] font-medium bg-[#121212] border border-[#333333] px-2 py-0.5 rounded">
                      {new Date(item.updated_at || item.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </time>
                  </div>

                  {/* Title Link */}
                  <Link 
                    href={linkHref} 
                    className="inline-flex items-center gap-2 group"
                  >
                    {isTv ? (
                      <Tv className="w-4 h-4 text-[#00FF66]" />
                    ) : (
                      <Film className="w-4 h-4 text-[#00FF66]" />
                    )}
                    <h3 className="text-base font-bold text-[#EDEDED] group-hover:text-[#00FF66] transition-colors">
                      {title}
                    </h3>
                  </Link>

                  {/* Rating */}
                  {item.rating > 0 && (
                    <div className="flex items-center gap-2">
                      <StarRating rating={item.rating} maxStars={10} readOnly size="small" />
                    </div>
                  )}

                  {/* Review Text */}
                  {item.review && item.review.trim().length > 0 && (
                    <div className="bg-[#121212] border border-[#333333] p-3 rounded text-xs text-[#EDEDED]/90 italic">
                      &ldquo;{item.review}&rdquo;
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <Link 
                      href={linkHref}
                      className="btn btn-secondary text-xs py-1 px-3 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#00FF66]" />
                      <span>Details</span>
                    </Link>
                    <Link 
                      href={`/profile/${item.username}`}
                      className="btn btn-ghost text-xs py-1 px-3 flex items-center gap-1"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Profile</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="card bg-[#1E1E1E] border border-[#333333] text-center py-10 px-6">
          <h2 className="text-base font-bold text-[#EDEDED] mb-2">
            Your Feed is Empty
          </h2>
          <p className="text-xs text-[#A0A0A0] max-w-md mx-auto mb-4">
            Follow other community members to view their movie and TV logs.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/" className="btn btn-primary text-xs py-2 px-4">
              Discover Content
            </Link>
            <Link href="/users" className="btn btn-secondary text-xs py-2 px-4">
              Explore Community
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
