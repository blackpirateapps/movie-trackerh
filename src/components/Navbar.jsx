import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="text-2xl group-hover:animate-bounce-gentle">🎬</div>
            <span className="text-xl font-bold text-gradient">CineTracker</span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-6">
            <Link 
              to="/" 
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                isActive('/') 
                  ? 'bg-primary-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-sm">🏠</span>
              Home
            </Link>
            
            {user && (
              <>
                <Link 
                  to="/feed" 
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                    isActive('/feed') 
                      ? 'bg-primary-600 text-white shadow-lg' 
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-sm">📺</span>
                  Feed
                </Link>
                <Link 
                  to={`/profile/${user.username}`} 
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                    location.pathname.includes('/profile') 
                      ? 'bg-primary-600 text-white shadow-lg' 
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-sm">👤</span>
                  Profile
                </Link>
              </>
            )}
          </div>

          {/* Auth */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-300">Hi, {user.username}</span>
                <button onClick={logout} className="btn btn-ghost">
                  <span className="text-sm">🚪</span>
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="btn btn-ghost">
                  Login
                </Link>
                <Link to="/signup" className="btn btn-primary">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;