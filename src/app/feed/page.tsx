'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import StarRating from '@/components/StarRating';
import { FeedItem } from '@/types';

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading your feed...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">⚠️</span>
          <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            📺 Your Feed
          </h1>
          <p className="text-gray-400">
            See what your friends are watching and reviewing
          </p>
        </div>

        {feedItems.length > 0 ? (
          <>
            {/* Filter Bar */}
            <div className="card mb-6">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-300">Filter:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`btn text-sm ${
                      filter === 'all' ? 'btn-primary' : 'btn-ghost'
                    }`}
                  >
                    All ({feedItems.length})
                  </button>
                  <button
                    onClick={() => setFilter('reviews')}
                    className={`btn text-sm ${
                      filter === 'reviews' ? 'btn-primary' : 'btn-ghost'
                    }`}
                  >
                    Reviews ({feedItems.filter(item => item.review && item.review.trim().length > 0).length})
                  </button>
                  <button
                    onClick={() => setFilter('ratings')}
                    className={`btn text-sm ${
                      filter === 'ratings' ? 'btn-primary' : 'btn-ghost'
                    }`}
                  >
                    Ratings ({feedItems.filter(item => item.rating > 0).length})
                  </button>
                </div>
              </div>
            </div>

            {/* Feed Items */}
            <div className="space-y-6">
              {filteredItems.map((item, index) => (
                <div key={index} className="card hover:border-gray-700 transition-all duration-300 animate-fade-in">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Link 
                        href={`/profile/${item.username}`} 
                        className="flex items-center gap-3 group"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
                          {item.username ? item.username.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <span className="font-semibold text-white group-hover:text-primary-300 transition-colors">
                            {item.username}
                          </span>
                          <span className="text-gray-400 ml-2">reviewed</span>
                        </div>
                      </Link>
                    </div>
                    <time className="text-sm text-gray-500">
                      {new Date(item.updated_at || item.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </time>
                  </div>

                  {/* Movie Info */}
                  <Link 
                    href={`/movie/${item.movieId || item.movie_id}`} 
                    className="block mb-4 group"
                  >
                    <h3 className="text-xl font-semibold text-primary-400 group-hover:text-primary-300 transition-colors mb-2">
                      {item.movieTitle}
                    </h3>
                  </Link>

                  {/* Rating */}
                  {item.rating > 0 && (
                    <div className="flex items-center gap-4 mb-4">
                      <StarRating rating={item.rating} readOnly size="medium" />
                      <span className="text-sm text-gray-400">
                        Rated {item.rating}/5 stars
                      </span>
                    </div>
                  )}

                  {/* Review */}
                  {item.review && item.review.trim().length > 0 && (
                    <blockquote className="bg-gray-900/30 border-l-4 border-primary-500 pl-4 py-3 rounded-r-lg">
                      <p className="text-gray-300 italic leading-relaxed">
                        &quot;{item.review}&quot;
                      </p>
                    </blockquote>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-800">
                    <Link 
                      href={`/movie/${item.movieId || item.movie_id}`}
                      className="btn btn-ghost text-sm"
                    >
                      <span className="text-base">👁️</span>
                      View Movie
                    </Link>
                    <Link 
                      href={`/profile/${item.username}`}
                      className="btn btn-ghost text-sm"
                    >
                      <span className="text-base">👤</span>
                      View Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className="mb-8">
              <span className="text-8xl block mb-6">🎭</span>
              <h2 className="text-2xl font-bold mb-4 text-gray-300">
                Your feed is empty
              </h2>
              <p className="text-gray-500 max-w-md mx-auto mb-8">
                Follow other movie enthusiasts to see their reviews and ratings in your feed. 
                Discover what others are watching!
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/" className="btn btn-primary">
                <span className="text-lg">🔍</span>
                Discover Movies
              </Link>
              <Link href="/users" className="btn btn-secondary">
                <span className="text-lg">👥</span>
                Find Users to Follow
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
