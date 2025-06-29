import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../components/common/SafeIcon';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import toast from 'react-hot-toast';

const { FiPlus, FiTrash2, FiSettings, FiUsers, FiTag, FiList, FiExternalLink } = FiIcons;

const AdminPanel = () => {
  const { user } = useAuth();
  const { categories, items, platformButtons, transactions, addCategory, addItem, addPlatformButton, deletePlatformButton, deleteTransaction } = useData();
  const [activeTab, setActiveTab] = useState('categories');

  const categoryForm = useForm();
  const itemForm = useForm();
  const buttonForm = useForm();

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Access denied. Admin role required.</p>
      </div>
    );
  }

  const onAddCategory = (data) => {
    addCategory(data);
    categoryForm.reset();
    toast.success('Category added successfully!');
  };

  const onAddItem = (data) => {
    addItem({ ...data, categoryId: parseInt(data.categoryId) });
    itemForm.reset();
    toast.success('Item added successfully!');
  };

  const onAddButton = (data) => {
    addPlatformButton(data);
    buttonForm.reset();
    toast.success('Platform button added successfully!');
  };

  const handleDeleteButton = (id) => {
    if (confirm('Are you sure you want to delete this button?')) {
      deletePlatformButton(id);
      toast.success('Button deleted successfully!');
    }
  };

  const handleDeleteTransaction = (id) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      deleteTransaction(id);
      toast.success('Transaction deleted successfully!');
    }
  };

  const disapprovedTransactions = transactions.filter(t => t.approvalStatus === 'disapproved');

  const tabs = [
    { id: 'categories', label: 'Categories', icon: FiTag },
    { id: 'items', label: 'Items', icon: FiList },
    { id: 'buttons', label: 'Platform Buttons', icon: FiExternalLink },
    { id: 'users', label: 'Users', icon: FiUsers },
    { id: 'disapproved', label: 'Disapproved', icon: FiTrash2 }
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="mt-2 text-gray-600">Manage system configuration and data</p>
      </motion.div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
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

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Category</h2>
            <form onSubmit={categoryForm.handleSubmit(onAddCategory)} className="space-y-4">
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
              <button
                type="submit"
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                <SafeIcon icon={FiPlus} className="w-4 h-4 mr-2" />
                Add Category
              </button>
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Item</h2>
            <form onSubmit={itemForm.handleSubmit(onAddItem)} className="space-y-4">
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
              <button
                type="submit"
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                <SafeIcon icon={FiPlus} className="w-4 h-4 mr-2" />
                Add Item
              </button>
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

      {/* Users Tab */}
      {activeTab === 'users' && (
        <motion.div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">User Management</h2>
          <p className="text-gray-600 mb-4">User role management will be implemented in a future version.</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              Currently using demo users. In production, this would integrate with your authentication system.
            </p>
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
                    onClick={() => handleDeleteTransaction(transaction.id)}
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
    </div>
  );
};

export default AdminPanel;