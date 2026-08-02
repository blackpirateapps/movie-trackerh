'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { User, Pagination } from '@/types';
import { Users as UsersIcon, Search, Film, UserPlus, UserCheck, RefreshCw, AlertTriangle } from 'lucide-react';

interface UsersResponse {
  users: User[];
  pagination: Pagination;
}

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false
  });
  const [followingUsers, setFollowingUsers] = useState<Set<number | string>>(new Set());
  const [followLoading, setFollowLoading] = useState<Set<number | string>>(new Set());

  const fetchUsers = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const { data } = await api.get<UsersResponse>(`/api/user?action=list&page=${page}&limit=20&search=${encodeURIComponent(search)}`);
      
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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const loadMore = () => {
    if (pagination.hasMore && !loading) {
      fetchUsers(pagination.page + 1, searchQuery);
    }
  };

  const handleFollow = async (userId: number | string, username: string) => {
    if (!currentUser) return;

    setFollowLoading(prev => new Set(prev).add(userId));
    
    try {
      const isCurrentlyFollowing = followingUsers.has(userId);
      const action = isCurrentlyFollowing ? 'unfollow' : 'follow';
      
      const { data } = await api.post<{ followers: number }>('/api/user', { 
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

      setUsers(prev => prev.map(u => 
        u.id === userId && u.stats
          ? { ...u, stats: { ...u.stats, followers: data.followers } }
          : u
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card-postit text-center max-w-md w-full">
          <div className="w-16 h-16 bg-[#ff4d4d] text-white border-3 border-[#2d2d2d] rounded-full flex items-center justify-center mx-auto mb-4 shadow-[3px_3px_0px_#2d2d2d]">
            <AlertTriangle className="w-8 h-8 stroke-[3]" />
          </div>
          <h2 className="text-3xl font-heading font-bold mb-2">Something went wrong</h2>
          <p className="text-[#2d2d2d]/80 text-lg mb-6">{error}</p>
          <button 
            onClick={() => {
              setError('');
              fetchUsers(1, searchQuery);
            }}
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
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="card mb-8">
          <div className="tape-strip" />
          <h1 className="text-3xl md:text-4xl font-heading font-bold flex items-center gap-3 mb-2">
            <UsersIcon className="w-8 h-8 stroke-[3] text-[#2d5da1]" />
            Movie Enthusiasts Directory
          </h1>
          <p className="text-lg text-[#2d2d2d]/80 mb-6">
            Discover and connect with fellow movie lovers in our community!
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search by username or email..."
              value={searchQuery}
              onChange={handleSearch}
              className="form-input pl-11 py-3 text-lg"
            />
            <Search className="w-5 h-5 stroke-[2.5] text-[#2d2d2d]/50 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Users Grid */}
        {users.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {users.map((userItem, index) => {
                const isFollowing = followingUsers.has(userItem.id);
                const isSelf = currentUser?.username === userItem.username;

                return (
                  <div 
                    key={userItem.id} 
                    className={`card relative text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#2d2d2d] ${
                      index % 2 === 0 ? 'rotate-1' : '-rotate-1'
                    }`}
                  >
                    <div className={index % 2 === 0 ? "thumbtack" : "tape-strip"} />

                    {/* Avatar */}
                    <div className="w-16 h-16 bg-[#ff4d4d] text-white border-3 border-[#2d2d2d] rounded-full flex items-center justify-center font-heading text-2xl font-bold shadow-[3px_3px_0px_#2d2d2d] mx-auto mb-3">
                      {userItem.username.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* Username */}
                    <Link 
                      href={`/profile/${userItem.username}`}
                      className="block hover:text-[#ff4d4d] transition-colors"
                    >
                      <h3 className="text-2xl font-heading font-bold text-[#2d2d2d] leading-tight mb-1">
                        {userItem.username}
                      </h3>
                    </Link>
                    
                    {/* Stats Badges */}
                    {userItem.stats && (
                      <div className="flex items-center justify-center gap-2 text-xs font-bold my-3 flex-wrap">
                        <span className="bg-[#fff9c4] border border-[#2d2d2d] px-2 py-0.5 rounded flex items-center gap-1">
                          <Film className="w-3.5 h-3.5 text-[#2d5da1]" />
                          {userItem.stats.movies} Movies
                        </span>
                        <span className="bg-[#e5e0d8] border border-[#2d2d2d] px-2 py-0.5 rounded flex items-center gap-1">
                          <UsersIcon className="w-3.5 h-3.5 text-[#ff4d4d]" />
                          {userItem.stats.followers} Followers
                        </span>
                      </div>
                    )}

                    <p className="text-xs font-semibold text-[#2d2d2d]/60 mb-4">
                      Member since {userItem.created_at ? new Date(userItem.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                    
                    {/* Actions */}
                    <div className="flex gap-2 justify-center">
                      <Link 
                        href={`/profile/${userItem.username}`}
                        className="btn btn-ghost text-xs py-1.5 px-3 flex-1"
                      >
                        Profile
                      </Link>
                      
                      {currentUser && !isSelf && (
                        <button
                          onClick={() => handleFollow(userItem.id, userItem.username)}
                          disabled={followLoading.has(userItem.id)}
                          className={`btn text-xs py-1.5 px-3 flex-1 flex items-center justify-center gap-1 ${
                            isFollowing ? 'btn-secondary' : 'btn-primary'
                          }`}
                        >
                          {followLoading.has(userItem.id) ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                          ) : (
                            <>
                              {isFollowing ? (
                                <>
                                  <UserCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                                  <span>Following</span>
                                </>
                              ) : (
                                <>
                                  <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                                  <span>Follow</span>
                                </>
                              )}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Button */}
            {pagination.hasMore && (
              <div className="text-center mt-10">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="btn btn-secondary px-8 py-3 text-lg"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-3 border-[#2d2d2d]" />
                  ) : (
                    <>
                      Load More Members
                      <span className="text-[#2d2d2d]/70 text-sm ml-2 font-bold">
                        ({users.length} of {pagination.total})
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="card-postit text-center py-12 px-6">
            <h3 className="text-3xl font-heading font-bold mb-2">
              {loading ? 'Searching members...' : searchQuery ? 'No Users Found' : 'No Community Members Yet'}
            </h3>
            <p className="text-lg text-[#2d2d2d]/80 mb-6 max-w-md mx-auto">
              {searchQuery ? `No users matching "${searchQuery}". Try a different search term.` : 'Be the first to join the community!'}
            </p>
            {searchQuery && !loading && (
              <button
                onClick={() => setSearchQuery('')}
                className="btn btn-primary text-base"
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
