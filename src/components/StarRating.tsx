'use client';

import React, { useState } from 'react';

interface StarRatingProps {
  rating?: number;
  onRatingChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const StarRating: React.FC<StarRatingProps> = ({ 
  rating = 0, 
  onRatingChange, 
  readOnly = false, 
  size = 'medium' 
}) => {
  const [hover, setHover] = useState<number>(0);
  const [currentRating, setCurrentRating] = useState<number>(rating);

  const sizeClasses = {
    small: 'text-sm gap-0.5',
    medium: 'text-lg gap-1',
    large: 'text-xl gap-1'
  };

  const handleClick = (ratingValue: number) => {
    if (readOnly) return;
    setCurrentRating(ratingValue);
    if (onRatingChange) {
      onRatingChange(ratingValue);
    }
  };

  const handleMouseEnter = (ratingValue: number) => {
    if (!readOnly) {
      setHover(ratingValue);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHover(0);
    }
  };

  const displayRating = hover || currentRating || rating;

  return (
    <div className={`flex items-center ${sizeClasses[size]} ${readOnly ? '' : 'cursor-pointer'}`}>
      {[...Array(5)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <button
            key={index}
            type="button"
            className={`transition-colors ${
              ratingValue <= displayRating 
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
          {displayRating > 0 ? `${displayRating}/5` : 'Rate this movie'}
        </span>
      )}
    </div>
  );
};

export default StarRating;
