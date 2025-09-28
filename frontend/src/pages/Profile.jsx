import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import MovieCard from '../components/MovieCard';
import './Profile.css';

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
      <div className="profile-loading">
        <div className="loading-spinner" />
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-error">
        <span className="error-icon">⚠️</span>
        <p>{error}</p>
      </div>
    );
  }

  const isOwnProfile = currentUser?.username === profile.user.username;

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header">
          <div className="profile-info">
            <div className="profile-avatar">
              <span className="avatar-text">
                {profile.user.username.charAt(0).toUpperCase()}
              </span>
            </div>
            
            <div className="profile-details">
              <h1 className="profile-username">{profile.user.username}</h1>
              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-number">{profile.movies.length}</span>
                  <span className="stat-label">Movies</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{profile.stats?.followers || 0}</span>
                  <span className="stat-label">Followers</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{profile.stats?.following || 0}</span>
                  <span className="stat-label">Following</span>
                </div>
              </div>
            </div>
          </div>

          {!isOwnProfile && currentUser && (
            <div className="profile-actions">
              <button 
                onClick={profile.isFollowing ? handleUnfollow : handleFollow}
                disabled={actionLoading}
                className={`btn ${profile.isFollowing ? 'btn-secondary' : 'btn-primary'}`}
              >
                {actionLoading ? (
                  <div className="loading-spinner" />
                ) : (
                  <>
                    <span className="action-icon">
                      {profile.isFollowing ? '👤' : '➕'}
                    </span>
                    {profile.isFollowing ? 'Unfollow' : 'Follow'}
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="profile-content">
          <div className="movies-section">
            <h2 className="section-title">
              🎬 {isOwnProfile ? 'Your Movies' : `${profile.user.username}'s Movies`}
              <span className="movie-count">({profile.movies.length})</span>
            </h2>
            
            {profile.movies.length > 0 ? (
              <div className="movies-grid grid grid-4">
                {profile.movies.map(movie => (
                  <div key={movie.id} className="movie-item">
                    <MovieCard movie={movie} showUserRating />
                    {movie.review && (
                      <div className="movie-review-preview">
                        <p>"{movie.review}"</p>
                        <small>{new Date(movie.created_at).toLocaleDateString()}</small>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🎭</div>
                <p className="empty-title">
                  {isOwnProfile ? 'No movies yet' : 'No movies tracked'}
                </p>
                <p className="empty-subtitle">
                  {isOwnProfile 
                    ? 'Start tracking movies to build your collection!' 
                    : `${profile.user.username} hasn't added any movies yet.`
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;