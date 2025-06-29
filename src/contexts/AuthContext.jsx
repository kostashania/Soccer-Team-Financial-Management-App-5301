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
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('soccerTeamUser');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Attempting login with:', { email, password });

      // Check if user exists in our custom users table
      const { data: userData, error: userError } = await supabase
        .from('users_stf2024')
        .select('*')
        .eq('email', email)
        .single();

      console.log('User lookup result:', { userData, userError });

      if (userError) {
        console.error('User lookup error:', userError);
        if (userError.code === 'PGRST116') {
          return { success: false, error: 'User not found. Please check your email address.' };
        }
        return { success: false, error: 'Database error. Please try again.' };
      }

      if (!userData) {
        return { success: false, error: 'User not found. Please check your email address.' };
      }

      // Check if the provided password matches the user's stored password
      const storedPassword = userData.password || 'password'; // Fallback to 'password' if no password set
      
      console.log('Password check:', { 
        provided: password, 
        stored: storedPassword, 
        match: password === storedPassword 
      });

      if (password === storedPassword) {
        const userObj = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role
        };

        setUser(userObj);
        localStorage.setItem('soccerTeamUser', JSON.stringify(userObj));
        toast.success(`Welcome back, ${userData.name}!`);
        return { success: true };
      } else {
        return { success: false, error: 'Invalid password. Please try again.' };
      }

    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
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