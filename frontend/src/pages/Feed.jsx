import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import StarRating from '../components/StarRating';

const Feed = () => {
    const [feedItems, setFeedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchFeed = async () => {
            try {
                const { data } = await api.get('/api/user?action=feed');
                setFeedItems(data);
            } catch (err) {
                setError('Failed to load your feed.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchFeed();
    }, []);

    if (loading) return <p className="text-center">Loading feed...</p>;
    if (error) return <p className="text-center text-red-500">{error}</p>;

    return (
        <div>
            <h1 className="text-4xl font-bold mb-6">Your Feed</h1>
            <div className="space-y-6">
                {feedItems.length > 0 ? (
                    feedItems.map((item, index) => (
                        <div key={index} className="bg-slate-800 p-4 rounded-lg flex gap-4">
                            <Link to={`/movie/${item.movieId}`}>
                                <img
                                    src={`https://image.tmdb.org/t/p/w200${item.moviePoster}`}
                                    alt={item.movieTitle}
                                    className="w-24 h-36 object-cover rounded"
                                />
                            </Link>
                            <div className="flex-1">
                                <p className="text-slate-300">
                                    <Link to={`/profile/${item.username}`} className="font-bold text-white hover:underline">{item.username}</Link>
                                    {' '} reviewed {' '}
                                    <Link to={`/movie/${item.movieId}`} className="font-bold text-white hover:underline">{item.movieTitle}</Link>
                                </p>
                                <div className="my-2">
                                     <StarRating rating={item.rating} readOnly={true} />
                                </div>
                                {item.review && <p className="italic bg-slate-700 p-3 rounded">"{item.review}"</p>}
                                <p className="text-xs text-slate-500 mt-2">{new Date(item.updated_at).toLocaleString()}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>Your feed is empty. Follow some users to see their activity here!</p>
                )}
            </div>
        </div>
    );
};

export default Feed;

