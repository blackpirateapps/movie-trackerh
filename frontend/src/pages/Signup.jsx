import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await signup(email, username, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to sign up');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10">
            <h2 className="text-3xl font-bold mb-6 text-center">Sign Up</h2>
            {error && <p className="bg-red-500 text-white p-3 rounded mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block mb-1">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 rounded bg-slate-800 border border-slate-700"
                        required
                    />
                </div>
                <div>
                    <label className="block mb-1">Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-3 rounded bg-slate-800 border border-slate-700"
                        required
                    />
                </div>
                <div>
                    <label className="block mb-1">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 rounded bg-slate-800 border border-slate-700"
                        required
                    />
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded">
                    Sign Up
                </button>
            </form>
            <p className="text-center mt-4">
                Already have an account? <Link to="/login" className="text-blue-400 hover:underline">Log in</Link>
            </p>
        </div>
    );
};

export default Signup;
