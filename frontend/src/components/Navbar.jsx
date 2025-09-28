import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar glass">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <div className="brand-icon">🎬</div>
          <span className="brand-text">CineTracker</span>
        </Link>

        <div className="navbar-nav">
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
          >
            <span className="nav-icon">🏠</span>
            Home
          </Link>
          {user && (
            <>
              <Link 
                to="/feed" 
                className={`nav-link ${isActive('/feed') ? 'active' : ''}`}
              >
                <span className="nav-icon">📺</span>
                Feed
              </Link>
              <Link 
                to={`/profile/${user.username}`} 
                className={`nav-link ${location.pathname.includes('/profile') ? 'active' : ''}`}
              >
                <span className="nav-icon">👤</span>
                Profile
              </Link>
            </>
          )}
        </div>

        <div className="navbar-actions">
          {user ? (
            <div className="user-menu">
              <span className="welcome-text">Hi, {user.username}</span>
              <button onClick={logout} className="btn btn-ghost">
                <span className="nav-icon">🚪</span>
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
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
    </nav>
  );
};

export default Navbar;