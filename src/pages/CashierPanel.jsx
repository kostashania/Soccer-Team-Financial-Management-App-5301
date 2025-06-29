import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../components/common/SafeIcon';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const { FiCheckCircle, FiXCircle, FiEye, FiDollarSign, FiCalendar, FiUser, FiFileText } = FiIcons;

const CashierPanel = () => {
  const { user } = useAuth();
  const { transactions, updateTransaction, categories, items } = useData();
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Only show pending transactions for approval
  const pendingTransactions = transactions.filter(t => t.approvalStatus === 'pending');

  const handleApprove = (transactionId) => {
    updateTransaction(transactionId, { 
      approvalStatus: 'approved',
      approvedBy: user?.name,
      approvedAt: new Date().toISOString()
    });
    toast.success('Transaction approved successfully!');
  };

  const handleDisapprove = (transactionId) => {
    updateTransaction(transactionId, { 
      approvalStatus: 'disapproved',
      disapprovedBy: user?.name,
      disapprovedAt: new Date().toISOString()
    });
    toast.success('Transaction disapproved');
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const getItemName = (itemId) => {
    const item = items.find(i => i.id === itemId);
    return item?.name || 'Unknown';
  };

  const TransactionModal = ({ transaction, onClose }) => {
    if (!transaction) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Transaction Details</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <SafeIcon icon={FiXCircle} className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Type</label>
                  <p className={`text-lg font-semibold capitalize ${
                    transaction.type === 'income' ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    {transaction.type}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Amount</label>
                  <p className="text-lg font-semibold text-gray-900">
                    ${parseFloat(transaction.amount || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">Description</label>
                <p className="text-gray-900">{transaction.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Category</label>
                  <p className="text-gray-900">{getCategoryName(transaction.categoryId)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Item</label>
                  <p className="text-gray-900">{getItemName(transaction.itemId)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Status</label>
                  <p className={`capitalize ${
                    transaction.status === 'paid' ? 'text-success-600' : 'text-warning-600'
                  }`}>
                    {transaction.status}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Submitted By</label>
                  <p className="text-gray-900">{transaction.submittedBy}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Official</label>
                  <p className="text-gray-900">{transaction.official ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Count in Cash</label>
                  <p className="text-gray-900">{transaction.count ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {transaction.status === 'pending' && transaction.expectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">Expected Date</label>
                  <p className="text-gray-900">
                    {format(new Date(transaction.expectedDate), 'MMM d, yyyy')}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-600">Created At</label>
                <p className="text-gray-900">
                  {format(new Date(transaction.createdAt), 'MMM d, yyyy HH:mm')}
                </p>
              </div>

              {transaction.attachments && transaction.attachments.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Attachments</label>
                  <div className="space-y-2">
                    {transaction.attachments.map((file, index) => (
                      <div key={index} className="flex items-center p-2 bg-gray-50 rounded">
                        <SafeIcon icon={FiFileText} className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-sm text-gray-700">{file.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6 pt-6 border-t">
              <button
                onClick={() => {
                  handleApprove(transaction.id);
                  onClose();
                }}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-success-600 text-white rounded-md hover:bg-success-700 transition-colors"
              >
                <SafeIcon icon={FiCheckCircle} className="w-4 h-4 mr-2" />
                Approve
              </button>
              <button
                onClick={() => {
                  handleDisapprove(transaction.id);
                  onClose();
                }}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-danger-600 text-white rounded-md hover:bg-danger-700 transition-colors"
              >
                <SafeIcon icon={FiXCircle} className="w-4 h-4 mr-2" />
                Disapprove
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  if (user?.role !== 'cashier' && user?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Access denied. Cashier role required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">Cashier Panel</h1>
        <p className="mt-2 text-gray-600">Review and approve pending transactions</p>
      </motion.div>

      <motion.div
        className="bg-white rounded-lg shadow-sm border border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Pending Approvals ({pendingTransactions.length})
          </h2>
        </div>

        <div className="p-6">
          {pendingTransactions.length === 0 ? (
            <div className="text-center py-8">
              <SafeIcon icon={FiCheckCircle} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No pending transactions to review</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingTransactions.map((transaction) => (
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
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedTransaction(transaction)}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                        title="View Details"
                      >
                        <SafeIcon icon={FiEye} className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleApprove(transaction.id)}
                        className="px-3 py-1 text-sm bg-success-600 text-white rounded-md hover:bg-success-700 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDisapprove(transaction.id)}
                        className="px-3 py-1 text-sm bg-danger-600 text-white rounded-md hover:bg-danger-700 transition-colors"
                      >
                        Disapprove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {selectedTransaction && (
        <TransactionModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
};

export default CashierPanel;