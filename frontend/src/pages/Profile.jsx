import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import MovieCard from '../components/MovieCard';

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    try {
      await api.post(`/api/user?action=follow`, { followingId: profile.user.id });
      setProfile(prev => ({ 
        ...prev, 
        isFollowing: true 
      }));
    } catch (err) {
      console.error('Follow failed:', err);
    }
  };

  const handleUnfollow = async () => {
    try {
      await api.post(`/api/user?action=unfollow`, { followingId: profile.user.id });
      setProfile(prev => ({ 
        ...prev, 
        isFollowing: false 
      }));
    } catch (err) {
      console.error('Unfollow failed:', err);
    }
  };

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <div className="profile-header">
        <h1>{profile.user.username}'s Profile</h1>
        {currentUser && currentUser.username !== profile.user.username && (
          <button 
            onClick={profile.isFollowing ? handleUnfollow : handleFollow}
          >
            {profile.isFollowing ? 'Unfollow' : 'Follow'}
          </button>
        )}
      </div>

      <div className="movies">
        <h2>Movies ({profile.movies.length})</h2>
        <div className="movie-grid">
          {profile.movies.map(movie => (
            <MovieCard key={movie.id} movie={movie} showUserRating />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;