import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import PaymentModal from './PaymentModal';

const { 
  FiCalendar, FiDollarSign, FiPackage, FiCreditCard, FiAlertTriangle, 
  FiCheckCircle, FiClock, FiX, FiShoppingCart, FiInfo, FiRefreshCw, 
  FiUsers, FiStar, FiZap
} = FiIcons;

const SubscriptionDashboard = () => {
  const { user, tenant } = useAuth();
  const { 
    currentSubscription, 
    subscriptionHistory, 
    packages, 
    loading, 
    createSubscription, 
    processPayment,
    isExpiringSoon,
    isExpired,
    getDaysUntilExpiry
  } = useSubscription();

  const [showPackages, setShowPackages] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingSubscription, setPendingSubscription] = useState(null);

  const daysUntilExpiry = getDaysUntilExpiry();
  const expiringSoon = isExpiringSoon(30);
  const expired = isExpired();

  const handleSubscribeToPackage = async (pkg) => {
    const result = await createSubscription(pkg.id);
    if (result.success) {
      setPendingSubscription(result.subscription);
      setShowPaymentModal(true);
      setShowPackages(false);
    }
  };

  const handlePaymentComplete = async (paymentMethod, paymentDetails) => {
    if (pendingSubscription) {
      const result = await processPayment(pendingSubscription.id, paymentMethod, paymentDetails);
      if (result.success) {
        setShowPaymentModal(false);
        setPendingSubscription(null);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending_payment': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <SafeIcon icon={FiRefreshCw} className="w-8 h-8 text-blue-500 animate-spin mr-3" />
        <span>Loading subscription information...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subscription Status Alert */}
      {expired && (
        <motion.div 
          className="bg-red-50 border border-red-200 rounded-lg p-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center">
            <SafeIcon icon={FiAlertTriangle} className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-900">Subscription Expired</h3>
              <p className="text-sm text-red-700 mt-1">
                Your subscription expired {Math.abs(daysUntilExpiry)} days ago. Please renew to continue using our services.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {expiringSoon && !expired && (
        <motion.div 
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center">
            <SafeIcon icon={FiClock} className="w-5 h-5 text-yellow-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-900">Subscription Expiring Soon</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Your subscription expires in {daysUntilExpiry} days. Consider renewing to avoid service interruption.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Current Subscription */}
      <motion.div 
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Current Subscription</h2>
            <p className="text-gray-600 mt-1">Manage your subscription and billing</p>
          </div>
          <button 
            onClick={() => setShowPackages(!showPackages)} 
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <SafeIcon icon={FiShoppingCart} className="w-4 h-4 mr-2" />
            {currentSubscription ? 'Upgrade/Renew' : 'Subscribe Now'}
          </button>
        </div>

        {currentSubscription ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Package</label>
                <p className="text-lg font-semibold text-gray-900">
                  {currentSubscription.package?.name || 'Custom Package'}
                </p>
                {currentSubscription.is_custom && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full mt-1">
                    Custom
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(currentSubscription.status)}`}>
                  {currentSubscription.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Price</label>
                <p className="text-lg font-semibold text-gray-900">
                  €{currentSubscription.price.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">
                  for {currentSubscription.duration_months} month{currentSubscription.duration_months > 1 ? 's' : ''}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Payment Method</label>
                <p className="text-sm text-gray-900">
                  {currentSubscription.payment_method || 'Not set'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
                <p className="text-sm text-gray-900">
                  {format(new Date(currentSubscription.start_date), 'MMM d, yyyy')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
                <p className={`text-sm font-medium ${expired ? 'text-red-600' : expiringSoon ? 'text-yellow-600' : 'text-gray-900'}`}>
                  {format(new Date(currentSubscription.end_date), 'MMM d, yyyy')}
                </p>
                {daysUntilExpiry !== null && (
                  <p className="text-xs text-gray-500">
                    {expired 
                      ? `${Math.abs(daysUntilExpiry)} days ago` 
                      : daysUntilExpiry === 0 
                        ? 'Expires today' 
                        : `${daysUntilExpiry} days remaining`}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <SafeIcon icon={FiPackage} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Subscription</h3>
            <p className="text-gray-600 mb-4">
              You don't have an active subscription. Choose a plan to get started.
            </p>
          </div>
        )}
      </motion.div>

      {/* Available Packages */}
      {showPackages && (
        <motion.div 
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Available Packages</h3>
            <button 
              onClick={() => setShowPackages(false)} 
              className="text-gray-400 hover:text-gray-600"
            >
              <SafeIcon icon={FiX} className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <motion.div 
                key={pkg.id} 
                className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all"
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-center mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">{pkg.name}</h4>
                  {pkg.description && (
                    <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                  )}
                </div>

                <div className="text-center mb-6">
                  <div className="flex items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900">€{pkg.price.toFixed(0)}</span>
                    <span className="text-gray-600 ml-1">/{pkg.duration_months}mo</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    €{(pkg.price / pkg.duration_months).toFixed(2)} per month
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <SafeIcon icon={FiCalendar} className="w-4 h-4 mr-2" />
                    <span>{pkg.duration_months} month subscription</span>
                  </div>
                  {pkg.max_users ? (
                    <div className="flex items-center text-sm text-gray-600">
                      <SafeIcon icon={FiUsers} className="w-4 h-4 mr-2" />
                      <span>Up to {pkg.max_users} users</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-gray-600">
                      <SafeIcon icon={FiUsers} className="w-4 h-4 mr-2" />
                      <span>Unlimited users</span>
                    </div>
                  )}
                </div>

                {pkg.features && pkg.features.length > 0 && (
                  <div className="mb-6">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Features:</h5>
                    <ul className="space-y-1">
                      {pkg.features.map((feature, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <SafeIcon icon={FiCheckCircle} className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button 
                  onClick={() => handleSubscribeToPackage(pkg)} 
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <SafeIcon icon={FiCreditCard} className="w-4 h-4 mr-2" />
                  Subscribe Now
                </button>
              </motion.div>
            ))}
          </div>

          {packages.length === 0 && (
            <div className="text-center py-8">
              <SafeIcon icon={FiPackage} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No packages available at the moment.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Subscription History */}
      <motion.div 
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription History</h3>

        {subscriptionHistory.length > 0 ? (
          <div className="space-y-4">
            {subscriptionHistory.map((subscription) => (
              <div key={subscription.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {subscription.package?.name || 'Custom Package'}
                      {subscription.is_custom && (
                        <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                          Custom
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      €{subscription.price.toFixed(2)} for {subscription.duration_months} months
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {format(new Date(subscription.start_date), 'MMM d, yyyy')} - {format(new Date(subscription.end_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(subscription.status)}`}>
                    {subscription.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <SafeIcon icon={FiClock} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No subscription history found.</p>
          </div>
        )}
      </motion.div>

      {/* Payment Modal */}
      <PaymentModal 
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setPendingSubscription(null);
        }}
        onPaymentComplete={handlePaymentComplete}
        subscription={pendingSubscription}
      />
    </div>
  );
};

export default SubscriptionDashboard;