import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase, { testConnection } from '../lib/supabase';
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
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [platformButtons, setPlatformButtons] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('unknown');

  // Test database connection
  const checkConnection = async () => {
    const result = await testConnection();
    setConnectionStatus(result.success ? 'connected' : 'disconnected');
    return result;
  };

  // Fetch data from Supabase
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // First test connection
      const connectionTest = await checkConnection();
      if (!connectionTest.success) {
        throw new Error(`Connection failed: ${connectionTest.error}`);
      }

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories_stf2024')
        .select('*')
        .order('name');

      if (categoriesError) {
        console.error('Categories error:', categoriesError);
        throw categoriesError;
      }

      // Fetch items
      const { data: itemsData, error: itemsError } = await supabase
        .from('items_stf2024')
        .select('*')
        .order('name');

      if (itemsError) {
        console.error('Items error:', itemsError);
        throw itemsError;
      }

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions_stf2024')
        .select('*')
        .order('created_at', { ascending: false });

      if (transactionsError) {
        console.error('Transactions error:', transactionsError);
        throw transactionsError;
      }

      // Fetch platform buttons
      const { data: buttonsData, error: buttonsError } = await supabase
        .from('platform_buttons_stf2024')
        .select('*')
        .order('text');

      if (buttonsError) {
        console.error('Buttons error:', buttonsError);
        throw buttonsError;
      }

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users_stf2024')
        .select('*')
        .order('name');

      if (usersError) {
        console.error('Users error:', usersError);
        throw usersError;
      }

      // Transform data with proper mapping - categories and items use UUIDs
      console.log('Raw categories data:', categoriesData);
      console.log('Raw items data:', itemsData);

      setCategories(categoriesData?.map(cat => ({
        id: cat.id,
        name: cat.name,
        type: cat.type
      })) || []);

      setItems(itemsData?.map(item => ({
        id: item.id,
        name: item.name,
        categoryId: item.category_id // Keep as UUID string, don't parse as int
      })) || []);

      setTransactions(transactionsData?.map(trans => ({
        ...trans,
        id: trans.id,
        categoryId: trans.category_id, // Keep as UUID string
        itemId: trans.item_id, // Keep as UUID string
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
        ...user,
        id: user.id
      })) || []);

      console.log('Processed categories:', categoriesData?.map(cat => ({ id: cat.id, name: cat.name, type: cat.type })));
      console.log('Processed items:', itemsData?.map(item => ({ id: item.id, name: item.name, categoryId: item.category_id })));

      toast.success('Data loaded successfully!');
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(`Failed to load data: ${error.message}`);
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addTransaction = async (transaction) => {
    try {
      const { data, error } = await supabase
        .from('transactions_stf2024')
        .insert([{
          type: transaction.type,
          category_id: transaction.categoryId, // Keep as UUID string
          item_id: transaction.itemId, // Keep as UUID string
          amount: transaction.amount,
          description: transaction.description,
          status: transaction.status,
          expected_date: transaction.expectedDate || null,
          official: transaction.official,
          count: transaction.count,
          submitted_by: transaction.submittedBy,
          approval_status: 'pending',
          attachments: transaction.attachments || []
        }])
        .select()
        .single();

      if (error) throw error;

      // Transform and add to local state
      const newTransaction = {
        ...data,
        id: data.id,
        categoryId: data.category_id, // Keep as UUID string
        itemId: data.item_id, // Keep as UUID string
        submittedBy: data.submitted_by,
        approvalStatus: data.approval_status,
        approvedBy: data.approved_by,
        approvedAt: data.approved_at,
        disapprovedBy: data.disapproved_by,
        disapprovedAt: data.disapproved_at,
        expectedDate: data.expected_date,
        createdAt: data.created_at
      };

      setTransactions(prev => [newTransaction, ...prev]);
      toast.success('Transaction created successfully!');
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error(`Failed to create transaction: ${error.message}`);
    }
  };

  const updateTransaction = async (id, updates) => {
    try {
      const dbUpdates = {};
      // Map frontend field names to database field names
      if (updates.approvalStatus) dbUpdates.approval_status = updates.approvalStatus;
      if (updates.approvedBy) dbUpdates.approved_by = updates.approvedBy;
      if (updates.approvedAt) dbUpdates.approved_at = updates.approvedAt;
      if (updates.disapprovedBy) dbUpdates.disapproved_by = updates.disapprovedBy;
      if (updates.disapprovedAt) dbUpdates.disapproved_at = updates.disapprovedAt;

      const { data, error } = await supabase
        .from('transactions_stf2024')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setTransactions(prev => 
        prev.map(t => 
          t.id === id 
            ? {
                ...t,
                ...updates,
                categoryId: data.category_id, // Keep as UUID string
                itemId: data.item_id, // Keep as UUID string
                submittedBy: data.submitted_by,
                approvalStatus: data.approval_status,
                approvedBy: data.approved_by,
                approvedAt: data.approved_at,
                disapprovedBy: data.disapproved_by,
                disapprovedAt: data.disapproved_at,
                expectedDate: data.expected_date,
                createdAt: data.created_at
              }
            : t
        )
      );
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error(`Failed to update transaction: ${error.message}`);
    }
  };

  const deleteTransaction = async (id) => {
    try {
      const { error } = await supabase
        .from('transactions_stf2024')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTransactions(prev => prev.filter(t => t.id !== id));
      toast.success('Transaction deleted successfully!');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error(`Failed to delete transaction: ${error.message}`);
    }
  };

  const addCategory = async (category) => {
    try {
      const { data, error } = await supabase
        .from('categories_stf2024')
        .insert([{
          name: category.name,
          type: category.type
        }])
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, { 
        id: data.id, 
        name: data.name, 
        type: data.type 
      }]);
      toast.success('Category added successfully!');
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error(`Failed to add category: ${error.message}`);
    }
  };

  const updateCategory = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('categories_stf2024')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => prev.map(cat => 
        cat.id === id ? { 
          id: data.id, 
          name: data.name, 
          type: data.type 
        } : cat
      ));
      toast.success('Category updated successfully!');
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error(`Failed to update category: ${error.message}`);
    }
  };

  const deleteCategory = async (id) => {
    try {
      // Check if category has items
      const categoryItems = items.filter(item => item.categoryId === id); // Compare UUID strings directly
      if (categoryItems.length > 0) {
        toast.error('Cannot delete category with existing items. Delete items first.');
        return;
      }

      // Check if category has transactions
      const categoryTransactions = transactions.filter(trans => trans.categoryId === id); // Compare UUID strings directly
      if (categoryTransactions.length > 0) {
        toast.error('Cannot delete category with existing transactions.');
        return;
      }

      const { error } = await supabase
        .from('categories_stf2024')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCategories(prev => prev.filter(cat => cat.id !== id));
      toast.success('Category deleted successfully!');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(`Failed to delete category: ${error.message}`);
    }
  };

  const addItem = async (item) => {
    try {
      console.log('Adding item with categoryId:', item.categoryId);
      
      const { data, error } = await supabase
        .from('items_stf2024')
        .insert([{
          category_id: item.categoryId, // Keep as UUID string, don't parse
          name: item.name
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('Item added to DB:', data);

      // Add to local state with proper mapping
      const newItem = {
        id: data.id,
        name: data.name,
        categoryId: data.category_id // Keep as UUID string
      };

      console.log('Adding to local state:', newItem);
      setItems(prev => [...prev, newItem]);
      toast.success('Item added successfully!');
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error(`Failed to add item: ${error.message}`);
    }
  };

  const updateItem = async (id, updates) => {
    try {
      const dbUpdates = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.categoryId) dbUpdates.category_id = updates.categoryId; // Keep as UUID string

      const { data, error } = await supabase
        .from('items_stf2024')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setItems(prev => prev.map(item => 
        item.id === id ? {
          id: data.id,
          name: data.name,
          categoryId: data.category_id // Keep as UUID string
        } : item
      ));
      toast.success('Item updated successfully!');
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error(`Failed to update item: ${error.message}`);
    }
  };

  const deleteItem = async (id) => {
    try {
      // Check if item has transactions
      const itemTransactions = transactions.filter(trans => trans.itemId === id); // Compare UUID strings directly
      if (itemTransactions.length > 0) {
        toast.error('Cannot delete item with existing transactions.');
        return;
      }

      const { error } = await supabase
        .from('items_stf2024')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setItems(prev => prev.filter(item => item.id !== id));
      toast.success('Item deleted successfully!');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error(`Failed to delete item: ${error.message}`);
    }
  };

  const addPlatformButton = async (button) => {
    try {
      const { data, error } = await supabase
        .from('platform_buttons_stf2024')
        .insert([button])
        .select()
        .single();

      if (error) throw error;

      setPlatformButtons(prev => [...prev, { ...data, id: data.id }]);
      toast.success('Platform button added successfully!');
    } catch (error) {
      console.error('Error adding platform button:', error);
      toast.error(`Failed to add platform button: ${error.message}`);
    }
  };

  const deletePlatformButton = async (id) => {
    try {
      const { error } = await supabase
        .from('platform_buttons_stf2024')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPlatformButtons(prev => prev.filter(b => b.id !== id));
      toast.success('Platform button deleted successfully!');
    } catch (error) {
      console.error('Error deleting platform button:', error);
      toast.error(`Failed to delete platform button: ${error.message}`);
    }
  };

  // User Management Functions
  const addUser = async (user) => {
    try {
      const { data, error } = await supabase
        .from('users_stf2024')
        .insert([{
          name: user.name,
          email: user.email,
          role: user.role
        }])
        .select()
        .single();

      if (error) throw error;

      setUsers(prev => [...prev, {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role
      }]);
      toast.success('User added successfully!');
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error(`Failed to add user: ${error.message}`);
    }
  };

  const updateUser = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('users_stf2024')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setUsers(prev => prev.map(user => 
        user.id === id ? {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role
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
        .from('users_stf2024')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setUsers(prev => prev.filter(user => user.id !== id));
      toast.success('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(`Failed to delete user: ${error.message}`);
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