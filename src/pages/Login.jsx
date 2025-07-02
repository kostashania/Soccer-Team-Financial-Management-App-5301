import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../components/common/SafeIcon';
import AppLogo from '../components/common/AppLogo';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useBranding } from '../contexts/BrandingContext';
import toast from 'react-hot-toast';

const { FiMail, FiLock, FiEye, FiEyeOff, FiGlobe, FiArrowLeft } = FiIcons;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const { language, changeLanguage, t } = useLanguage();
  const { branding } = useBranding();

  if (user) {
    if (user.role === 'superadmin') {
      return <Navigate to="/super-admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        // Success toast is handled in AuthContext
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login submit error:', error);
      toast.error('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const demoUsers = [
    { email: 'superadmin@system.com', role: 'Super Admin', password: 'superadmin123' },
    { email: 'admin@soccerteam.local', role: t('admin'), password: 'password' },
    { email: 'board@soccerteam.local', role: t('boardMember'), password: 'password' },
    { email: 'cashier@soccerteam.local', role: t('cashier'), password: 'password' }
  ];

  const handleDemoLogin = (demoUser) => {
    setEmail(demoUser.email);
    setPassword(demoUser.password);
  };

  const toggleLanguage = () => {
    changeLanguage(language === 'en' ? 'el' : 'en');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="max-w-md w-full space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Back to Home */}
        <div className="text-center">
          <a
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
          >
            <SafeIcon icon={FiArrowLeft} className="w-4 h-4 mr-2" />
            Back to Home
          </a>
        </div>

        <div className="text-center">
          <motion.div
            className="flex justify-center mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <AppLogo size="xl" />
          </motion.div>
          <p className="mt-2 text-sm text-gray-600">
            {t('signIn')}
          </p>

          {/* Language Toggle */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-white hover:bg-opacity-50 transition-colors"
              title={`${t('language')}: ${language === 'en' ? t('english') : t('greek')}`}
            >
              <SafeIcon icon={FiGlobe} className="w-4 h-4" />
              <span className="text-sm font-medium">
                {language === 'en' ? t('english') : t('greek')}
              </span>
            </button>
          </div>
        </div>

        <motion.form
          className="mt-8 space-y-6"
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('email')}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SafeIcon icon={FiMail} className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  placeholder={t('email')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('password')}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SafeIcon icon={FiLock} className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  placeholder={t('password')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <SafeIcon
                    icon={showPassword ? FiEyeOff : FiEye}
                    className="h-5 w-5 text-gray-400 hover:text-gray-600"
                  />
                </button>
              </div>
            </div>
          </div>

          <div>
            <motion.button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? t('signingIn') : t('login')}
            </motion.button>
          </div>
        </motion.form>

        <motion.div
          className="mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-primary-50 text-gray-500">{t('demoUsers')}</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {demoUsers.map((user, index) => (
              <button
                key={index}
                onClick={() => handleDemoLogin(user)}
                className="w-full text-left px-3 py-2 text-sm bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                type="button"
              >
                <div className="font-medium text-gray-900">{user.role}</div>
                <div className="text-gray-600">{user.email}</div>
                <div className="text-xs text-gray-500">{t('password')}: {user.password}</div>
              </button>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start">
              <SafeIcon icon={FiLock} className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-xs text-blue-800">
                <p className="font-medium">{t('demoLoginInfo')}</p>
                <p>{t('clickToAutoFill')}</p>
                <p className="mt-1">
                  <strong>Super Admin:</strong> Access to all tenant management features
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;