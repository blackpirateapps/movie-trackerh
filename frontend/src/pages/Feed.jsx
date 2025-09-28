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

  if (loading) return <div>Loading feed...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h1>Your Feed</h1>
      {feedItems.length > 0 ? (
        feedItems.map((item, index) => (
          <div key={index} className="feed-item">
            <p>
              <Link to={`/profile/${item.username}`}>{item.username}</Link>
              {' '} reviewed {' '}
              <strong>{item.movieTitle}</strong>
            </p>
            <StarRating rating={item.rating} readOnly />
            {item.review && <blockquote>"{item.review}"</blockquote>}
            <small>{new Date(item.updated_at).toLocaleString()}</small>
          </div>
        ))
      ) : (
        <p>Your feed is empty. Follow some users to see their activity here!</p>
      )}
    </div>
  );
};

export default Feed;