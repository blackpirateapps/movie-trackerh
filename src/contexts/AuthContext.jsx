import { createContext, useState, useEffect } from 'react';
import api from '../lib/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // This effect could be enhanced to fetch user data on load
        // if a token exists, to persist login across page refreshes.
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const { data } = await api.post('/api/auth?action=login', { email, password });
        setUser(data.user);
        return data.user;
    };

    const signup = async (email, username, password) => {
        const { data } = await api.post('/api/auth?action=signup', { email, username, password });
        setUser(data.user);
        return data.user;
    };

    const logout = async () => {
        await api.post('/api/auth?action=logout');
        setUser(null);
    };

    const value = { user, setUser, login, signup, logout, loading };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
