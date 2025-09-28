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
            setProfile(prev => ({ ...prev, isFollowing: true, stats: { ...prev.stats, followers: prev.stats.followers + 1 } }));
        } catch (err) {
            console.error('Failed to follow', err);
        }
    };

    const handleUnfollow = async () => {
        try {
            await api.post(`/api/user?action=unfollow`, { followingId: profile.user.id });
            setProfile(prev => ({ ...prev, isFollowing: false, stats: { ...prev.stats, followers: prev.stats.followers - 1 } }));
        } catch (err) {
            console.error('Failed to unfollow', err);
        }
    };

    if (loading) return <p className="text-center">Loading profile...</p>;
    if (error) return <p className="text-center text-red-500">{error}</p>;
    if (!profile) return null;

    const isOwnProfile = currentUser?.username === username;

    return (
        <div>
            <div className="bg-slate-800 p-6 rounded-lg mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold">{profile.user.username}</h1>
                    <div className="flex gap-4 mt-2 text-slate-400">
                        <span><span className="font-bold text-white">{profile.stats.followers}</span> Followers</span>
                        <span><span className="font-bold text-white">{profile.stats.following}</span> Following</span>
                    </div>
                </div>
                {!isOwnProfile && currentUser && (
                    <div>
                        {profile.isFollowing ? (
                             <button onClick={handleUnfollow} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                                Unfollow
                            </button>
                        ) : (
                             <button onClick={handleFollow} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                                Follow
                            </button>
                        )}
                    </div>
                )}
            </div>

            <h2 className="text-2xl font-bold mb-4">Reviewed Movies</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                 {profile.movies.map(movie => (
                    <MovieCard key={movie.id} movie={movie} />
                ))}
            </div>
             {profile.movies.length === 0 && <p>This user hasn't reviewed any movies yet.</p>}
        </div>
    );
};

export default Profile;

