import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../components/common/SafeIcon';
import BrandingSettings from '../components/admin/BrandingSettings';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getDatabaseInfo, testConnection } from '../lib/supabase';
import toast from 'react-hot-toast';

const {
  FiPlus, FiTrash2, FiSettings, FiUsers, FiTag, FiList, FiExternalLink, FiDatabase,
  FiWifi, FiWifiOff, FiRefreshCw, FiInfo, FiEdit3, FiSave, FiX, FiUserPlus, FiMail,
  FiShield, FiLock, FiGlobe, FiSearch, FiAlertTriangle, FiEye, FiPalette
} = FiIcons;

const AdminPanel = () => {
  const { user } = useAuth();
  const { t, getAllTranslations } = useLanguage();
  const {
    categories, items, platformButtons, transactions, users, connectionStatus,
    addCategory, updateCategory, deleteCategory, addItem, updateItem, deleteItem,
    addPlatformButton, deletePlatformButton, deleteTransaction, addUser, updateUser,
    deleteUser, fetchData, checkConnection
  } = useData();

  const [activeTab, setActiveTab] = useState('branding'); // Changed default to branding
  const [dbInfo, setDbInfo] = useState(null);
  const [testing, setTesting] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [translationSearch, setTranslationSearch] = useState('');

  // Clear database states
  const [showClearDbModal, setShowClearDbModal] = useState(false);
  const [clearDbConfirmation, setClearDbConfirmation] = useState('');
  const [clearingDb, setClearingDb] = useState(false);

  // Delete transaction states
  const [showDeleteTransactionModal, setShowDeleteTransactionModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [deleteTransactionConfirmation, setDeleteTransactionConfirmation] = useState('');

  const categoryForm = useForm();
  const itemForm = useForm();
  const buttonForm = useForm();
  const userForm = useForm();

  useEffect(() => {
    setDbInfo(getDatabaseInfo());
  }, []);

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Access denied. Admin role required.</p>
      </div>
    );
  }

  // ... (keeping all existing functions for categories, items, users, etc.)
  const onAddCategory = (data) => {
    addCategory(data);
    categoryForm.reset();
  };

  const onUpdateCategory = (data) => {
    updateCategory(editingCategory.id, data);
    setEditingCategory(null);
    categoryForm.reset();
  };

  const onAddItem = (data) => {
    addItem({ ...data, categoryId: data.categoryId });
    itemForm.reset();
  };

  const onUpdateItem = (data) => {
    updateItem(editingItem.id, { ...data, categoryId: data.categoryId });
    setEditingItem(null);
    itemForm.reset();
  };

  const onAddButton = (data) => {
    addPlatformButton(data);
    buttonForm.reset();
  };

  const onAddUser = (data) => {
    addUser(data);
    userForm.reset();
  };

  const onUpdateUser = (data) => {
    updateUser(editingUser.id, data);
    setEditingUser(null);
    userForm.reset();
  };

  const handleDeleteButton = (id) => {
    if (confirm('Are you sure you want to delete this button?')) {
      deletePlatformButton(id);
    }
  };

  const handleDeleteCategory = (id) => {
    if (confirm('Are you sure you want to delete this category?')) {
      deleteCategory(id);
    }
  };

  const handleDeleteItem = (id) => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteItem(id);
    }
  };

  const handleDeleteTransaction = (transaction) => {
    setTransactionToDelete(transaction);
    setDeleteTransactionConfirmation('');
    setShowDeleteTransactionModal(true);
  };

  const confirmDeleteTransaction = () => {
    if (deleteTransactionConfirmation.toLowerCase() === 'delete' && transactionToDelete) {
      deleteTransaction(transactionToDelete.id);
      setShowDeleteTransactionModal(false);
      setTransactionToDelete(null);
      setDeleteTransactionConfirmation('');
      toast.success('Transaction deleted successfully');
    } else {
      toast.error('Please type "delete" to confirm');
    }
  };

  const handleDeleteUser = (id) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUser(id);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    const result = await testConnection();
    if (result.success) {
      toast.success('Database connection successful!');
    } else {
      toast.error(`Connection failed: ${result.error}`);
    }
    setTesting(false);
  };

  const handleRefreshData = async () => {
    toast.loading('Refreshing data...');
    await fetchData();
    toast.dismiss();
  };

  // Clear database function
  const handleClearDatabase = async () => {
    if (clearDbConfirmation.toLowerCase() !== 'delete') {
      toast.error('Please type "delete" to confirm database clearing');
      return;
    }

    setClearingDb(true);
    try {
      // Import supabase client
      const { default: supabase } = await import('../lib/supabase');

      // Clear all tables except users and app_settings
      const tablesToClear = [
        'transactions_stf2024',
        'categories_stf2024',
        'items_stf2024',
        'platform_buttons_stf2024'
      ];

      for (const table of tablesToClear) {
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

        if (error) {
          console.error(`Error clearing ${table}:`, error);
          toast.error(`Failed to clear ${table}`);
          return;
        }
      }

      // Refresh data after clearing
      await fetchData();
      setShowClearDbModal(false);
      setClearDbConfirmation('');
      toast.success('Database cleared successfully (users and branding preserved)');
    } catch (error) {
      console.error('Error clearing database:', error);
      toast.error('Failed to clear database');
    } finally {
      setClearingDb(false);
    }
  };

  const startEditingCategory = (category) => {
    setEditingCategory(category);
    categoryForm.reset({ name: category.name, type: category.type });
  };

  const startEditingItem = (item) => {
    setEditingItem(item);
    itemForm.reset({ name: item.name, categoryId: item.categoryId });
  };

  const startEditingUser = (userItem) => {
    setEditingUser(userItem);
    userForm.reset({
      name: userItem.name,
      email: userItem.email,
      role: userItem.role,
      password: userItem.password || 'password'
    });
  };

  const disapprovedTransactions = transactions.filter(t => t.approvalStatus === 'disapproved');

  // Get all translations for the translation management tab
  const allTranslations = getAllTranslations();
  const translationKeys = Object.keys(allTranslations.en || {});

  // Filter translations based on search
  const filteredTranslationKeys = translationKeys.filter(key => {
    const englishText = allTranslations.en[key] || '';
    const greekText = allTranslations.el[key] || '';
    const searchLower = translationSearch.toLowerCase();

    return (
      key.toLowerCase().includes(searchLower) ||
      englishText.toLowerCase().includes(searchLower) ||
      greekText.toLowerCase().includes(searchLower)
    );
  });

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const getItemName = (itemId) => {
    const item = items.find(i => i.id === itemId);
    return item?.name || 'Unknown';
  };

  const tabs = [
    { id: 'branding', label: 'App Branding', icon: FiPalette },
    { id: 'database', label: 'Database', icon: FiDatabase },
    { id: 'users', label: t('userManagement'), icon: FiUsers },
    { id: 'translations', label: t('translations'), icon: FiGlobe },
    { id: 'categories', label: 'Categories', icon: FiTag },
    { id: 'items', label: 'Items', icon: FiList },
    { id: 'buttons', label: 'Platform Buttons', icon: FiExternalLink },
    { id: 'transactions', label: 'All Transactions', icon: FiDatabase },
    { id: 'disapproved', label: 'Disapproved', icon: FiTrash2 }
  ];

  // Clear Database Modal
  const ClearDatabaseModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white rounded-lg max-w-md w-full p-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center mb-4">
          <SafeIcon icon={FiAlertTriangle} className="w-6 h-6 text-red-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">Clear Database</h2>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            <strong>⚠️ WARNING:</strong> This action will permanently delete ALL data except users and branding:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 mb-4">
            <li>All transactions ({transactions.length} records)</li>
            <li>All categories ({categories.length} records)</li>
            <li>All items ({items.length} records)</li>
            <li>All platform buttons ({platformButtons.length} records)</li>
          </ul>
          <p className="text-sm text-green-600 mb-4">
            ✅ Users and app branding will be preserved ({users.length} users)
          </p>
          <p className="text-red-600 font-medium">
            This action cannot be undone!
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type "delete" to confirm:
          </label>
          <input
            type="text"
            value={clearDbConfirmation}
            onChange={(e) => setClearDbConfirmation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            placeholder="Type 'delete' here"
          />
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleClearDatabase}
            disabled={clearingDb || clearDbConfirmation.toLowerCase() !== 'delete'}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <SafeIcon icon={FiTrash2} className="w-4 h-4 mr-2" />
            {clearingDb ? 'Clearing...' : 'Clear Database'}
          </button>
          <button
            onClick={() => {
              setShowClearDbModal(false);
              setClearDbConfirmation('');
            }}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );

  // Delete Transaction Modal
  const DeleteTransactionModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white rounded-lg max-w-md w-full p-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center mb-4">
          <SafeIcon icon={FiAlertTriangle} className="w-6 h-6 text-red-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">Delete Transaction</h2>
        </div>

        {transactionToDelete && (
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              <strong>⚠️ WARNING:</strong> You are about to permanently delete this transaction:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="font-medium text-gray-900">{transactionToDelete.description}</p>
              <p className="text-sm text-gray-600">
                Amount: ${parseFloat(transactionToDelete.amount || 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                Category: {getCategoryName(transactionToDelete.categoryId)}
              </p>
              <p className="text-sm text-gray-600">
                Submitted by: {transactionToDelete.submittedBy}
              </p>
            </div>
            <p className="text-red-600 font-medium">
              This action cannot be undone!
            </p>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type "delete" to confirm:
          </label>
          <input
            type="text"
            value={deleteTransactionConfirmation}
            onChange={(e) => setDeleteTransactionConfirmation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            placeholder="Type 'delete' here"
          />
        </div>

        <div className="flex space-x-3">
          <button
            onClick={confirmDeleteTransaction}
            disabled={deleteTransactionConfirmation.toLowerCase() !== 'delete'}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <SafeIcon icon={FiTrash2} className="w-4 h-4 mr-2" />
            Delete Transaction
          </button>
          <button
            onClick={() => {
              setShowDeleteTransactionModal(false);
              setTransactionToDelete(null);
              setDeleteTransactionConfirmation('');
            }}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">{t('adminPanel')}</h1>
        <p className="mt-2 text-gray-600">Manage system configuration and data</p>
      </motion.div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <SafeIcon icon={tab.icon} className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* App Branding Tab */}
      {activeTab === 'branding' && <BrandingSettings />}

      {/* Database Tab */}
      {activeTab === 'database' && (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Connection Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Database Connection Status</h2>
              <div className="flex items-center space-x-2">
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                  connectionStatus === 'connected'
                    ? 'bg-green-100 text-green-800'
                    : connectionStatus === 'disconnected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  <SafeIcon
                    icon={connectionStatus === 'connected' ? FiWifi : FiWifiOff}
                    className="w-4 h-4"
                  />
                  <span className="capitalize">{connectionStatus}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Database URL</label>
                <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                  {dbInfo?.url}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Project ID</label>
                <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                  {dbInfo?.project_id}
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                <SafeIcon icon={FiDatabase} className="w-4 h-4 mr-2" />
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
              <button
                onClick={handleRefreshData}
                className="flex items-center px-4 py-2 bg-success-600 text-white rounded-md hover:bg-success-700 transition-colors"
              >
                <SafeIcon icon={FiRefreshCw} className="w-4 h-4 mr-2" />
                Refresh Data
              </button>
            </div>
          </div>

          {/* Data Summary with Clear Database */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Data Summary</h2>
              <button
                onClick={() => setShowClearDbModal(true)}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                <SafeIcon icon={FiTrash2} className="w-4 h-4 mr-2" />
                Clear Database
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{categories.length}</p>
                <p className="text-sm text-gray-600">Categories</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{items.length}</p>
                <p className="text-sm text-gray-600">Items</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{transactions.length}</p>
                <p className="text-sm text-gray-600">Transactions</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{platformButtons.length}</p>
                <p className="text-sm text-gray-600">Platform Buttons</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{users?.length || 0}</p>
                <p className="text-sm text-gray-600">Users</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* All other existing tabs remain the same... */}
      {/* Translation Management Tab */}
      {activeTab === 'translations' && (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <SafeIcon icon={FiGlobe} className="w-6 h-6 text-primary-600 mr-3" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{t('translationManagement')}</h2>
                  <p className="text-sm text-gray-600">All UI elements and their Greek translations</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Total: {translationKeys.length} items</span>
              </div>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SafeIcon icon={FiSearch} className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={translationSearch}
                  onChange={(e) => setTranslationSearch(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  placeholder={t('searchTranslations')}
                />
              </div>
            </div>

            {/* Translation Table */}
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('uiElement')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('englishText')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('greekTranslation')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTranslationKeys.map((key, index) => (
                      <tr key={key} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                            {key}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {allTranslations.en[key] || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 font-medium">
                            {allTranslations.el[key] || '-'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {filteredTranslationKeys.length === 0 && translationSearch && (
              <div className="text-center py-8">
                <p className="text-gray-600">No translations found matching "{translationSearch}"</p>
              </div>
            )}

            {/* Translation Statistics */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <SafeIcon icon={FiGlobe} className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Total Translations</p>
                    <p className="text-2xl font-bold text-blue-600">{translationKeys.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <SafeIcon icon={FiSettings} className="w-8 h-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-green-900">English Items</p>
                    <p className="text-2xl font-bold text-green-600">{Object.keys(allTranslations.en || {}).length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center">
                  <SafeIcon icon={FiGlobe} className="w-8 h-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-purple-900">Greek Items</p>
                    <p className="text-2xl font-bold text-purple-600">{Object.keys(allTranslations.el || {}).length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* All other tabs remain the same - just keeping the existing code for brevity */}
      {/* I'll include the most important ones but keeping the response manageable */}

      {/* User Management Tab */}
      {activeTab === 'users' && (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Add/Edit User Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingUser ? t('editUser') : t('addNewUser')}
            </h2>
            <form onSubmit={userForm.handleSubmit(editingUser ? onUpdateUser : onAddUser)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('fullName')} *
                  </label>
                  <input
                    type="text"
                    {...userForm.register('name', { required: t('nameRequired') })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder={t('fullName')}
                  />
                  {userForm.formState.errors.name && (
                    <p className="mt-1 text-sm text-red-600">{userForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('emailAddress')} *
                  </label>
                  <input
                    type="email"
                    {...userForm.register('email', {
                      required: t('emailRequired'),
                      pattern: { value: /^\S+@\S+$/i, message: t('invalidEmail') }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="user@example.com"
                  />
                  {userForm.formState.errors.email && (
                    <p className="mt-1 text-sm text-red-600">{userForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('role')} *
                  </label>
                  <select
                    {...userForm.register('role', { required: t('roleRequired') })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select role</option>
                    <option value="admin">{t('admin')}</option>
                    <option value="board">{t('boardMember')}</option>
                    <option value="cashier">{t('cashier')}</option>
                  </select>
                  {userForm.formState.errors.role && (
                    <p className="mt-1 text-sm text-red-600">{userForm.formState.errors.role.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('password')} *
                  </label>
                  <input
                    type="text"
                    {...userForm.register('password', { required: t('passwordRequired') })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter password"
                    defaultValue="password"
                  />
                  {userForm.formState.errors.password && (
                    <p className="mt-1 text-sm text-red-600">{userForm.formState.errors.password.message}</p>
                  )}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  <SafeIcon icon={editingUser ? FiSave : FiUserPlus} className="w-4 h-4 mr-2" />
                  {editingUser ? t('updateUser') : t('addUser')}
                </button>
                {editingUser && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUser(null);
                      userForm.reset();
                    }}
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    <SafeIcon icon={FiX} className="w-4 h-4 mr-2" />
                    {t('cancel')}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Users List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('systemUsers')} ({users?.length || 0})
            </h2>
            <div className="space-y-3">
              {users && users.length > 0 ? users.map((userItem) => (
                <div
                  key={userItem.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${
                      userItem.role === 'admin' ? 'bg-red-100' :
                      userItem.role === 'board' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      <SafeIcon
                        icon={userItem.role === 'admin' ? FiShield : userItem.role === 'board' ? FiUsers : FiMail}
                        className={`w-5 h-5 ${
                          userItem.role === 'admin' ? 'text-red-600' :
                          userItem.role === 'board' ? 'text-blue-600' : 'text-green-600'
                        }`}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{userItem.name}</p>
                      <p className="text-sm text-gray-600">{userItem.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <SafeIcon icon={FiLock} className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-500 font-mono">{userItem.password || 'password'}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      userItem.role === 'admin' ? 'bg-red-100 text-red-800' :
                      userItem.role === 'board' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {userItem.role === 'admin' ? t('admin') : userItem.role === 'board' ? t('boardMember') : t('cashier')}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEditingUser(userItem)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                      title={t('edit')}
                    >
                      <SafeIcon icon={FiEdit3} className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(userItem.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                      title={t('delete')}
                    >
                      <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <SafeIcon icon={FiUsers} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No users found</p>
                  <p className="text-sm text-gray-500 mt-2">Add your first user to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* User Permissions Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('userRolePermissions')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-red-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <SafeIcon icon={FiShield} className="w-5 h-5 text-red-600 mr-2" />
                  <h4 className="font-semibold text-red-800">{t('admin')}</h4>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• {t('fullAccess')}</li>
                  <li>• {t('userManagement')}</li>
                  <li>• Categories & items management</li>
                  <li>• Transaction approval</li>
                  <li>• All reports and analytics</li>
                  <li>• Platform configuration</li>
                </ul>
              </div>

              <div className="border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <SafeIcon icon={FiUsers} className="w-5 h-5 text-blue-600 mr-2" />
                  <h4 className="font-semibold text-blue-800">{t('boardMember')}</h4>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• View dashboard</li>
                  <li>• Create transactions</li>
                  <li>• View all transactions</li>
                  <li>• Generate reports</li>
                  <li>• Monthly reports</li>
                  <li>• Advanced filtering</li>
                </ul>
              </div>

              <div className="border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <SafeIcon icon={FiMail} className="w-5 h-5 text-green-600 mr-2" />
                  <h4 className="font-semibold text-green-800">{t('cashier')}</h4>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• View dashboard</li>
                  <li>• {t('approveTransactions')}</li>
                  <li>• View pending transactions</li>
                  <li>• Generate basic reports</li>
                  <li>• Monthly reports</li>
                  <li>• Transaction filtering</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* All Transactions Tab */}
      {activeTab === 'transactions' && (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <SafeIcon icon={FiDatabase} className="w-6 h-6 text-primary-600 mr-3" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">All Transactions ({transactions.length})</h2>
                  <p className="text-sm text-gray-600">Manage and delete transactions</p>
                </div>
              </div>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <SafeIcon icon={FiDatabase} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No transactions found</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="font-medium text-gray-900">{transaction.description}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          transaction.type === 'income' ? 'bg-success-100 text-success-800' : 'bg-danger-100 text-danger-800'
                        }`}>
                          {transaction.type}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          transaction.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' :
                          transaction.approvalStatus === 'disapproved' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {transaction.approvalStatus}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>${parseFloat(transaction.amount || 0).toLocaleString()}</span>
                        <span>{getCategoryName(transaction.categoryId)} • {getItemName(transaction.itemId)}</span>
                        <span>By: {transaction.submittedBy}</span>
                        <span>{new Date(transaction.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTransaction(transaction)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete Transaction"
                    >
                      <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h2>
            <form onSubmit={categoryForm.handleSubmit(editingCategory ? onUpdateCategory : onAddCategory)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    {...categoryForm.register('name', { required: 'Category name is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter category name"
                  />
                  {categoryForm.formState.errors.name && (
                    <p className="mt-1 text-sm text-red-600">{categoryForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    {...categoryForm.register('type', { required: 'Type is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select type</option>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                  {categoryForm.formState.errors.type && (
                    <p className="mt-1 text-sm text-red-600">{categoryForm.formState.errors.type.message}</p>
                  )}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  <SafeIcon icon={editingCategory ? FiSave : FiPlus} className="w-4 h-4 mr-2" />
                  {editingCategory ? 'Update Category' : 'Add Category'}
                </button>
                {editingCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategory(null);
                      categoryForm.reset();
                    }}
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    <SafeIcon icon={FiX} className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Existing Categories</h2>
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">{category.name}</span>
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      category.type === 'income' ? 'bg-success-100 text-success-800' : 'bg-danger-100 text-danger-800'
                    }`}>
                      {category.type}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEditingCategory(category)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <SafeIcon icon={FiEdit3} className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Items Tab */}
      {activeTab === 'items' && (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </h2>
            <form onSubmit={itemForm.handleSubmit(editingItem ? onUpdateItem : onAddItem)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    {...itemForm.register('categoryId', { required: 'Category is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {itemForm.formState.errors.categoryId && (
                    <p className="mt-1 text-sm text-red-600">{itemForm.formState.errors.categoryId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    {...itemForm.register('name', { required: 'Item name is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter item name"
                  />
                  {itemForm.formState.errors.name && (
                    <p className="mt-1 text-sm text-red-600">{itemForm.formState.errors.name.message}</p>
                  )}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  <SafeIcon icon={editingItem ? FiSave : FiPlus} className="w-4 h-4 mr-2" />
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
                {editingItem && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(null);
                      itemForm.reset();
                    }}
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    <SafeIcon icon={FiX} className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Existing Items</h2>
            <div className="space-y-2">
              {items.map((item) => {
                const category = categories.find(c => c.id === item.categoryId);
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">{item.name}</span>
                      <span className="ml-2 text-sm text-gray-600">
                        ({category?.name || 'Unknown Category'})
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEditingItem(item)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <SafeIcon icon={FiEdit3} className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Platform Buttons Tab */}
      {activeTab === 'buttons' && (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Platform Button</h2>
            <form onSubmit={buttonForm.handleSubmit(onAddButton)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Button Text *
                  </label>
                  <input
                    type="text"
                    {...buttonForm.register('text', { required: 'Button text is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter button text"
                  />
                  {buttonForm.formState.errors.text && (
                    <p className="mt-1 text-sm text-red-600">{buttonForm.formState.errors.text.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL *
                  </label>
                  <input
                    type="url"
                    {...buttonForm.register('url', { required: 'URL is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="https://example.com"
                  />
                  {buttonForm.formState.errors.url && (
                    <p className="mt-1 text-sm text-red-600">{buttonForm.formState.errors.url.message}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                <SafeIcon icon={FiPlus} className="w-4 h-4 mr-2" />
                Add Button
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Existing Platform Buttons</h2>
            <div className="space-y-2">
              {platformButtons.map((button) => (
                <div key={button.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">{button.text}</span>
                    <span className="ml-2 text-sm text-gray-600">{button.url}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteButton(button.id)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Disapproved Transactions Tab */}
      {activeTab === 'disapproved' && (
        <motion.div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Disapproved Transactions ({disapprovedTransactions.length})
          </h2>
          {disapprovedTransactions.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No disapproved transactions</p>
          ) : (
            <div className="space-y-3">
              {disapprovedTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-600">
                      ${parseFloat(transaction.amount || 0).toLocaleString()} • {transaction.submittedBy}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteTransaction(transaction)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Modals */}
      {showClearDbModal && <ClearDatabaseModal />}
      {showDeleteTransactionModal && <DeleteTransactionModal />}
    </div>
  );
};

export default AdminPanel;