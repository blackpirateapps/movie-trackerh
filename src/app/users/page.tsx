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
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#121212]">
        <div className="card text-center max-w-md w-full bg-[#1E1E1E] border border-[#333333] p-6 rounded space-y-3">
          <div className="w-12 h-12 bg-[#ff4d4d]/10 text-[#ff4d4d] border border-[#ff4d4d]/30 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-[#EDEDED]">Something went wrong</h2>
          <p className="text-xs text-[#A0A0A0]">{error}</p>
          <button 
            onClick={() => {
              setError('');
              fetchUsers(1, searchQuery);
            }}
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
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6 bg-[#121212] text-[#EDEDED]">
      {/* Header */}
      <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-[#EDEDED]">
            <UsersIcon className="w-5 h-5 text-[#00FF66]" />
            Community Directory
          </h1>
          <p className="text-xs text-[#A0A0A0] mt-1">
            Browse and connect with media tracking enthusiasts.
          </p>
        </div>
        
        {/* Search Input */}
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search username or email..."
            value={searchQuery}
            onChange={handleSearch}
            className="form-input text-xs py-2 pl-9 pr-4"
          />
          <Search className="w-4 h-4 text-[#A0A0A0] absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Users Grid */}
      {users.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {users.map((userItem) => {
              const isFollowing = followingUsers.has(userItem.id);
              const isSelf = currentUser?.username === userItem.username;

              return (
                <div 
                  key={userItem.id} 
                  className="card bg-[#1E1E1E] border border-[#333333] p-4 rounded text-center space-y-3"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-[#00FF66] text-[#121212] rounded-full flex items-center justify-center font-bold text-lg mx-auto">
                    {userItem.username.charAt(0).toUpperCase()}
                  </div>
                  
                  {/* Username */}
                  <Link 
                    href={`/profile/${userItem.username}`}
                    className="block hover:text-[#00FF66] transition-colors"
                  >
                    <h3 className="text-sm font-bold text-[#EDEDED] line-clamp-1">
                      {userItem.username}
                    </h3>
                  </Link>
                  
                  {/* Stats Badges */}
                  {userItem.stats && (
                    <div className="flex items-center justify-center gap-2 text-[10px] font-semibold text-[#A0A0A0]">
                      <span className="bg-[#121212] border border-[#333333] px-2 py-0.5 rounded flex items-center gap-1">
                        <Film className="w-3 h-3 text-[#00FF66]" />
                        {userItem.stats.movies}
                      </span>
                      <span className="bg-[#121212] border border-[#333333] px-2 py-0.5 rounded flex items-center gap-1">
                        <UsersIcon className="w-3 h-3 text-[#00FF66]" />
                        {userItem.stats.followers}
                      </span>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
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
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent" />
                        ) : (
                          <>
                            {isFollowing ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Following</span>
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3.5 h-3.5" />
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

          {/* Load More */}
          {pagination.hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={loadMore}
                disabled={loading}
                className="btn btn-secondary text-xs py-2 px-6"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mx-auto" />
                ) : (
                  <span>Load More ({users.length} of {pagination.total})</span>
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="card bg-[#1E1E1E] border border-[#333333] text-center py-8 px-4">
          <h3 className="text-sm font-bold text-[#EDEDED] mb-1">
            {loading ? 'Searching members...' : searchQuery ? 'No Users Found' : 'No Community Members Yet'}
          </h3>
          <p className="text-xs text-[#A0A0A0] mb-4">
            {searchQuery ? `No users matching "${searchQuery}".` : 'Be the first to join.'}
          </p>
          {searchQuery && !loading && (
            <button
              onClick={() => setSearchQuery('')}
              className="btn btn-primary text-xs py-1.5 px-4"
            >
              Clear Search
            </button>
          )}
        </div>
      )}
    </div>
  );
}
