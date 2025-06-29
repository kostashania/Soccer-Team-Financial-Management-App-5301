import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../lib/supabase';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('soccerTeamUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // Check if user exists in our custom users table
      const { data: userData, error: userError } = await supabase
        .from('users_stf2024')
        .select('*')
        .eq('email', email)
        .single();

      if (userError) {
        return { success: false, error: 'Invalid credentials' };
      }

      // For demo purposes, we're using a simple password check
      // In production, you'd use Supabase Auth with proper password hashing
      if (password === 'password') {
        const userObj = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role
        };
        
        setUser(userObj);
        localStorage.setItem('soccerTeamUser', JSON.stringify(userObj));
        return { success: true };
      } else {
        return { success: false, error: 'Invalid credentials' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('soccerTeamUser');
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};