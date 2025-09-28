import { useState } from 'react';

const StarRating = ({ rating = 0, onRatingChange, readOnly = false, size = 'medium' }) => {
  const [hover, setHover] = useState(0);
  const [currentRating, setCurrentRating] = useState(rating);

  const sizeClasses = {
    small: 'text-sm gap-0.5',
    medium: 'text-lg gap-1',
    large: 'text-xl gap-1'
  };

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
    <div className={`flex items-center ${sizeClasses[size]} ${readOnly ? '' : 'cursor-pointer'}`}>
      {[...Array(5)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <button
            key={index}
            type="button"
            className={`transition-colors ${
              ratingValue <= (hover || currentRating) 
                ? 'text-yellow-400' 
                : 'text-gray-600'
            } ${readOnly ? 'cursor-default' : 'hover:text-yellow-300'}`}
            onClick={() => handleClick(ratingValue)}
            onMouseEnter={() => handleMouseEnter(ratingValue)}
            onMouseLeave={handleMouseLeave}
            disabled={readOnly}
            aria-label={`Rate ${ratingValue} stars`}
          >
            ★
          </button>
        );
      })}
      {!readOnly && (
        <span className="ml-2 text-sm text-gray-400">
          {currentRating > 0 ? `${currentRating}/5` : 'Rate this movie'}
        </span>
      )}
    </div>
  );
};

export default StarRating;