import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <nav className="bg-slate-800 p-4">
            <div className="container mx-auto max-w-5xl flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold text-white">MovieTracker</Link>
                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            <Link to="/feed" className="text-gray-300 hover:text-white">Feed</Link>
                            <Link to={`/profile/${user.username}`} className="text-gray-300 hover:text-white">Profile</Link>
                            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="text-gray-300 hover:text-white">Login</Link>
                            <Link to="/signup" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
