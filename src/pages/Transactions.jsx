import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../components/common/SafeIcon';
import { useData } from '../contexts/DataContext';
import { format } from 'date-fns';

const { FiFilter, FiDownload, FiEye, FiDollarSign, FiCalendar, FiUser } = FiIcons;

const Transactions = () => {
  const { transactions, categories, items } = useData();
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    approvalStatus: '',
    official: '',
    count: ''
  });

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const getItemName = (itemId) => {
    const item = items.find(i => i.id === itemId);
    return item?.name || 'Unknown';
  };

  const filteredTransactions = transactions.filter(transaction => {
    return (
      (!filters.type || transaction.type === filters.type) &&
      (!filters.status || transaction.status === filters.status) &&
      (!filters.approvalStatus || transaction.approvalStatus === filters.approvalStatus) &&
      (!filters.official || transaction.official.toString() === filters.official) &&
      (!filters.count || transaction.count.toString() === filters.count)
    );
  });

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Item', 'Description', 'Amount', 'Status', 'Official', 'Count', 'Submitted By', 'Approval Status'];
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
    a.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
            <p className="mt-2 text-gray-600">View and manage all transactions</p>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <SafeIcon icon={FiDownload} className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex items-center mb-4">
          <SafeIcon icon={FiFilter} className="w-5 h-5 text-gray-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>

          <select
            value={filters.approvalStatus}
            onChange={(e) => setFilters({ ...filters, approvalStatus: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Approvals</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="disapproved">Disapproved</option>
          </select>

          <select
            value={filters.official}
            onChange={(e) => setFilters({ ...filters, official: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Official</option>
            <option value="true">Official</option>
            <option value="false">Unofficial</option>
          </select>

          <select
            value={filters.count}
            onChange={(e) => setFilters({ ...filters, count: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Count</option>
            <option value="true">Counted</option>
            <option value="false">Not Counted</option>
          </select>
        </div>
      </motion.div>

      {/* Transactions List */}
      <motion.div
        className="bg-white rounded-lg shadow-sm border border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            All Transactions ({filteredTransactions.length})
          </h2>
        </div>

        <div className="p-6">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No transactions found matching your filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <div className={`p-2 rounded-full ${
                          transaction.type === 'income' ? 'bg-success-50' : 'bg-danger-50'
                        }`}>
                          <SafeIcon 
                            icon={FiDollarSign} 
                            className={`w-4 h-4 ${
                              transaction.type === 'income' ? 'text-success-600' : 'text-danger-600'
                            }`} 
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{transaction.description}</h3>
                          <p className="text-sm text-gray-600">
                            {getCategoryName(transaction.categoryId)} • {getItemName(transaction.itemId)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div className="flex items-center">
                          <SafeIcon icon={FiDollarSign} className="w-4 h-4 mr-1" />
                          <span className={`font-semibold ${
                            transaction.type === 'income' ? 'text-success-600' : 'text-danger-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <SafeIcon icon={FiUser} className="w-4 h-4 mr-1" />
                          <span>{transaction.submittedBy}</span>
                        </div>
                        <div className="flex items-center">
                          <SafeIcon icon={FiCalendar} className="w-4 h-4 mr-1" />
                          <span>{format(new Date(transaction.createdAt), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            transaction.approvalStatus === 'approved' ? 'bg-success-100 text-success-800' :
                            transaction.approvalStatus === 'disapproved' ? 'bg-danger-100 text-danger-800' :
                            'bg-warning-100 text-warning-800'
                          }`}>
                            {transaction.approvalStatus}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            transaction.status === 'paid' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {transaction.status}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            transaction.official ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {transaction.official ? 'Official' : 'Unofficial'}
                          </span>
                          {transaction.count && (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                              Counted
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Transactions;