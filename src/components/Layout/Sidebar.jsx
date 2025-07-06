import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import AppLogo from '../common/AppLogo';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import clsx from 'clsx';

const {
  FiHome, FiDollarSign, FiPlus, FiCheckSquare, FiFileText, FiCalendar,
  FiFilter, FiSettings, FiExternalLink, FiX, FiCreditCard, FiAlertTriangle
} = FiIcons;

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isExpiringSoon, isExpired } = useSubscription();
  const location = useLocation();

  const getMenuItems = () => {
    const baseItems = [
      { path: '/dashboard', label: t('dashboard'), icon: FiHome, roles: ['admin', 'board', 'cashier'] },
      { path: '/transactions', label: t('transactions'), icon: FiDollarSign, roles: ['admin', 'board'] },
      { path: '/create-transaction', label: t('createTransaction'), icon: FiPlus, roles: ['admin', 'board'] },
      { path: '/cashier-panel', label: t('cashierPanel'), icon: FiCheckSquare, roles: ['cashier', 'admin'] },
      { path: '/reports', label: t('reports'), icon: FiFileText, roles: ['admin', 'board', 'cashier'] },
      { path: '/monthly-report', label: t('monthlyReport'), icon: FiCalendar, roles: ['admin', 'board', 'cashier'] },
      { path: '/super-filter', label: t('superFilter'), icon: FiFilter, roles: ['admin', 'board', 'cashier'] },
      { path: '/platform', label: t('platform'), icon: FiExternalLink, roles: ['admin', 'board', 'cashier'] },
      { path: '/subscription', label: 'Subscription', icon: FiCreditCard, roles: ['admin', 'board'] },
      { path: '/admin-panel', label: t('adminPanel'), icon: FiSettings, roles: ['admin'] }
    ];

    return baseItems.filter(item => item.roles.includes(user?.role));
  };

  const menuItems = getMenuItems();
  const showSubscriptionAlert = (isExpiringSoon() || isExpired()) && ['admin', 'board'].includes(user?.role);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <motion.div
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        initial={{ x: -256 }}
        animate={{ x: isOpen || window.innerWidth >= 1024 ? 0 : -256 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <AppLogo size="sm" />
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <SafeIcon icon={FiX} className="w-5 h-5" />
          </button>
        </div>

        {/* Subscription Alert */}
        {showSubscriptionAlert && (
          <div className="m-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <SafeIcon icon={FiAlertTriangle} className="w-4 h-4 text-red-600 mr-2" />
              <div>
                <p className="text-xs font-medium text-red-900">
                  {isExpired() ? 'Subscription Expired' : 'Expiring Soon'}
                </p>
                <NavLink
                  to="/subscription"
                  className="text-xs text-red-700 hover:text-red-800 underline"
                  onClick={onClose}
                >
                  Renew now
                </NavLink>
              </div>
            </div>
          </div>
        )}

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  clsx(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive || location.pathname === item.path
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  )
                }
              >
                <SafeIcon
                  icon={item.icon}
                  className={clsx(
                    'mr-3 flex-shrink-0 h-5 w-5',
                    location.pathname === item.path
                      ? 'text-primary-500'
                      : 'text-gray-400 group-hover:text-gray-500'
                  )}
                />
                {item.label}
                {item.path === '/subscription' && showSubscriptionAlert && (
                  <div className="ml-auto w-2 h-2 bg-red-500 rounded-full"></div>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            © 2024 Soccer Team Finance
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;