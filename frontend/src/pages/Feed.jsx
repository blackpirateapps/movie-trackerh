import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import StarRating from '../components/StarRating';
import './Feed.css';

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

  if (loading) {
    return (
      <div className="feed-loading">
        <div className="loading-spinner" />
        <p>Loading your feed...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feed-error">
        <span className="error-icon">⚠️</span>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="feed-page">
      <div className="container">
        <div className="feed-header">
          <h1 className="feed-title">📺 Your Feed</h1>
          <p className="feed-subtitle">See what your friends are watching</p>
        </div>

        {feedItems.length > 0 ? (
          <div className="feed-list">
            {feedItems.map((item, index) => (
              <div key={index} className="feed-item card animate-fade-in">
                <div className="feed-content">
                  <div className="feed-header-info">
                    <Link to={`/profile/${item.username}`} className="user-link">
                      <div className="user-avatar">
                        {item.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="username">{item.username}</span>
                    </Link>
                    <span className="action-text">reviewed</span>
                    <span className="movie-title">{item.movieTitle}</span>
                  </div>
                  
                  <div className="feed-rating">
                    <StarRating rating={item.rating} readOnly size="small" />
                  </div>
                  
                  {item.review && (
                    <blockquote className="feed-review">
                      "{item.review}"
                    </blockquote>
                  )}
                  
                  <div className="feed-meta">
                    <time className="feed-time">
                      {new Date(item.updated_at).toLocaleString()}
                    </time>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-feed">
            <div className="empty-icon">🎭</div>
            <h3 className="empty-title">Your feed is empty</h3>
            <p className="empty-subtitle">
              Follow some users to see their movie activity here!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;