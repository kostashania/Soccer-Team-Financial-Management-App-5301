import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../components/common/SafeIcon';
import supabase from '../lib/supabase';

const { FiArrowRight, FiMail, FiExternalLink } = FiIcons;

const PreLoginScreen = () => {
  const [globalSettings, setGlobalSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGlobalSettings();
  }, []);

  const fetchGlobalSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('global_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      setGlobalSettings(data || {
        app_title: 'Soccer Team Finance',
        app_subtitle: 'Multi-Tenant Financial Management',
        text: 'Welcome to our financial management platform',
        button: 'Get Started',
        button_url: '#',
        text2: 'Need help? Contact our support team',
        button2: 'Contact Support',
        button2_url: 'mailto:support@example.com'
      });
    } catch (error) {
      console.error('Error fetching global settings:', error);
      // Set defaults
      setGlobalSettings({
        app_title: 'Soccer Team Finance',
        app_subtitle: 'Multi-Tenant Financial Management',
        text: 'Welcome to our financial management platform',
        button: 'Get Started',
        button_url: '#',
        text2: 'Need help? Contact our support team',
        button2: 'Contact Support',
        button2_url: 'mailto:support@example.com'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrimaryButton = () => {
    if (globalSettings?.button_url === '#') {
      navigate('/login');
    } else {
      window.open(globalSettings?.button_url, '_blank');
    }
  };

  const handleSecondaryButton = () => {
    if (globalSettings?.button2_url) {
      if (globalSettings.button2_url.startsWith('mailto:')) {
        window.location.href = globalSettings.button2_url;
      } else {
        window.open(globalSettings.button2_url, '_blank');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Logo */}
          <motion.div
            className="flex justify-center mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {globalSettings?.logo_url ? (
              <img
                src={globalSettings.logo_url}
                alt={globalSettings.app_title}
                className="h-24 w-24 object-contain"
              />
            ) : (
              <div className="h-24 w-24 bg-blue-600 rounded-xl flex items-center justify-center">
                <SafeIcon icon={FiIcons.FiDollarSign} className="h-12 w-12 text-white" />
              </div>
            )}
          </motion.div>

          {/* Title and Subtitle */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
              {globalSettings?.app_title}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8">
              {globalSettings?.app_subtitle}
            </p>
          </motion.div>

          {/* Main Content */}
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            {/* Left Side - Main Text and Button */}
            <div className="text-left">
              <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Welcome to the Future of Financial Management
                </h2>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  {globalSettings?.text}
                </p>
                <button
                  onClick={handlePrimaryButton}
                  className="flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 text-lg font-semibold"
                >
                  {globalSettings?.button}
                  <SafeIcon icon={FiArrowRight} className="ml-2 h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Right Side - Secondary Content */}
            <div className="text-left">
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Professional Support
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {globalSettings?.text2}
                </p>
                <button
                  onClick={handleSecondaryButton}
                  className="flex items-center px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-300 font-semibold"
                >
                  {globalSettings?.button2}
                  <SafeIcon 
                    icon={globalSettings?.button2_url?.startsWith('mailto:') ? FiMail : FiExternalLink} 
                    className="ml-2 h-4 w-4" 
                  />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <SafeIcon icon={FiIcons.FiDollarSign} className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Financial Tracking</h3>
              <p className="text-gray-600 text-sm">
                Complete financial management for sports teams and organizations
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <SafeIcon icon={FiIcons.FiUsers} className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Multi-User Access</h3>
              <p className="text-gray-600 text-sm">
                Role-based access for admins, board members, and cashiers
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <SafeIcon icon={FiIcons.FiBarChart3} className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Reports</h3>
              <p className="text-gray-600 text-sm">
                Detailed financial reports and analytics for better decision making
              </p>
            </div>
          </motion.div>

          {/* Login Link */}
          <motion.div
            className="mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.5 }}
          >
            <p className="text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:text-blue-700 font-semibold underline"
              >
                Sign In
              </button>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default PreLoginScreen;