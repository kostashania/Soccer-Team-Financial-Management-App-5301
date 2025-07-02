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
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('soccerTeamUser');
    const storedTenant = localStorage.getItem('soccerTeamTenant');
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        if (storedTenant && parsedUser.role !== 'superadmin') {
          setTenant(JSON.parse(storedTenant));
        }
        
        console.log('Restored user session:', { 
          user: parsedUser.name, 
          tenant: storedTenant ? JSON.parse(storedTenant).name : 'none' 
        });
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('soccerTeamUser');
        localStorage.removeItem('soccerTeamTenant');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Attempting login with:', { email, password });

      // Check if user exists in central users table
      const { data: userData, error: userError } = await supabase
        .from('users_central')
        .select(`
          *,
          tenant:tenants(*)
        `)
        .eq('email', email)
        .eq('active', true)
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

      // Check password
      const storedPassword = userData.password || 'password';
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
          role: userData.role,
          tenantId: userData.tenant_id
        };

        // Set tenant info if not superadmin
        let tenantObj = null;
        if (userData.role !== 'superadmin' && userData.tenant) {
          tenantObj = {
            id: userData.tenant.id,
            name: userData.tenant.name,
            domain: userData.tenant.domain,
            schemaName: userData.tenant.schema_name,
            active: userData.tenant.active
          };

          // Check if tenant is active
          if (!userData.tenant.active) {
            return { success: false, error: 'Your organization account is inactive. Please contact support.' };
          }

          // Check if subscription is expired
          const endDate = new Date(userData.tenant.end_date);
          if (endDate < new Date()) {
            return { success: false, error: 'Your subscription has expired. Please contact support to renew.' };
          }

          console.log('User logged in to tenant:', {
            userName: userData.name,
            tenantName: tenantObj.name,
            tenantId: tenantObj.id
          });
        }

        setUser(userObj);
        setTenant(tenantObj);
        
        localStorage.setItem('soccerTeamUser', JSON.stringify(userObj));
        if (tenantObj) {
          localStorage.setItem('soccerTeamTenant', JSON.stringify(tenantObj));
        } else {
          localStorage.removeItem('soccerTeamTenant');
        }

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
    setTenant(null);
    localStorage.removeItem('soccerTeamUser');
    localStorage.removeItem('soccerTeamTenant');
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    tenant,
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