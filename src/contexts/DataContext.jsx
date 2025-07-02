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

  // Fetch data from Supabase
  const fetchData = async () => {
    // Don't fetch data for superadmin or if user doesn't exist
    if (!user || user?.role === 'superadmin') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Starting data fetch for user:', user);

      // Fetch categories with better error handling
      console.log('Fetching categories...');
      try {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories_stf2024')
          .select('*')
          .order('name');

        if (categoriesError) {
          console.error('Categories error:', categoriesError);
          setCategories([]);
        } else {
          const mappedCategories = categoriesData?.map(cat => ({
            id: cat.id,
            name: cat.name,
            type: cat.type
          })) || [];
          console.log('Categories loaded:', mappedCategories);
          setCategories(mappedCategories);
        }
      } catch (error) {
        console.error('Categories fetch error:', error);
        setCategories([]);
      }

      // Fetch items with better error handling
      console.log('Fetching items...');
      try {
        const { data: itemsData, error: itemsError } = await supabase
          .from('items_stf2024')
          .select('*')
          .order('name');

        if (itemsError) {
          console.error('Items error:', itemsError);
          setItems([]);
        } else {
          const mappedItems = itemsData?.map(item => ({
            id: item.id,
            name: item.name,
            categoryId: item.category_id
          })) || [];
          console.log('Items loaded:', mappedItems);
          setItems(mappedItems);
        }
      } catch (error) {
        console.error('Items fetch error:', error);
        setItems([]);
      }

      // Fetch transactions with better error handling
      console.log('Fetching transactions...');
      try {
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions_stf2024')
          .select('*')
          .order('created_at', { ascending: false });

        if (transactionsError) {
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
            createdAt: trans.created_at
          })) || [];
          console.log('Transactions loaded:', mappedTransactions.length);
          setTransactions(mappedTransactions);
        }
      } catch (error) {
        console.error('Transactions fetch error:', error);
        setTransactions([]);
      }

      // Fetch platform buttons
      console.log('Fetching platform buttons...');
      try {
        const { data: buttonsData, error: buttonsError } = await supabase
          .from('platform_buttons_stf2024')
          .select('*')
          .order('text');

        if (buttonsError) {
          console.error('Buttons error:', buttonsError);
          setPlatformButtons([]);
        } else {
          setPlatformButtons(buttonsData?.map(btn => ({
            ...btn,
            id: btn.id
          })) || []);
        }
      } catch (error) {
        console.error('Buttons fetch error:', error);
        setPlatformButtons([]);
      }

      // Fetch users from the main users table
      console.log('Fetching users...');
      try {
        const { data: usersData, error: usersError } = await supabase
          .from('users_stf2024')
          .select('*')
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

      console.log('Data fetch completed successfully');
      setConnectionStatus('connected');

    } catch (error) {
      console.error('Error fetching data:', error);
      // Only show error toast if it's not a UUID error from undefined values
      if (!error.message.includes('invalid input syntax for type uuid')) {
        toast.error(`Failed to load data: ${error.message}`);
      }
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      // Only fetch data if not superadmin
      if (user.role !== 'superadmin') {
        const timer = setTimeout(() => {
          fetchData();
        }, 100);
        return () => clearTimeout(timer);
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [user]);

  // User Management Functions
  const addUser = async (user) => {
    try {
      const { data, error } = await supabase
        .from('users_stf2024')
        .insert([{
          name: user.name,
          email: user.email,
          role: user.role,
          password: user.password || 'password'
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
        .from('users_stf2024')
        .update(updates)
        .eq('id', id)
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

  // Transaction functions
  const addTransaction = async (transaction) => {
    try {
      // Validate required fields
      if (!transaction.categoryId || !transaction.itemId) {
        throw new Error('Category and item must be selected');
      }

      // Ensure categoryId and itemId are valid integers
      const categoryId = parseInt(transaction.categoryId);
      const itemId = parseInt(transaction.itemId);

      if (isNaN(categoryId) || isNaN(itemId)) {
        throw new Error('Invalid category or item selected');
      }

      // Validate that the category and item exist
      const categoryExists = categories.find(c => c.id === categoryId);
      const itemExists = items.find(i => i.id === itemId);

      if (!categoryExists) {
        console.log('Available categories:', categories);
        console.log('Looking for category ID:', categoryId);
        throw new Error('Selected category does not exist');
      }

      if (!itemExists) {
        console.log('Available items:', items);
        console.log('Looking for item ID:', itemId);
        throw new Error('Selected item does not exist');
      }

      const transactionData = {
        type: transaction.type,
        category_id: categoryId,
        item_id: itemId,
        amount: parseFloat(transaction.amount),
        description: transaction.description,
        status: transaction.status,
        expected_date: transaction.expectedDate || null,
        official: transaction.official,
        count: transaction.count,
        submitted_by: transaction.submittedBy,
        approval_status: 'pending',
        attachments: transaction.attachments || []
      };

      console.log('Submitting transaction with data:', transactionData);

      const { data, error } = await supabase
        .from('transactions_stf2024')
        .insert([transactionData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

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
          createdAt: data.created_at
        } : t
      ));
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

  // Category functions
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

      const newCategory = {
        id: data.id,
        name: data.name,
        type: data.type
      };

      setCategories(prev => [...prev, newCategory]);
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
        .eq('id', id);

      if (error) throw error;

      setCategories(prev => prev.filter(cat => cat.id !== id));
      toast.success('Category deleted successfully!');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(`Failed to delete category: ${error.message}`);
    }
  };

  // Item functions
  const addItem = async (item) => {
    try {
      const categoryId = parseInt(item.categoryId);
      if (isNaN(categoryId)) {
        throw new Error('Invalid category selected');
      }

      const { data, error } = await supabase
        .from('items_stf2024')
        .insert([{
          category_id: categoryId,
          name: item.name
        }])
        .select()
        .single();

      if (error) throw error;

      const newItem = {
        id: data.id,
        name: data.name,
        categoryId: data.category_id
      };

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
      if (updates.categoryId) {
        const categoryId = parseInt(updates.categoryId);
        if (isNaN(categoryId)) {
          throw new Error('Invalid category selected');
        }
        dbUpdates.category_id = categoryId;
      }

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
          categoryId: data.category_id
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
      const itemTransactions = transactions.filter(trans => trans.itemId === id);
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

  // Platform button functions
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