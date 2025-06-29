import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useAuth } from '../../contexts/AuthContext';
import clsx from 'clsx';

const { FiHome, FiDollarSign, FiPlus, FiCheckSquare, FiFileText, FiCalendar, FiFilter, FiSettings, FiExternalLink, FiX } = FiIcons;

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  const getMenuItems = () => {
    const baseItems = [
      { path: '/dashboard', label: 'Dashboard', icon: FiHome, roles: ['admin', 'board', 'cashier'] },
      { path: '/transactions', label: 'Transactions', icon: FiDollarSign, roles: ['admin', 'board'] },
      { path: '/create-transaction', label: 'Create Transaction', icon: FiPlus, roles: ['admin', 'board'] },
      { path: '/cashier-panel', label: 'Cashier Panel', icon: FiCheckSquare, roles: ['cashier', 'admin'] },
      { path: '/reports', label: 'Reports', icon: FiFileText, roles: ['admin', 'board', 'cashier'] },
      { path: '/monthly-report', label: 'Monthly Report', icon: FiCalendar, roles: ['admin', 'board', 'cashier'] },
      { path: '/super-filter', label: 'Super Filter', icon: FiFilter, roles: ['admin', 'board', 'cashier'] },
      { path: '/platform', label: 'Platform', icon: FiExternalLink, roles: ['admin', 'board', 'cashier'] },
      { path: '/admin-panel', label: 'Admin Panel', icon: FiSettings, roles: ['admin'] }
    ];

    return baseItems.filter(item => item.roles.includes(user?.role));
  };

  const menuItems = getMenuItems();

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
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <SafeIcon icon={FiDollarSign} className="w-5 h-5 text-white" />
            </div>
            <span className="ml-3 text-lg font-semibold text-gray-900">Finance</span>
          </div>
          
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <SafeIcon icon={FiX} className="w-5 h-5" />
          </button>
        </div>

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
                    location.pathname === item.path ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                  )} 
                />
                {item.label}
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