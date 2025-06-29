import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../components/common/SafeIcon';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { format } from 'date-fns';

const { FiDollarSign, FiTrendingUp, FiTrendingDown, FiClock, FiCheckCircle, FiAlertCircle } = FiIcons;

const Dashboard = () => {
  const { user } = useAuth();
  const { transactions } = useData();

  const approvedTransactions = transactions.filter(t => t.approvalStatus === 'approved');
  const pendingTransactions = transactions.filter(t => t.approvalStatus === 'pending');
  
  const totalIncome = approvedTransactions
    .filter(t => t.type === 'income' && t.count)
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    
  const totalExpenses = approvedTransactions
    .filter(t => t.type === 'expense' && t.count)
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    
  const currentBalance = totalIncome - totalExpenses;
  
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const stats = [
    {
      title: 'Current Balance',
      value: `$${currentBalance.toLocaleString()}`,
      icon: FiDollarSign,
      color: currentBalance >= 0 ? 'text-success-600' : 'text-danger-600',
      bgColor: currentBalance >= 0 ? 'bg-success-50' : 'bg-danger-50'
    },
    {
      title: 'Total Income',
      value: `$${totalIncome.toLocaleString()}`,
      icon: FiTrendingUp,
      color: 'text-success-600',
      bgColor: 'bg-success-50'
    },
    {
      title: 'Total Expenses',
      value: `$${totalExpenses.toLocaleString()}`,
      icon: FiTrendingDown,
      color: 'text-danger-600',
      bgColor: 'bg-danger-50'
    },
    {
      title: 'Pending Approvals',
      value: pendingTransactions.length,
      icon: FiClock,
      color: 'text-warning-600',
      bgColor: 'bg-warning-50'
    }
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back, {user?.name}!</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <SafeIcon icon={stat.icon} className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Transactions */}
      <motion.div
        className="bg-white rounded-lg shadow-sm border border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
        </div>
        <div className="p-6">
          {recentTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No transactions yet</p>
          ) : (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'income' ? 'bg-success-50' : 'bg-danger-50'
                    }`}>
                      <SafeIcon 
                        icon={transaction.type === 'income' ? FiTrendingUp : FiTrendingDown} 
                        className={`w-4 h-4 ${
                          transaction.type === 'income' ? 'text-success-600' : 'text-danger-600'
                        }`} 
                      />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(transaction.createdAt), 'MMM d, yyyy')} • {transaction.submittedBy}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${
                      transaction.type === 'income' ? 'text-success-600' : 'text-danger-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount || 0).toLocaleString()}
                    </p>
                    <div className="flex items-center mt-1">
                      <SafeIcon 
                        icon={transaction.approvalStatus === 'approved' ? FiCheckCircle : FiAlertCircle} 
                        className={`w-3 h-3 mr-1 ${
                          transaction.approvalStatus === 'approved' ? 'text-success-500' : 'text-warning-500'
                        }`} 
                      />
                      <span className={`text-xs capitalize ${
                        transaction.approvalStatus === 'approved' ? 'text-success-600' : 'text-warning-600'
                      }`}>
                        {transaction.approvalStatus}
                      </span>
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

export default Dashboard;