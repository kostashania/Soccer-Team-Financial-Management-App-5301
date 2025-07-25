import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import AppLogo from '../common/AppLogo';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

const { FiMenu, FiLogOut, FiUser, FiGlobe } = FiIcons;

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { language, changeLanguage, t } = useLanguage();

  const handleLanguageToggle = () => {
    const newLanguage = language === 'en' ? 'el' : 'en';
    console.log('Toggling language from', language, 'to', newLanguage);
    changeLanguage(newLanguage);
  };

  return (
    <motion.header
      className="bg-white shadow-sm border-b border-gray-200 px-6 py-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <SafeIcon icon={FiMenu} className="w-6 h-6" />
          </button>
          <div className="ml-4 lg:ml-0">
            <AppLogo size="md" />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Language Toggle */}
          <button
            onClick={handleLanguageToggle}
            className="flex items-center space-x-2 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title={`${t('language')}: ${language === 'en' ? t('english') : t('greek')}`}
          >
            <SafeIcon icon={FiGlobe} className="w-5 h-5" />
            <span className="text-sm font-medium uppercase">{language}</span>
          </button>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiUser} className="w-5 h-5 text-gray-600" />
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-600 capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-md text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
              title={t('logout')}
            >
              <SafeIcon icon={FiLogOut} className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;