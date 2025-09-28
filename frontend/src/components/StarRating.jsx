import { Star } from 'lucide-react';

const StarRating = ({ rating, setRating, readOnly = false }) => {
    const totalStars = 5;
    const fullStars = Math.floor(rating / 2);

    return (
        <div className="flex items-center gap-1">
            {[...Array(totalStars)].map((_, index) => {
                const starValue = index + 1;
                return (
                    <Star
                        key={index}
                        className={`
                            ${starValue <= fullStars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'}
                            ${!readOnly ? 'cursor-pointer' : ''}
                        `}
                        onClick={() => !readOnly && setRating(starValue * 2)}
                    />
                );
            })}
        </div>
    );
};

export default StarRating;
