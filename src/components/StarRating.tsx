'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating?: number;
  maxStars?: number;
  onRatingChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const StarRating: React.FC<StarRatingProps> = ({ 
  rating = 0, 
  maxStars = 10,
  onRatingChange, 
  readOnly = false, 
  size = 'medium' 
}) => {
  const [hover, setHover] = useState<number>(0);
  const [currentRating, setCurrentRating] = useState<number>(rating);

  const iconSizes = {
    small: 'w-3.5 h-3.5',
    medium: 'w-4 h-4',
    large: 'w-5 h-5'
  };

  const gapSizes = {
    small: 'gap-0.5',
    medium: 'gap-1',
    large: 'gap-1'
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
    <div className="inline-flex items-center flex-wrap gap-2">
      <div className={`flex items-center flex-wrap ${gapSizes[size]} ${readOnly ? '' : 'cursor-pointer'}`}>
        {[...Array(maxStars)].map((_, index) => {
          const ratingValue = index + 1;
          const isFilled = ratingValue <= displayRating;

          return (
            <button
              key={index}
              type="button"
              className={`transition-all duration-150 transform ${
                !readOnly && isFilled ? 'scale-110' : ''
              } ${readOnly ? 'cursor-default' : 'hover:scale-125'}`}
              onClick={() => handleClick(ratingValue)}
              onMouseEnter={() => handleMouseEnter(ratingValue)}
              onMouseLeave={handleMouseLeave}
              disabled={readOnly}
              aria-label={`Rate ${ratingValue} out of ${maxStars}`}
            >
              <Star 
                className={`${iconSizes[size]} ${
                  isFilled 
                    ? 'fill-[#00FF66] text-[#00FF66]' 
                    : 'fill-[#2A2A2A] text-[#333333]'
                }`}
              />
            </button>
          );
        })}
      </div>
      <span className="font-medium text-xs bg-[#1E1E1E] text-[#EDEDED] border border-[#333333] px-1.5 py-0.5 rounded">
        {displayRating > 0 ? `${displayRating}/${maxStars}` : `0/${maxStars}`}
      </span>
    </div>
  );
};

export default React.memo(StarRating);
