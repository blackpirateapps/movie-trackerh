import { useState } from 'react';
import './StarRating.css';

const StarRating = ({ rating = 0, onRatingChange, readOnly = false, size = 'medium' }) => {
  const [hover, setHover] = useState(0);
  const [currentRating, setCurrentRating] = useState(rating);

  const handleClick = (ratingValue) => {
    if (readOnly) return;
    setCurrentRating(ratingValue);
    if (onRatingChange) {
      onRatingChange(ratingValue);
    }
  };

  const handleMouseEnter = (ratingValue) => {
    if (!readOnly) {
      setHover(ratingValue);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHover(0);
    }
  };

  return (
    <div className={`star-rating star-rating--${size} ${readOnly ? 'readonly' : ''}`}>
      {[...Array(5)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <button
            key={index}
            type="button"
            className={`star ${
              ratingValue <= (hover || currentRating) ? 'star--filled' : 'star--empty'
            }`}
            onClick={() => handleClick(ratingValue)}
            onMouseEnter={() => handleMouseEnter(ratingValue)}
            onMouseLeave={handleMouseLeave}
            disabled={readOnly}
            aria-label={`Rate ${ratingValue} stars`}
          >
            <span className="star-icon">★</span>
          </button>
        );
      })}
      {!readOnly && (
        <span className="rating-text">
          {currentRating > 0 ? `${currentRating}/5` : 'Rate this movie'}
        </span>
      )}
    </div>
  );
};

export default StarRating;