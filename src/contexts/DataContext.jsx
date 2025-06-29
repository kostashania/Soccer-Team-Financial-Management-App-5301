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

      // Transform data to match frontend expectations - FIX THE MAPPING HERE
      setCategories(categoriesData?.map(cat => ({
        ...cat,
        id: cat.id
      })) || []);

      setItems(itemsData?.map(item => ({
        ...item,
        id: item.id,
        categoryId: item.category_id // THIS IS THE KEY FIX
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
        ...user,
        id: user.id
      })) || []);

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
          category_id: transaction.categoryId,
          item_id: transaction.itemId,
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
        categoryId: data.category_id,
        itemId: data.item_id,
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
                categoryId: data.category_id,
                itemId: data.item_id,
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
        .insert([category])
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, { ...data, id: data.id }]);
      toast.success('Category added successfully!');
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error(`Failed to add category: ${error.message}`);
    }
  };

  const addItem = async (item) => {
    try {
      const { data, error } = await supabase
        .from('items_stf2024')
        .insert([{
          category_id: item.categoryId, // Use categoryId from frontend
          name: item.name
        }])
        .select()
        .single();

      if (error) throw error;

      // Add to local state with proper mapping
      setItems(prev => [...prev, {
        ...data,
        id: data.id,
        categoryId: data.category_id // Map back to frontend format
      }]);
      toast.success('Item added successfully!');
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error(`Failed to add item: ${error.message}`);
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
    addItem,
    addPlatformButton,
    deletePlatformButton,
    fetchData,
    checkConnection
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};