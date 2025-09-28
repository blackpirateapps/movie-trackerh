import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import StarRating from '../components/StarRating';

const Movie = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Review form state
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [watchedDate, setWatchedDate] = useState('');

    const fetchMovieData = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/api/movies?id=${id}`);
            setMovie(data);
            if (data.currentUserReview) {
                setRating(data.currentUserReview.rating || 0);
                setReviewText(data.currentUserReview.review || '');
                setWatchedDate(data.currentUserReview.watched_date ? data.currentUserReview.watched_date.split('T')[0] : '');
            }
        } catch (err) {
            setError('Failed to fetch movie details.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMovieData();
    }, [id]);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/movies', {
                movieId: id,
                rating,
                review: reviewText,
                watched_date: watchedDate,
            });
            // Refetch data to show the new review
            fetchMovieData();
        } catch (err) {
            setError('Failed to submit review.');
            console.error(err);
        }
    };

    if (loading) return <p className="text-center">Loading...</p>;
    if (error) return <p className="text-center text-red-500">{error}</p>;
    if (!movie) return null;

    const posterUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : 'https://placehold.co/500x750/1e293b/ffffff?text=No+Image';

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3">
                    <img src={posterUrl} alt={movie.title} className="rounded-lg w-full" />
                </div>
                <div className="md:w-2/3">
                    <h1 className="text-4xl font-bold">{movie.title}</h1>
                    <p className="text-slate-400 mt-1">{movie.release_date}</p>
                    <p className="mt-4">{movie.overview}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* User Review Form */}
                {user && (
                    <div className="bg-slate-800 p-6 rounded-lg">
                        <h2 className="text-2xl font-bold mb-4">Your Review</h2>
                        <form onSubmit={handleReviewSubmit} className="space-y-4">
                            <div>
                                <label className="block mb-2">Rating</label>
                                <StarRating rating={rating} setRating={setRating} />
                            </div>
                             <div>
                                <label className="block mb-2">Watched Date</label>
                                <input
                                    type="date"
                                    value={watchedDate}
                                    onChange={(e) => setWatchedDate(e.target.value)}
                                    className="w-full p-2 rounded bg-slate-700 border border-slate-600"
                                />
                            </div>
                            <div>
                                <label className="block mb-2">Review</label>
                                <textarea
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                    rows="4"
                                    className="w-full p-2 rounded bg-slate-700 border border-slate-600"
                                    placeholder="What did you think?"
                                ></textarea>
                            </div>
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                                Save Review
                            </button>
                        </form>
                    </div>
                )}

                {/* Other User Reviews */}
                <div className="space-y-4">
                     <h2 className="text-2xl font-bold mb-4">Community Reviews</h2>
                    {movie.reviews && movie.reviews.length > 0 ? (
                        movie.reviews.map((review, index) => (
                            <div key={index} className="bg-slate-800 p-4 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <p className="font-bold">{review.username}</p>
                                    <StarRating rating={review.rating} readOnly={true} />
                                </div>
                                <p className="text-slate-300 mt-2">{review.review}</p>
                            </div>
                        ))
                    ) : (
                        <p>No reviews yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Movie;

