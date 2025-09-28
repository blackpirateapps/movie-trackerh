import StarRating from './StarRating';

const MovieCard = ({ movie, showUserRating = false }) => {
  const posterUrl = movie.poster_path 
    ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
    : '/api/placeholder/300/450';

  const releaseYear = movie.release_date 
    ? new Date(movie.release_date).getFullYear()
    : 'N/A';

  return (
    <div className="group cursor-pointer animate-fade-in">
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 transition-transform duration-300 group-hover:scale-105">
        <img 
          src={posterUrl} 
          alt={movie.title}
          loading="lazy"
          className="w-full h-full object-cover"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-semibold text-sm mb-1 line-clamp-2">{movie.title}</h3>
            <div className="flex items-center justify-between text-xs text-gray-300">
              <span>{releaseYear}</span>
              {movie.vote_average && (
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400">⭐</span>
                  <span>{movie.vote_average.toFixed(1)}</span>
                </div>
              )}
            </div>
            {showUserRating && movie.rating && (
              <div className="mt-2">
                <StarRating rating={movie.rating} readOnly size="small" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;