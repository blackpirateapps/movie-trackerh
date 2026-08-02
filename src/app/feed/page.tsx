'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import StarRating from '@/components/StarRating';
import { FeedItem } from '@/types';
import { Rss, Filter, Film, User, Eye, AlertTriangle, RefreshCw } from 'lucide-react';

export default function Feed() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'reviews' | 'ratings'>('all');

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
    if (filter === 'reviews') return item.review && item.review.trim().length > 0;
    if (filter === 'ratings') return item.rating > 0;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card text-center max-w-sm w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-[#ff4d4d] mx-auto mb-4" />
          <p className="font-bold text-xl text-[#2d2d2d]">Loading your movie feed...</p>
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
          <h2 className="text-3xl font-heading font-bold mb-2">Something went wrong</h2>
          <p className="text-[#2d2d2d]/80 text-lg mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-primary flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4 stroke-[3]" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="card mb-8">
          <div className="tape-strip" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-heading font-bold flex items-center gap-3">
                <Rss className="w-8 h-8 stroke-[3] text-[#ff4d4d]" />
                Community Activity Feed
              </h1>
              <p className="text-lg text-[#2d2d2d]/80 mt-1">
                See what your friends and fellow movie lovers are watching and reviewing!
              </p>
            </div>
            
            <span className="bg-[#fff9c4] border-2 border-[#2d2d2d] rounded-[255px_15px_225px_15px/15px_225px_15px_255px] px-3 py-1 font-bold text-sm shadow-[2px_2px_0px_#2d2d2d] rotate-2">
              📌 Live Stream
            </span>
          </div>
        </div>

        {feedItems.length > 0 ? (
          <>
            {/* Filter Bar */}
            <div className="card mb-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 font-bold text-lg">
                  <Filter className="w-5 h-5 stroke-[2.5] text-[#2d5da1]" />
                  <span>Filter Feed:</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`btn text-sm py-1.5 px-4 ${
                      filter === 'all' ? 'btn-primary' : 'btn-ghost'
                    }`}
                  >
                    All ({feedItems.length})
                  </button>
                  <button
                    onClick={() => setFilter('reviews')}
                    className={`btn text-sm py-1.5 px-4 ${
                      filter === 'reviews' ? 'btn-primary' : 'btn-ghost'
                    }`}
                  >
                    Reviews ({feedItems.filter(item => item.review && item.review.trim().length > 0).length})
                  </button>
                  <button
                    onClick={() => setFilter('ratings')}
                    className={`btn text-sm py-1.5 px-4 ${
                      filter === 'ratings' ? 'btn-primary' : 'btn-ghost'
                    }`}
                  >
                    Ratings ({feedItems.filter(item => item.rating > 0).length})
                  </button>
                </div>
              </div>
            </div>

            {/* Feed Items */}
            <div className="space-y-8">
              {filteredItems.map((item, index) => (
                <div 
                  key={index} 
                  className={`card relative transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#2d2d2d] ${
                    index % 2 === 0 ? '-rotate-1' : 'rotate-1'
                  }`}
                >
                  <div className={index % 2 === 0 ? "tape-strip" : "thumbtack"} />

                  {/* Feed Item Header */}
                  <div className="flex items-center justify-between mb-4 border-b-2 border-dashed border-[#2d2d2d]/30 pb-3">
                    <Link 
                      href={`/profile/${item.username}`} 
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-11 h-11 bg-[#ff4d4d] text-white border-2 border-[#2d2d2d] rounded-full flex items-center justify-center font-heading text-lg font-bold shadow-[2px_2px_0px_#2d2d2d] group-hover:scale-110 transition-transform">
                        {item.username ? item.username.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <span className="font-heading font-bold text-xl text-[#2d2d2d] group-hover:text-[#ff4d4d] transition-colors">
                          {item.username}
                        </span>
                        <span className="text-[#2d2d2d]/70 text-sm ml-2 font-semibold">
                          reviewed a movie
                        </span>
                      </div>
                    </Link>

                    <time className="text-xs font-bold bg-[#e5e0d8] border border-[#2d2d2d] px-2.5 py-1 rounded-full">
                      {new Date(item.updated_at || item.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </time>
                  </div>

                  {/* Movie Title Link */}
                  <Link 
                    href={`/movie/${item.movieId || item.movie_id}`} 
                    className="inline-block mb-3 group"
                  >
                    <h3 className="text-2xl font-heading font-bold text-[#2d5da1] group-hover:text-[#ff4d4d] transition-colors underline decoration-wavy decoration-[#ff4d4d]/40">
                      {item.movieTitle}
                    </h3>
                  </Link>

                  {/* Rating */}
                  {item.rating > 0 && (
                    <div className="flex items-center gap-3 mb-4">
                      <StarRating rating={item.rating} readOnly size="medium" />
                      <span className="font-bold text-sm bg-[#fff9c4] border border-[#2d2d2d] px-2 py-0.5 rounded">
                        Rated {item.rating}/5 Stars
                      </span>
                    </div>
                  )}

                  {/* Review Text in Hand-drawn Quote Box */}
                  {item.review && item.review.trim().length > 0 && (
                    <div className="bg-[#fdfbf7] border-3 border-[#2d2d2d] p-4 rounded-[15px_225px_15px_255px/255px_15px_225px_15px] shadow-[3px_3px_0px_#2d2d2d] mb-4 relative">
                      <p className="text-xl text-[#2d2d2d] font-body leading-relaxed italic">
                        &ldquo;{item.review}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <Link 
                      href={`/movie/${item.movieId || item.movie_id}`}
                      className="btn btn-secondary text-sm flex items-center gap-1.5"
                    >
                      <Eye className="w-4 h-4 stroke-[2.5]" />
                      <span>View Movie</span>
                    </Link>
                    <Link 
                      href={`/profile/${item.username}`}
                      className="btn btn-ghost text-sm flex items-center gap-1.5"
                    >
                      <User className="w-4 h-4 stroke-[2.5]" />
                      <span>View Profile</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="card-postit text-center py-12 px-6">
            <div className="w-20 h-20 bg-[#2d5da1] text-white border-3 border-[#2d2d2d] rounded-full flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_#2d2d2d] -rotate-6">
              <Film className="w-10 h-10 stroke-[2.5]" />
            </div>

            <h2 className="text-3xl font-heading font-bold mb-3 text-[#2d2d2d]">
              Your Feed is Empty!
            </h2>
            <p className="text-xl text-[#2d2d2d]/80 max-w-md mx-auto mb-8 leading-relaxed">
              Follow other movie enthusiasts to see their latest movie reviews and ratings here.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/" className="btn btn-primary text-lg">
                Discover Movies
              </Link>
              <Link href="/users" className="btn btn-secondary text-lg">
                Find People to Follow
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
