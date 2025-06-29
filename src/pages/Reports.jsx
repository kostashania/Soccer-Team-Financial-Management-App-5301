import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../components/common/SafeIcon';
import { useData } from '../contexts/DataContext';

const { FiBarChart3, FiTrendingUp, FiTrendingDown, FiDollarSign } = FiIcons;

const Reports = () => {
  const { transactions, categories, items } = useData();
  const [activeView, setActiveView] = useState('official');

  const approvedTransactions = transactions.filter(t => t.approvalStatus === 'approved');
  
  const officialTransactions = approvedTransactions.filter(t => t.official);
  const unofficialTransactions = approvedTransactions.filter(t => !t.official);
  const cashTransactions = approvedTransactions.filter(t => t.count);

  const calculateTotals = (transactionList) => {
    const income = transactionList
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    
    const expenses = transactionList
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    
    return { income, expenses, balance: income - expenses };
  };

  const officialTotals = calculateTotals(officialTransactions);
  const unofficialTotals = calculateTotals(unofficialTransactions);
  const cashTotals = calculateTotals(cashTransactions);

  const views = [
    { id: 'official', label: 'Official Transactions', data: officialTransactions, totals: officialTotals },
    { id: 'unofficial', label: 'Unofficial Transactions', data: unofficialTransactions, totals: unofficialTotals },
    { id: 'cash', label: 'Cash Summary', data: cashTransactions, totals: cashTotals }
  ];

  const activeViewData = views.find(v => v.id === activeView);

  const getCategoryBreakdown = (transactionList) => {
    const breakdown = {};
    transactionList.forEach(transaction => {
      const category = categories.find(c => c.id === transaction.categoryId);
      const categoryName = category?.name || 'Unknown';
      
      if (!breakdown[categoryName]) {
        breakdown[categoryName] = { income: 0, expense: 0 };
      }
      
      if (transaction.type === 'income') {
        breakdown[categoryName].income += parseFloat(transaction.amount || 0);
      } else {
        breakdown[categoryName].expense += parseFloat(transaction.amount || 0);
      }
    });
    
    return breakdown;
  };

  const categoryBreakdown = getCategoryBreakdown(activeViewData.data);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="mt-2 text-gray-600">Financial reports and summaries</p>
      </motion.div>

      {/* View Selector */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeView === view.id
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-success-50">
              <SafeIcon icon={FiTrendingUp} className="w-6 h-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Income</p>
              <p className="text-2xl font-bold text-success-600">
                ${activeViewData.totals.income.toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-danger-50">
              <SafeIcon icon={FiTrendingDown} className="w-6 h-6 text-danger-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-danger-600">
                ${activeViewData.totals.expenses.toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${
              activeViewData.totals.balance >= 0 ? 'bg-success-50' : 'bg-danger-50'
            }`}>
              <SafeIcon icon={FiDollarSign} className={`w-6 h-6 ${
                activeViewData.totals.balance >= 0 ? 'text-success-600' : 'text-danger-600'
              }`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Net Balance</p>
              <p className={`text-2xl font-bold ${
                activeViewData.totals.balance >= 0 ? 'text-success-600' : 'text-danger-600'
              }`}>
                ${activeViewData.totals.balance.toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Category Breakdown */}
      <motion.div
        className="bg-white rounded-lg shadow-sm border border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <SafeIcon icon={FiBarChart3} className="w-5 h-5 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Category Breakdown</h2>
          </div>
        </div>
        
        <div className="p-6">
          {Object.keys(categoryBreakdown).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No data available for the selected view</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(categoryBreakdown).map(([category, data]) => (
                <div key={category} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">{category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Income</p>
                      <p className="text-lg font-semibold text-success-600">
                        ${data.income.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Expenses</p>
                      <p className="text-lg font-semibold text-danger-600">
                        ${data.expense.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Net</p>
                      <p className={`text-lg font-semibold ${
                        (data.income - data.expense) >= 0 ? 'text-success-600' : 'text-danger-600'
                      }`}>
                        ${(data.income - data.expense).toLocaleString()}
                      </p>
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

export default Reports;