'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';

export interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  login: (email: string, password: string) => Promise<User>;
  signup: (email: string, username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.log('No active session');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ 
        action: 'login', 
        email, 
        password 
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    
    setUser(data.user);
    return data.user;
  };

  const signup = async (email: string, username: string, password: string): Promise<User> => {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ 
        action: 'signup', 
        email, 
        username, 
        password 
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Signup failed');
    }
    
    setUser(data.user);
    return data.user;
  };

  const logout = async (): Promise<void> => {
    await fetch('/api/auth', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'logout' }),
    });
    setUser(null);
  };

  const value: AuthContextType = { user, setUser, login, signup, logout, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
