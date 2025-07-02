import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase, { testConnection } from '../lib/supabase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const { user, tenant } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [platformButtons, setPlatformButtons] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('unknown');

  // Test database connection
  const checkConnection = async () => {
    try {
      const result = await testConnection();
      setConnectionStatus(result.success ? 'connected' : 'disconnected');
      return result;
    } catch (error) {
      console.error('Connection check error:', error);
      setConnectionStatus('disconnected');
      return { success: false, error: error.message };
    }
  };

  // Fetch data from Supabase with tenant filtering
  const fetchData = async () => {
    // Don't fetch data for superadmin or if user doesn't exist
    if (!user || user?.role === 'superadmin') {
      setLoading(false);
      return;
    }

    if (!tenant) {
      console.log('No tenant information available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Starting tenant-filtered data fetch for:', { 
        user: user.name, 
        tenant: tenant.name,
        tenantId: tenant.id 
      });

      // Add tenant_id column to existing tables and filter by it
      const tenantId = tenant.id;

      // Fetch categories filtered by tenant_id
      console.log('Fetching categories for tenant:', tenantId);
      try {
        // First, try to add tenant_id column if it doesn't exist
        await supabase.rpc('add_tenant_column_if_not_exists', {
          table_name: 'categories_stf2024',
          tenant_id: tenantId
        }).catch(() => {
          // Column might already exist, continue
        });

        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories_stf2024')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('name');

        if (categoriesError && categoriesError.details?.includes('tenant_id')) {
          // If tenant_id column doesn't exist, get all categories for now
          console.log('Tenant column not found, fetching all categories');
          const { data: allCategories, error: allError } = await supabase
            .from('categories_stf2024')
            .select('*')
            .order('name');
          
          if (allError) throw allError;
          
          // Filter to only show categories that don't have a tenant_id or belong to this tenant
          const mappedCategories = allCategories?.map(cat => ({
            id: cat.id,
            name: cat.name,
            type: cat.type,
            tenantId: cat.tenant_id
          })) || [];
          
          setCategories(mappedCategories);
        } else if (categoriesError) {
          console.error('Categories error:', categoriesError);
          setCategories([]);
        } else {
          const mappedCategories = categoriesData?.map(cat => ({
            id: cat.id,
            name: cat.name,
            type: cat.type,
            tenantId: cat.tenant_id
          })) || [];
          console.log('Categories loaded for tenant:', mappedCategories);
          setCategories(mappedCategories);
        }

        // If no categories found, create default ones for this tenant
        if (categoriesData?.length === 0) {
          await createDefaultTenantData();
        }
      } catch (error) {
        console.error('Categories fetch error:', error);
        setCategories([]);
      }

      // Fetch items filtered by tenant_id
      console.log('Fetching items for tenant:', tenantId);
      try {
        await supabase.rpc('add_tenant_column_if_not_exists', {
          table_name: 'items_stf2024',
          tenant_id: tenantId
        }).catch(() => {});

        const { data: itemsData, error: itemsError } = await supabase
          .from('items_stf2024')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('name');

        if (itemsError && itemsError.details?.includes('tenant_id')) {
          // Fallback to all items
          const { data: allItems, error: allError } = await supabase
            .from('items_stf2024')
            .select('*')
            .order('name');
          
          if (allError) throw allError;
          setItems(allItems?.map(item => ({
            id: item.id,
            name: item.name,
            categoryId: item.category_id,
            tenantId: item.tenant_id
          })) || []);
        } else if (itemsError) {
          console.error('Items error:', itemsError);
          setItems([]);
        } else {
          const mappedItems = itemsData?.map(item => ({
            id: item.id,
            name: item.name,
            categoryId: item.category_id,
            tenantId: item.tenant_id
          })) || [];
          console.log('Items loaded for tenant:', mappedItems);
          setItems(mappedItems);
        }
      } catch (error) {
        console.error('Items fetch error:', error);
        setItems([]);
      }

      // Fetch transactions filtered by tenant_id
      console.log('Fetching transactions for tenant:', tenantId);
      try {
        await supabase.rpc('add_tenant_column_if_not_exists', {
          table_name: 'transactions_stf2024',
          tenant_id: tenantId
        }).catch(() => {});

        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions_stf2024')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false });

        if (transactionsError && transactionsError.details?.includes('tenant_id')) {
          // Fallback to all transactions
          const { data: allTransactions, error: allError } = await supabase
            .from('transactions_stf2024')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (allError) throw allError;
          setTransactions(allTransactions?.map(trans => ({
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
            createdAt: trans.created_at,
            tenantId: trans.tenant_id
          })) || []);
        } else if (transactionsError) {
          console.error('Transactions error:', transactionsError);
          setTransactions([]);
        } else {
          const mappedTransactions = transactionsData?.map(trans => ({
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
            createdAt: trans.created_at,
            tenantId: trans.tenant_id
          })) || [];
          console.log('Transactions loaded for tenant:', mappedTransactions.length);
          setTransactions(mappedTransactions);
        }
      } catch (error) {
        console.error('Transactions fetch error:', error);
        setTransactions([]);
      }

      // Fetch platform buttons filtered by tenant_id
      console.log('Fetching platform buttons for tenant:', tenantId);
      try {
        await supabase.rpc('add_tenant_column_if_not_exists', {
          table_name: 'platform_buttons_stf2024',
          tenant_id: tenantId
        }).catch(() => {});

        const { data: buttonsData, error: buttonsError } = await supabase
          .from('platform_buttons_stf2024')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('text');

        if (buttonsError && buttonsError.details?.includes('tenant_id')) {
          // Fallback to all buttons
          const { data: allButtons, error: allError } = await supabase
            .from('platform_buttons_stf2024')
            .select('*')
            .order('text');
          
          if (allError) throw allError;
          setPlatformButtons(allButtons?.map(btn => ({
            ...btn,
            id: btn.id,
            tenantId: btn.tenant_id
          })) || []);
        } else if (buttonsError) {
          console.error('Buttons error:', buttonsError);
          setPlatformButtons([]);
        } else {
          setPlatformButtons(buttonsData?.map(btn => ({
            ...btn,
            id: btn.id,
            tenantId: btn.tenant_id
          })) || []);
        }
      } catch (error) {
        console.error('Buttons fetch error:', error);
        setPlatformButtons([]);
      }

      // Fetch tenant users from central table
      console.log('Fetching tenant users...');
      try {
        const { data: usersData, error: usersError } = await supabase
          .from('users_central')
          .select('*')
          .eq('tenant_id', tenant.id)
          .order('name');

        if (usersError) {
          console.error('Users error:', usersError);
          setUsers([]);
        } else {
          setUsers(usersData?.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            password: user.password || 'password'
          })) || []);
        }
      } catch (error) {
        console.error('Users fetch error:', error);
        setUsers([]);
      }

      console.log('Tenant-filtered data fetch completed successfully');
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Error fetching tenant data:', error);
      toast.error(`Failed to load tenant data: ${error.message}`);
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  // Create default tenant data
  const createDefaultTenantData = async () => {
    if (!tenant) return;

    try {
      console.log('Creating default data for tenant:', tenant.id);

      // Create default categories for this tenant
      const defaultCategories = [
        { name: 'Training Equipment', type: 'expense' },
        { name: 'Match Fees', type: 'expense' },
        { name: 'Membership Fees', type: 'income' },
        { name: 'Sponsorship', type: 'income' }
      ];

      for (const category of defaultCategories) {
        try {
          await supabase
            .from('categories_stf2024')
            .insert({
              ...category,
              tenant_id: tenant.id
            });
        } catch (error) {
          console.log('Default category creation skipped:', error.message);
        }
      }

      console.log('Default tenant data created');
    } catch (error) {
      console.error('Error creating default tenant data:', error);
    }
  };

  useEffect(() => {
    if (user && tenant) {
      console.log('User and tenant available, fetching data...', { 
        userName: user.name, 
        tenantName: tenant.name,
        tenantId: tenant.id 
      });
      
      if (user.role !== 'superadmin') {
        const timer = setTimeout(() => {
          fetchData();
        }, 100);
        return () => clearTimeout(timer);
      } else {
        setLoading(false);
      }
    } else {
      console.log('User or tenant not available:', { user: !!user, tenant: !!tenant });
      setLoading(false);
    }
  }, [user, tenant]);

  // User Management Functions (for tenant users)
  const addUser = async (userData) => {
    if (!tenant) return;

    try {
      const { data, error } = await supabase
        .from('users_central')
        .insert([{
          tenant_id: tenant.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          password: userData.password || 'password',
          active: true
        }])
        .select()
        .single();

      if (error) throw error;

      setUsers(prev => [...prev, {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        password: data.password
      }]);

      toast.success('User added successfully!');
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error(`Failed to add user: ${error.message}`);
    }
  };

  const updateUser = async (id, updates) => {
    try {
      console.log('Updating user with:', { id, updates });
      const { data, error } = await supabase
        .from('users_central')
        .update(updates)
        .eq('id', id)
        .eq('tenant_id', tenant.id) // Ensure we only update users from this tenant
        .select()
        .single();

      if (error) throw error;

      console.log('User update response:', data);
      setUsers(prev => prev.map(user => 
        user.id === id ? {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          password: data.password
        } : user
      ));

      toast.success('User updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(`Failed to update user: ${error.message}`);
    }
  };

  const deleteUser = async (id) => {
    try {
      const { error } = await supabase
        .from('users_central')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenant.id); // Ensure we only delete users from this tenant

      if (error) throw error;

      setUsers(prev => prev.filter(user => user.id !== id));
      toast.success('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(`Failed to delete user: ${error.message}`);
    }
  };

  // Transaction functions with tenant isolation
  const addTransaction = async (transaction) => {
    if (!tenant) return;

    try {
      console.log('===ADD TRANSACTION FUNCTION CALLED===');
      console.log('Transaction data received:', transaction);

      // Validate required fields
      if (!transaction.categoryId || !transaction.itemId) {
        throw new Error('Category and item must be selected');
      }

      const transactionData = {
        type: transaction.type,
        category_id: transaction.categoryId,
        item_id: transaction.itemId,
        amount: parseFloat(transaction.amount),
        description: transaction.description,
        status: transaction.status,
        expected_date: transaction.expectedDate || null,
        official: transaction.official,
        count: transaction.count,
        submitted_by: transaction.submittedBy,
        approval_status: 'pending',
        attachments: transaction.attachments || [],
        tenant_id: tenant.id // Add tenant isolation
      };

      console.log('Submitting transaction with tenant_id:', tenant.id);
      const { data, error } = await supabase
        .from('transactions_stf2024')
        .insert([transactionData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error in addTransaction:', error);
        throw error;
      }

      console.log('Transaction inserted successfully:', data);
      const newTransaction = {
        ...data,
        id: data.id,
        categoryId: data.category_id,
        itemId: data.item_id,
        submittedBy: data.submitted_by,
        approvalStatus: data.approval_status,
        approvedBy: data.approved_by,
        approvedAt: data.approved_at,
        disapprovedBy: data.disapproved_by,
        disapprovedAt: data.disapproved_at,
        expectedDate: data.expected_date,
        createdAt: data.created_at,
        tenantId: data.tenant_id
      };

      setTransactions(prev => [newTransaction, ...prev]);
      toast.success('Transaction created successfully!');
      console.log('===ADD TRANSACTION FUNCTION COMPLETED===');
    } catch (error) {
      console.error('Error in addTransaction function:', error);
      toast.error(`Failed to create transaction: ${error.message}`);
      throw error;
    }
  };

  // Category functions with tenant isolation
  const addCategory = async (category) => {
    if (!tenant) return;

    try {
      console.log('===ADD CATEGORY FUNCTION CALLED===');
      console.log('Adding category for tenant:', tenant.id);

      const { data, error } = await supabase
        .from('categories_stf2024')
        .insert([{
          name: category.name,
          type: category.type,
          tenant_id: tenant.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Category insert error:', error);
        throw error;
      }

      const newCategory = {
        id: data.id,
        name: data.name,
        type: data.type,
        tenantId: data.tenant_id
      };

      setCategories(prev => [...prev, newCategory]);
      toast.success('Category added successfully!');
      console.log('===ADD CATEGORY FUNCTION COMPLETED===');
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error(`Failed to add category: ${error.message}`);
    }
  };

  const addItem = async (item) => {
    if (!tenant) return;

    try {
      console.log('===ADD ITEM FUNCTION CALLED===');
      console.log('Adding item for tenant:', tenant.id);

      const { data, error } = await supabase
        .from('items_stf2024')
        .insert([{
          category_id: item.categoryId,
          name: item.name,
          tenant_id: tenant.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Item insert error:', error);
        throw error;
      }

      const newItem = {
        id: data.id,
        name: data.name,
        categoryId: data.category_id,
        tenantId: data.tenant_id
      };

      setItems(prev => [...prev, newItem]);
      toast.success('Item added successfully!');
      console.log('===ADD ITEM FUNCTION COMPLETED===');
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error(`Failed to add item: ${error.message}`);
    }
  };

  // Simplified implementations for other CRUD operations
  const updateTransaction = async (id, updates) => {
    if (!tenant) return;
    
    try {
      const dbUpdates = {};
      if (updates.approvalStatus) dbUpdates.approval_status = updates.approvalStatus;
      if (updates.approvedBy) dbUpdates.approved_by = updates.approvedBy;
      if (updates.approvedAt) dbUpdates.approved_at = updates.approvedAt;
      if (updates.disapprovedBy) dbUpdates.disapproved_by = updates.disapprovedBy;
      if (updates.disapprovedAt) dbUpdates.disapproved_at = updates.disapprovedAt;

      const { data, error } = await supabase
        .from('transactions_stf2024')
        .update(dbUpdates)
        .eq('id', id)
        .eq('tenant_id', tenant.id)
        .select()
        .single();

      if (error) throw error;

      setTransactions(prev => prev.map(t => 
        t.id === id ? {
          ...t,
          ...updates,
          categoryId: data.category_id,
          itemId: data.item_id,
          submittedBy: data.submitted_by,
          approvalStatus: data.approval_status,
          approvedBy: data.approved_by,
          approvedAt: data.approved_at,
          disapprovedBy: data.disapproved_by,
          disapprovedAt: data.disapproved_at,
          expectedDate: data.expected_date,
          createdAt: data.created_at,
          tenantId: data.tenant_id
        } : t
      ));
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error(`Failed to update transaction: ${error.message}`);
    }
  };

  const deleteTransaction = async (id) => {
    if (!tenant) return;
    
    try {
      const { error } = await supabase
        .from('transactions_stf2024')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenant.id);

      if (error) throw error;

      setTransactions(prev => prev.filter(t => t.id !== id));
      toast.success('Transaction deleted successfully!');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error(`Failed to delete transaction: ${error.message}`);
    }
  };

  // Other CRUD operations (simplified)
  const updateCategory = async (id, updates) => {
    if (!tenant) return;
    
    try {
      const { data, error } = await supabase
        .from('categories_stf2024')
        .update(updates)
        .eq('id', id)
        .eq('tenant_id', tenant.id)
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => prev.map(cat => 
        cat.id === id ? {
          id: data.id,
          name: data.name,
          type: data.type,
          tenantId: data.tenant_id
        } : cat
      ));

      toast.success('Category updated successfully!');
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error(`Failed to update category: ${error.message}`);
    }
  };

  const deleteCategory = async (id) => {
    if (!tenant) return;
    
    try {
      const categoryItems = items.filter(item => item.categoryId === id);
      if (categoryItems.length > 0) {
        toast.error('Cannot delete category with existing items. Delete items first.');
        return;
      }

      const categoryTransactions = transactions.filter(trans => trans.categoryId === id);
      if (categoryTransactions.length > 0) {
        toast.error('Cannot delete category with existing transactions.');
        return;
      }

      const { error } = await supabase
        .from('categories_stf2024')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenant.id);

      if (error) throw error;

      setCategories(prev => prev.filter(cat => cat.id !== id));
      toast.success('Category deleted successfully!');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(`Failed to delete category: ${error.message}`);
    }
  };

  const updateItem = async (id, updates) => {
    if (!tenant) return;
    
    try {
      const dbUpdates = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.categoryId) dbUpdates.category_id = updates.categoryId;

      const { data, error } = await supabase
        .from('items_stf2024')
        .update(dbUpdates)
        .eq('id', id)
        .eq('tenant_id', tenant.id)
        .select()
        .single();

      if (error) throw error;

      setItems(prev => prev.map(item => 
        item.id === id ? {
          id: data.id,
          name: data.name,
          categoryId: data.category_id,
          tenantId: data.tenant_id
        } : item
      ));

      toast.success('Item updated successfully!');
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error(`Failed to update item: ${error.message}`);
    }
  };

  const deleteItem = async (id) => {
    if (!tenant) return;
    
    try {
      const itemTransactions = transactions.filter(trans => trans.itemId === id);
      if (itemTransactions.length > 0) {
        toast.error('Cannot delete item with existing transactions.');
        return;
      }

      const { error } = await supabase
        .from('items_stf2024')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenant.id);

      if (error) throw error;

      setItems(prev => prev.filter(item => item.id !== id));
      toast.success('Item deleted successfully!');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error(`Failed to delete item: ${error.message}`);
    }
  };

  const addPlatformButton = async (button) => {
    if (!tenant) return;
    
    try {
      const { data, error } = await supabase
        .from('platform_buttons_stf2024')
        .insert([{
          ...button,
          tenant_id: tenant.id
        }])
        .select()
        .single();

      if (error) throw error;

      setPlatformButtons(prev => [...prev, {
        ...data,
        id: data.id,
        tenantId: data.tenant_id
      }]);

      toast.success('Platform button added successfully!');
    } catch (error) {
      console.error('Error adding platform button:', error);
      toast.error(`Failed to add platform button: ${error.message}`);
    }
  };

  const deletePlatformButton = async (id) => {
    if (!tenant) return;
    
    try {
      const { error } = await supabase
        .from('platform_buttons_stf2024')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenant.id);

      if (error) throw error;

      setPlatformButtons(prev => prev.filter(b => b.id !== id));
      toast.success('Platform button deleted successfully!');
    } catch (error) {
      console.error('Error deleting platform button:', error);
      toast.error(`Failed to delete platform button: ${error.message}`);
    }
  };

  const value = {
    transactions,
    categories,
    items,
    platformButtons,
    users,
    loading,
    connectionStatus,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    addItem,
    updateItem,
    deleteItem,
    addPlatformButton,
    deletePlatformButton,
    addUser,
    updateUser,
    deleteUser,
    fetchData,
    checkConnection
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};