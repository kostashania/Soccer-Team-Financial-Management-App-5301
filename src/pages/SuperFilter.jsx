import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../components/common/SafeIcon';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { format } from 'date-fns';

const { FiFilter, FiDownload, FiRefreshCw, FiSearch } = FiIcons;

const SuperFilter = () => {
  const { transactions, categories, items, users } = useData();
  const { t } = useLanguage();
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    type: '',
    status: '',
    approvalStatus: '',
    official: '',
    count: '',
    submittedBy: '',
    categoryId: '',
    itemId: ''
  });

  // Debug logs to understand the data structure
  console.log('Categories:', categories);
  console.log('Transactions:', transactions);
  
  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.createdAt);
    const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
    const toDate = filters.dateTo ? new Date(filters.dateTo) : null;
    
    console.log('Filtering transaction:', {
      id: transaction.id,
      categoryId: transaction.categoryId,
      filterCategoryId: filters.categoryId,
      isMatch: !filters.categoryId || transaction.categoryId === filters.categoryId
    });
    
    return (
      (!fromDate || transactionDate >= fromDate) &&
      (!toDate || transactionDate <= toDate) &&
      (!filters.type || transaction.type === filters.type) &&
      (!filters.status || transaction.status === filters.status) &&
      (!filters.approvalStatus || transaction.approvalStatus === filters.approvalStatus) &&
      (!filters.official || transaction.official.toString() === filters.official) &&
      (!filters.count || transaction.count.toString() === filters.count) &&
      (!filters.submittedBy || transaction.submittedBy === filters.submittedBy) &&
      // Fix: Comparing string to string, not trying to parse as integer
      (!filters.categoryId || transaction.categoryId === filters.categoryId) &&
      (!filters.itemId || transaction.itemId === filters.itemId)
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

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      type: '',
      status: '',
      approvalStatus: '',
      official: '',
      count: '',
      submittedBy: '',
      categoryId: '',
      itemId: ''
    });
  };

  const exportToCSV = () => {
    const headers = [
      'Date', 'Type', 'Category', 'Item', 'Description', 'Amount',
      'Status', 'Official', 'Count', 'Submitted By', 'Approval Status'
    ];

    const csvData = filteredTransactions.map(t => [
      format(new Date(t.createdAt), 'yyyy-MM-dd'),
      t.type,
      getCategoryName(t.categoryId),
      getItemName(t.itemId),
      t.description,
      t.amount,
      t.status,
      t.official ? 'Yes' : 'No',
      t.count ? 'Yes' : 'No',
      t.submittedBy,
      t.approvalStatus
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filtered-transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    // For a real implementation, you'd use the xlsx library here
    exportToCSV(); // Fallback to CSV for now
  };

  const filteredCategories = filters.type
    ? categories.filter(cat => cat.type === filters.type)
    : categories;

  const filteredItems = filters.categoryId
    ? items.filter(item => item.categoryId === filters.categoryId)
    : items;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('superFilter')}</h1>
            <p className="mt-2 text-gray-600">Advanced transaction filtering and export</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={exportToCSV}
              className="flex items-center px-4 py-2 bg-success-600 text-white rounded-md hover:bg-success-700 transition-colors"
            >
              <SafeIcon icon={FiDownload} className="w-4 h-4 mr-2" />
              CSV
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              <SafeIcon icon={FiDownload} className="w-4 h-4 mr-2" />
              Excel
            </button>
          </div>
        </div>
      </motion.div>

      {/* Advanced Filters */}
      <motion.div
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <SafeIcon icon={FiFilter} className="w-5 h-5 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Advanced {t('filter')}</h2>
          </div>
          <button
            onClick={clearFilters}
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <SafeIcon icon={FiRefreshCw} className="w-4 h-4 mr-1" />
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('type')}</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value, categoryId: '', itemId: '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Types</option>
              <option value="income">{t('income')}</option>
              <option value="expense">{t('expense')}</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('category')}</label>
            <select
              value={filters.categoryId}
              onChange={(e) => setFilters({ ...filters, categoryId: e.target.value, itemId: '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Categories</option>
              {filteredCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Item */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('item')}</label>
            <select
              value={filters.itemId}
              onChange={(e) => setFilters({ ...filters, itemId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={!filters.categoryId}
            >
              <option value="">All Items</option>
              {filteredItems.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment {t('status')}</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Status</option>
              <option value="paid">{t('paid')}</option>
              <option value="pending">{t('pending')}</option>
            </select>
          </div>

          {/* Approval Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Approval {t('status')}</label>
            <select
              value={filters.approvalStatus}
              onChange={(e) => setFilters({ ...filters, approvalStatus: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Approvals</option>
              <option value="pending">{t('pending')}</option>
              <option value="approved">{t('approved')}</option>
              <option value="disapproved">{t('disapproved')}</option>
            </select>
          </div>

          {/* Official */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('official')}</label>
            <select
              value={filters.official}
              onChange={(e) => setFilters({ ...filters, official: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All</option>
              <option value="true">{t('official')}</option>
              <option value="false">{t('unofficial')}</option>
            </select>
          </div>

          {/* Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Count in Cash</label>
            <select
              value={filters.count}
              onChange={(e) => setFilters({ ...filters, count: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All</option>
              <option value="true">Counted</option>
              <option value="false">Not Counted</option>
            </select>
          </div>

          {/* Submitted By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Submitted By</label>
            <select
              value={filters.submittedBy}
              onChange={(e) => setFilters({ ...filters, submittedBy: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Users</option>
              {users.map(user => (
                <option key={user.id} value={user.name}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Results Summary */}
      <motion.div
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <SafeIcon icon={FiSearch} className="w-5 h-5 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              Filter Results ({filteredTransactions.length} {t('transactions')})
            </h2>
          </div>
          {filteredTransactions.length > 0 && (
            <div className="text-sm text-gray-600">
              Total Amount: ${filteredTransactions.reduce((sum, t) => sum + (t.type === 'income' ? parseFloat(t.amount || 0) : -parseFloat(t.amount || 0)), 0).toLocaleString()}
            </div>
          )}
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No transactions match your filter criteria</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <h3 className="font-medium text-gray-900">{transaction.description}</h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        transaction.type === 'income'
                          ? 'bg-success-100 text-success-800'
                          : 'bg-danger-100 text-danger-800'
                      }`}
                    >
                      {t(transaction.type)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{getCategoryName(transaction.categoryId)} • {getItemName(transaction.itemId)}</span>
                    <span>{transaction.submittedBy}</span>
                    <span>{format(new Date(transaction.createdAt), 'MMM d, yyyy')}</span>
                    <span
                      className={`capitalize ${
                        transaction.approvalStatus === 'approved'
                          ? 'text-success-600'
                          : transaction.approvalStatus === 'disapproved'
                          ? 'text-danger-600'
                          : 'text-warning-600'
                      }`}
                    >
                      {t(transaction.approvalStatus)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      transaction.type === 'income' ? 'text-success-600' : 'text-danger-600'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount || 0).toLocaleString()}
                  </p>
                  <div className="flex space-x-1 mt-1">
                    <span
                      className={`px-1 py-0.5 text-xs rounded ${
                        transaction.status === 'paid' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {t(transaction.status)}
                    </span>
                    <span
                      className={`px-1 py-0.5 text-xs rounded ${
                        transaction.official ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {transaction.official ? t('official') : t('unofficial')}
                    </span>
                    {transaction.count && (
                      <span className="px-1 py-0.5 text-xs rounded bg-green-100 text-green-700">
                        Counted
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SuperFilter;