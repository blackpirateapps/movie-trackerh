'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false
  });
  const [followingUsers, setFollowingUsers] = useState(new Set());
  const [followLoading, setFollowLoading] = useState(new Set());

  const fetchUsers = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/user?action=list&page=${page}&limit=20&search=${encodeURIComponent(search)}`);
      
      if (page === 1) {
        setUsers(data.users);
      } else {
        setUsers(prev => [...prev, ...data.users]);
      }
      
      setPagination(data.pagination);
    } catch (err) {
      setError('Failed to fetch users.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1, searchQuery);
  }, [searchQuery]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const loadMore = () => {
    if (pagination.hasMore && !loading) {
      fetchUsers(pagination.page + 1, searchQuery);
    }
  };

  const handleFollow = async (userId, username) => {
    if (!currentUser) return;

    setFollowLoading(prev => new Set(prev.add(userId)));
    
    try {
      const isCurrentlyFollowing = followingUsers.has(userId);
      const action = isCurrentlyFollowing ? 'unfollow' : 'follow';
      
      const { data } = await api.post('/api/user', { 
        action, 
        followingId: userId 
      });

      setFollowingUsers(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyFollowing) {
          newSet.delete(userId);
        } else {
          newSet.add(userId);
        }
        return newSet;
      });

      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, stats: { ...user.stats, followers: data.followers } }
          : user
      ));

    } catch (err) {
      console.error('Follow/unfollow failed:', err);
    } finally {
      setFollowLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">😔</span>
          <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button 
            onClick={() => {
              setError('');
              fetchUsers(1, searchQuery);
            }}
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 flex items-center gap-3">
            👥 Movie Enthusiasts
          </h1>
          <p className="text-slate-400 mb-6">
            Discover and connect with other movie lovers in our community
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search users by username or email..."
              value={searchQuery}
              onChange={handleSearch}
              className="form-input pl-10"
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
              🔍
            </span>
          </div>
        </div>

        {/* Users Grid */}
        {users.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {users.map(user => (
                <div key={user.id} className="card group hover:border-slate-700 transition-all duration-300">
                  <div className="text-center">
                    {/* Avatar */}
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg mx-auto mb-4 ring-4 ring-primary-500/20 group-hover:ring-primary-500/30 transition-all">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* User Info */}
                    <Link 
                      href={`/profile/${user.username}`}
                      className="block hover:text-primary-400 transition-colors"
                    >
                      <h3 className="text-lg font-semibold mb-2">{user.username}</h3>
                    </Link>
                    
                    {/* Stats */}
                    <div className="flex items-center justify-center gap-4 text-sm text-slate-400 mb-4">
                      <div className="flex items-center gap-1">
                        <span className="text-primary-400">🎬</span>
                        <span className="font-semibold text-white">{user.stats.movies}</span>
                        <span>Movies</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-pink-400">👥</span>
                        <span className="font-semibold text-white">{user.stats.followers}</span>
                        <span>Followers</span>
                      </div>
                    </div>

                    {/* Member Since */}
                    <p className="text-xs text-slate-500 mb-4">
                      Member since {new Date(user.created_at).toLocaleDateString()}
                    </p>
                    
                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link 
                        href={`/profile/${user.username}`}
                        className="btn btn-ghost flex-1 text-sm"
                      >
                        View Profile
                      </Link>
                      
                      {currentUser && currentUser.username !== user.username && (
                        <button
                          onClick={() => handleFollow(user.id, user.username)}
                          disabled={followLoading.has(user.id)}
                          className={`btn text-sm ${
                            followingUsers.has(user.id) 
                              ? 'btn-secondary hover:border-red-500 hover:text-red-400' 
                              : 'btn-primary'
                          }`}
                        >
                          {followLoading.has(user.id) ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                          ) : (
                            <>
                              <span className="text-sm">
                                {followingUsers.has(user.id) ? '✓' : '+'}
                              </span>
                              {followingUsers.has(user.id) ? 'Following' : 'Follow'}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {pagination.hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="btn btn-secondary px-8"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More
                      <span className="text-slate-400 ml-2">
                        ({users.length} of {pagination.total})
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Pagination Info */}
            <div className="text-center mt-6 text-sm text-slate-500">
              Showing {users.length} of {pagination.total} users
              {searchQuery && (
                <span className="ml-2">
                  for &quot;{searchQuery}&quot;
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <span className="text-6xl block mb-4">
              {loading ? '⏳' : searchQuery ? '🔍' : '👥'}
            </span>
            <h3 className="text-xl font-semibold mb-2 text-slate-300">
              {loading ? 'Loading users...' : 
               searchQuery ? 'No users found' : 
               'No users yet'}
            </h3>
            <p className="text-slate-500 max-w-md mx-auto">
              {loading ? 'Please wait while we fetch the community members.' :
               searchQuery ? `No users found matching "${searchQuery}". Try a different search term.` :
               'Be the first to join our movie community!'}
            </p>
            {searchQuery && !loading && (
              <button
                onClick={() => setSearchQuery('')}
                className="btn btn-primary mt-4"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
