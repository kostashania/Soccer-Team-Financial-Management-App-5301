import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../components/common/SafeIcon';
import { useData } from '../contexts/DataContext';
import { format, startOfMonth, endOfMonth, isSameMonth } from 'date-fns';

const { FiCalendar, FiDownload, FiTrendingUp, FiTrendingDown, FiDollarSign } = FiIcons;

const MonthlyReport = () => {
  const { transactions, categories } = useData();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const approvedTransactions = transactions.filter(t => t.approvalStatus === 'approved');
  
  const monthlyTransactions = approvedTransactions.filter(transaction => 
    isSameMonth(new Date(transaction.createdAt), selectedDate)
  );

  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const monthlyExpenses = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const netBalance = monthlyIncome - monthlyExpenses;

  const getCategoryBreakdown = () => {
    const breakdown = {};
    monthlyTransactions.forEach(transaction => {
      const category = categories.find(c => c.id === transaction.categoryId);
      const categoryName = category?.name || 'Unknown';
      
      if (!breakdown[categoryName]) {
        breakdown[categoryName] = { income: 0, expense: 0, transactions: [] };
      }
      
      breakdown[categoryName].transactions.push(transaction);
      
      if (transaction.type === 'income') {
        breakdown[categoryName].income += parseFloat(transaction.amount || 0);
      } else {
        breakdown[categoryName].expense += parseFloat(transaction.amount || 0);
      }
    });
    
    return breakdown;
  };

  const categoryBreakdown = getCategoryBreakdown();

  const exportToPDF = () => {
    // In a real implementation, you would use jsPDF here
    const reportData = {
      month: format(selectedDate, 'MMMM yyyy'),
      income: monthlyIncome,
      expenses: monthlyExpenses,
      balance: netBalance,
      categories: categoryBreakdown,
      transactionCount: monthlyTransactions.length
    };
    
    // For now, we'll create a simple text report
    const reportText = `
Monthly Financial Report - ${reportData.month}

SUMMARY:
Total Income: $${reportData.income.toLocaleString()}
Total Expenses: $${reportData.expenses.toLocaleString()}
Net Balance: $${reportData.balance.toLocaleString()}
Total Transactions: ${reportData.transactionCount}

CATEGORY BREAKDOWN:
${Object.entries(categoryBreakdown).map(([category, data]) => 
  `${category}:
  - Income: $${data.income.toLocaleString()}
  - Expenses: $${data.expense.toLocaleString()}
  - Net: $${(data.income - data.expense).toLocaleString()}
  - Transactions: ${data.transactions.length}`
).join('\n\n')}
    `;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monthly-report-${format(selectedDate, 'yyyy-MM')}.txt`;
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
            <h1 className="text-3xl font-bold text-gray-900">Monthly Report</h1>
            <p className="mt-2 text-gray-600">Detailed monthly financial analysis</p>
          </div>
          <div className="flex items-center space-x-4">
            <input
              type="month"
              value={format(selectedDate, 'yyyy-MM')}
              onChange={(e) => setSelectedDate(new Date(e.target.value + '-01'))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              onClick={exportToPDF}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              <SafeIcon icon={FiDownload} className="w-4 h-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>
      </motion.div>

      {/* Month Summary */}
      <motion.div
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex items-center mb-6">
          <SafeIcon icon={FiCalendar} className="w-6 h-6 text-primary-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">
            {format(selectedDate, 'MMMM yyyy')} Summary
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="p-4 bg-success-50 rounded-lg mb-3">
              <SafeIcon icon={FiTrendingUp} className="w-8 h-8 text-success-600 mx-auto" />
            </div>
            <p className="text-sm font-medium text-gray-600">Total Income</p>
            <p className="text-2xl font-bold text-success-600">
              ${monthlyIncome.toLocaleString()}
            </p>
          </div>

          <div className="text-center">
            <div className="p-4 bg-danger-50 rounded-lg mb-3">
              <SafeIcon icon={FiTrendingDown} className="w-8 h-8 text-danger-600 mx-auto" />
            </div>
            <p className="text-sm font-medium text-gray-600">Total Expenses</p>
            <p className="text-2xl font-bold text-danger-600">
              ${monthlyExpenses.toLocaleString()}
            </p>
          </div>

          <div className="text-center">
            <div className={`p-4 rounded-lg mb-3 ${
              netBalance >= 0 ? 'bg-success-50' : 'bg-danger-50'
            }`}>
              <SafeIcon icon={FiDollarSign} className={`w-8 h-8 mx-auto ${
                netBalance >= 0 ? 'text-success-600' : 'text-danger-600'
              }`} />
            </div>
            <p className="text-sm font-medium text-gray-600">Net Balance</p>
            <p className={`text-2xl font-bold ${
              netBalance >= 0 ? 'text-success-600' : 'text-danger-600'
            }`}>
              ${netBalance.toLocaleString()}
            </p>
          </div>

          <div className="text-center">
            <div className="p-4 bg-primary-50 rounded-lg mb-3">
              <SafeIcon icon={FiCalendar} className="w-8 h-8 text-primary-600 mx-auto" />
            </div>
            <p className="text-sm font-medium text-gray-600">Transactions</p>
            <p className="text-2xl font-bold text-primary-600">
              {monthlyTransactions.length}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Category Breakdown */}
      <motion.div
        className="bg-white rounded-lg shadow-sm border border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Category Breakdown</h2>
        </div>
        
        <div className="p-6">
          {Object.keys(categoryBreakdown).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No transactions found for {format(selectedDate, 'MMMM yyyy')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(categoryBreakdown).map(([category, data]) => (
                <div key={category} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">{category}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Transactions</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {data.transactions.length}
                      </p>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Transactions:</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {data.transactions.slice(0, 5).map((transaction) => (
                        <div key={transaction.id} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                          <span className="text-gray-700 truncate">{transaction.description}</span>
                          <span className={`font-medium ${
                            transaction.type === 'income' ? 'text-success-600' : 'text-danger-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount || 0).toLocaleString()}
                          </span>
                        </div>
                      ))}
                      {data.transactions.length > 5 && (
                        <p className="text-xs text-gray-500 text-center">
                          +{data.transactions.length - 5} more transactions
                        </p>
                      )}
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

export default MonthlyReport;