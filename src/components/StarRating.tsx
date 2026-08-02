'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';

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

  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  const gapSizes = {
    small: 'gap-0.5',
    medium: 'gap-1',
    large: 'gap-1.5'
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
    <div className={`inline-flex items-center ${gapSizes[size]} ${readOnly ? '' : 'cursor-pointer'}`}>
      {[...Array(5)].map((_, index) => {
        const ratingValue = index + 1;
        const isFilled = ratingValue <= displayRating;

        return (
          <button
            key={index}
            type="button"
            className={`transition-all duration-150 transform ${
              !readOnly && isFilled ? 'scale-110' : ''
            } ${readOnly ? 'cursor-default' : 'hover:scale-125 hover:-rotate-6'}`}
            onClick={() => handleClick(ratingValue)}
            onMouseEnter={() => handleMouseEnter(ratingValue)}
            onMouseLeave={handleMouseLeave}
            disabled={readOnly}
            aria-label={`Rate ${ratingValue} stars`}
          >
            <Star 
              className={`${iconSizes[size]} ${
                isFilled 
                  ? 'fill-[#ff4d4d] text-[#2d2d2d] stroke-[2.5]' 
                  : 'fill-[#e5e0d8] text-[#2d2d2d] stroke-[2]'
              }`}
            />
          </button>
        );
      })}
      {!readOnly && (
        <span className="ml-2 text-base font-bold text-[#2d2d2d]">
          {displayRating > 0 ? `${displayRating}/5` : 'Rate this movie'}
        </span>
      )}
    </div>
  );
};

export default StarRating;
