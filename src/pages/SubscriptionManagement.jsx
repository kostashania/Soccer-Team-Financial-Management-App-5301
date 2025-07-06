import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../components/common/SafeIcon';
import SubscriptionDashboard from '../components/tenant/SubscriptionDashboard';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const { FiCreditCard } = FiIcons;

const SubscriptionManagement = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  // Only allow admin and board members to access subscription management
  if (!user || !['admin', 'board'].includes(user.role)) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Access denied. Admin or Board member role required.</p>
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
        <div className="flex items-center space-x-3">
          <SafeIcon icon={FiCreditCard} className="w-8 h-8 text-primary-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
            <p className="mt-2 text-gray-600">Manage your subscription and billing</p>
          </div>
        </div>
      </motion.div>

      <SubscriptionDashboard />
    </div>
  );
};

export default SubscriptionManagement;