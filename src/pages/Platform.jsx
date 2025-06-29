import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../components/common/SafeIcon';
import { useData } from '../contexts/DataContext';

const { FiExternalLink, FiLink } = FiIcons;

const Platform = () => {
  const { platformButtons } = useData();

  const handleButtonClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">Platform</h1>
        <p className="mt-2 text-gray-600">Quick access to external tools and resources</p>
      </motion.div>

      <motion.div
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {platformButtons.length === 0 ? (
          <div className="text-center py-12">
            <SafeIcon icon={FiLink} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No platform buttons configured</p>
            <p className="text-sm text-gray-500 mt-2">
              Contact your administrator to set up platform links
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platformButtons.map((button, index) => (
              <motion.button
                key={button.id}
                onClick={() => handleButtonClick(button.url)}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-lg hover:from-primary-100 hover:to-primary-200 transition-all duration-200 group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                    {button.text}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 truncate">
                    {button.url}
                  </p>
                </div>
                <SafeIcon 
                  icon={FiExternalLink} 
                  className="w-5 h-5 text-primary-500 group-hover:text-primary-700 transition-colors" 
                />
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>

      {platformButtons.length > 0 && (
        <motion.div
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-start">
            <SafeIcon icon={FiExternalLink} className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">External Links</h3>
              <p className="text-sm text-blue-700 mt-1">
                These buttons will open external websites in new tabs. Make sure you trust the destinations before clicking.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Platform;