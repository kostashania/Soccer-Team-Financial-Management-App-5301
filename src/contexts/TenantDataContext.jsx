import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../lib/supabase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const TenantDataContext = createContext();

export const useTenantData = () => {
  const context = useContext(TenantDataContext);
  if (!context) {
    throw new Error('useTenantData must be used within a TenantDataProvider');
  }
  return context;
};

export const TenantDataProvider = ({ children }) => {
  const { user, tenant } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [platformButtons, setPlatformButtons] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get the current schema name based on user role
  const getSchemaName = () => {
    if (!user) return null;
    if (user.role === 'superadmin') return null; // Superadmin doesn't have tenant data
    return tenant?.schemaName || 'tenant_stf2024'; // Fallback for existing data
  };

  // Build table name with schema prefix
  const getTableName = (tableName) => {
    const schema = getSchemaName();
    if (!schema) return null;
    return `${schema}.${tableName}`;
  };

  // Fetch tenant-specific data
  const fetchTenantData = async () => {
    if (!user || user.role === 'superadmin') {
      setLoading(false);
      return;
    }

    const schema = getSchemaName();
    if (!schema) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Note: In a real implementation, you'd need to use RPC functions or Edge Functions
      // to query dynamic schema names, as Supabase client doesn't support dynamic schemas directly
      
      // For now, we'll use the existing table structure but with tenant awareness
      const tablesMap = {
        categories: 'categories_stf2024',
        items: 'items_stf2024', 
        transactions: 'transactions_stf2024',
        platform_buttons: 'platform_buttons_stf2024',
        users: 'users_stf2024'
      };

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from(tablesMap.categories)
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;

      // Fetch items
      const { data: itemsData, error: itemsError } = await supabase
        .from(tablesMap.items)
        .select('*')
        .order('name');

      if (itemsError) throw itemsError;

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from(tablesMap.transactions)
        .select('*')
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;

      // Fetch platform buttons
      const { data: buttonsData, error: buttonsError } = await supabase
        .from(tablesMap.platform_buttons)
        .select('*')
        .order('text');

      if (buttonsError) throw buttonsError;

      // Fetch tenant users from central table
      const { data: usersData, error: usersError } = await supabase
        .from('users_central')
        .select('*')
        .eq('tenant_id', tenant?.id)
        .order('name');

      if (usersError) throw usersError;

      // Transform and set data
      setCategories(categoriesData?.map(cat => ({
        id: cat.id,
        name: cat.name,
        type: cat.type
      })) || []);

      setItems(itemsData?.map(item => ({
        id: item.id,
        name: item.name,
        categoryId: item.category_id
      })) || []);

      setTransactions(transactionsData?.map(trans => ({
        ...trans,
        id: trans.id,
        categoryId: trans.category_id,
        itemId: trans.item_id,
        submittedBy: trans.submitted_by,
        approvalStatus: trans.approval_status,
        approvedBy: trans.approved_by,
        approvedAt: trans.approved_at,
        disapprovedBy: trans.disapproved_by,
        disapprovedAt: trans.disapproved_at,
        expectedDate: trans.expected_date,
        createdAt: trans.created_at
      })) || []);

      setPlatformButtons(buttonsData?.map(btn => ({
        ...btn,
        id: btn.id
      })) || []);

      setUsers(usersData?.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        password: user.password || 'password',
        active: user.active
      })) || []);

      toast.success('Tenant data loaded successfully!');
    } catch (error) {
      console.error('Error fetching tenant data:', error);
      toast.error(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTenantData();
    }
  }, [user, tenant]);

  // All CRUD operations would be similar to the original DataContext
  // but with tenant-aware table names and schema isolation

  const value = {
    transactions,
    categories,
    items,
    platformButtons,
    users,
    loading,
    // Add all CRUD functions here...
    fetchTenantData
  };

  return (
    <TenantDataContext.Provider value={value}>
      {children}
    </TenantDataContext.Provider>
  );
};