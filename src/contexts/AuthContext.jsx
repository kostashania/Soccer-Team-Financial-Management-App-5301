import React, { createContext, useContext, useState, useEffect } from 'react';

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
    // Mock authentication - replace with real auth
    const mockUsers = [
      { id: 1, name: 'Admin User', email: 'admin@team.com', role: 'admin' },
      { id: 2, name: 'Board Member', email: 'board@team.com', role: 'board' },
      { id: 3, name: 'Cashier', email: 'cashier@team.com', role: 'cashier' }
    ];

    const foundUser = mockUsers.find(u => u.email === email && password === 'password');
    
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('soccerTeamUser', JSON.stringify(foundUser));
      return { success: true };
    }
    
    return { success: false, error: 'Invalid credentials' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('soccerTeamUser');
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