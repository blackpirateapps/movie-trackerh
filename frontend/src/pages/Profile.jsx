import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import MovieCard from '../components/MovieCard';
import StarRating from '../components/StarRating';

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/user?username=${username}`);
      setProfile(data);
    } catch (err) {
      setError('User not found.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const handleFollow = async () => {
    setActionLoading(true);
    try {
      await api.post(`/api/user?action=follow`, { followingId: profile.user.id });
      setProfile(prev => ({ 
        ...prev, 
        isFollowing: true 
      }));
    } catch (err) {
      console.error('Follow failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfollow = async () => {
    setActionLoading(true);
    try {
      await api.post(`/api/user?action=unfollow`, { followingId: profile.user.id });
      setProfile(prev => ({ 
        ...prev, 
        isFollowing: false 
      }));
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
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">😔</span>
          <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link to="/" className="btn btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.username === profile.user.username;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="card mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-2xl md:text-3xl font-bold shadow-xl">
                {profile.user.username.charAt(0).toUpperCase()}
              </div>
              
              {/* User Info */}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  {profile.user.username}
                  {isOwnProfile && <span className="text-primary-400 ml-2">(You)</span>}
                </h1>
                
                {/* Stats */}
                <div className="flex items-center gap-6 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <span className="text-primary-400">🎬</span>
                    <span className="font-semibold text-white">{profile.movies.length}</span>
                    <span>Movies</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-primary-400">👥</span>
                    <span className="font-semibold text-white">{profile.stats?.followers || 0}</span>
                    <span>Followers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-primary-400">➕</span>
                    <span className="font-semibold text-white">{profile.stats?.following || 0}</span>
                    <span>Following</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Follow/Unfollow Button */}
            {!isOwnProfile && currentUser && (
              <div className="flex items-center gap-3">
                <button 
                  onClick={profile.isFollowing ? handleUnfollow : handleFollow}
                  disabled={actionLoading}
                  className={`btn ${
                    profile.isFollowing 
                      ? 'btn-secondary border-gray-600 hover:border-red-500 hover:text-red-400' 
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

        {/* Movies Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              🎭 {isOwnProfile ? 'Your Movies' : `${profile.user.username}'s Movies`}
              <span className="text-primary-400 text-lg">({profile.movies.length})</span>
            </h2>
            
            {/* View Options */}
            <div className="flex items-center gap-2">
              <button className="btn btn-ghost text-sm">
                Grid View
              </button>
              <button className="btn btn-ghost text-sm">
                List View
              </button>
            </div>
          </div>
          
          {profile.movies.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {profile.movies.map(movie => (
                <div key={movie.id} className="group">
                  <Link to={`/movie/${movie.id}`} className="block">
                    <MovieCard movie={movie} showUserRating />
                  </Link>
                  
                  {/* Movie Details Card */}
                  {movie.review && (
                    <div className="mt-3 p-4 bg-gray-900/30 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <StarRating rating={movie.rating} readOnly size="small" />
                        <span className="text-xs text-gray-500">
                          {new Date(movie.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <blockquote className="text-sm text-gray-300 italic line-clamp-3">
                        "{movie.review}"
                      </blockquote>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="mb-6">
                <span className="text-6xl block mb-4">🎭</span>
                <h3 className="text-xl font-semibold mb-2 text-gray-300">
                  {isOwnProfile ? 'No movies in your collection yet' : 'No movies tracked'}
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {isOwnProfile 
                    ? 'Start exploring and rating movies to build your personal collection!' 
                    : `${profile.user.username} hasn't added any movies to their collection yet.`
                  }
                </p>
              </div>
              {isOwnProfile && (
                <Link to="/" className="btn btn-primary">
                  <span className="text-lg">🔍</span>
                  Discover Movies
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        {profile.movies.length > 0 && (
          <div className="card">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              📈 Recent Activity
            </h3>
            <div className="space-y-4">
              {profile.movies.slice(0, 3).map(movie => (
                <div key={movie.id} className="flex items-center gap-4 p-3 bg-gray-900/20 rounded-lg">
                  <img 
                    src={movie.poster_path 
                      ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` 
                      : '/api/placeholder/92/138'
                    }
                    alt={movie.title}
                    className="w-12 h-18 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{movie.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating rating={movie.rating} readOnly size="small" />
                      <span className="text-xs text-gray-500">
                        {new Date(movie.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;