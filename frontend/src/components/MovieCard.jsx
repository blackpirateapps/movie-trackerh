import { Link } from 'react-router-dom';

const MovieCard = ({ movie }) => {
    const posterUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : 'https://placehold.co/500x750/1e293b/ffffff?text=No+Image';

    return (
        <Link to={`/movie/${movie.id}`} className="block group">
            <div className="overflow-hidden rounded-lg">
                <img
                    src={posterUrl}
                    alt={movie.title}
                    className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                />
            </div>
        </Link>
    );
};

export default MovieCard;
