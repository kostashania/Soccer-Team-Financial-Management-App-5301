import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from './SafeIcon';
import { useBranding } from '../../contexts/BrandingContext';

const { FiDollarSign } = FiIcons;

const AppLogo = ({ 
  size = 'md', 
  showText = true, 
  className = '',
  animate = true,
  onClick = null
}) => {
  const { branding } = useBranding();

  const sizeClasses = {
    xs: {
      container: 'w-6 h-6',
      logo: 'w-6 h-6',
      icon: 'w-3 h-3',
      text: 'text-xs'
    },
    sm: {
      container: 'w-8 h-8',
      logo: 'w-8 h-8', 
      icon: 'w-4 h-4',
      text: 'text-sm'
    },
    md: {
      container: 'w-12 h-12',
      logo: 'w-12 h-12',
      icon: 'w-6 h-6',
      text: 'text-base'
    },
    lg: {
      container: 'w-16 h-16',
      logo: 'w-16 h-16',
      icon: 'w-8 h-8',
      text: 'text-lg'
    },
    xl: {
      container: 'w-20 h-20',
      logo: 'w-20 h-20',
      icon: 'w-10 h-10',
      text: 'text-xl'
    }
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  const LogoComponent = () => (
    <div className={`flex items-center ${className} ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      <div className={`${currentSize.container} flex items-center justify-center`}>
        {branding.logoUrl ? (
          <img
            src={branding.logoUrl}
            alt={branding.appTitle}
            className={`${currentSize.logo} object-contain rounded-lg`}
            onError={(e) => {
              // Fallback to default icon if logo fails to load
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className={`${currentSize.container} bg-primary-500 rounded-lg flex items-center justify-center ${branding.logoUrl ? 'hidden' : 'flex'}`}
          style={{ display: branding.logoUrl ? 'none' : 'flex' }}
        >
          <SafeIcon icon={FiDollarSign} className={`${currentSize.icon} text-white`} />
        </div>
      </div>
      {showText && (
        <div className="ml-3">
          <div className={`${currentSize.text} font-bold text-gray-900 leading-tight`}>
            {branding.appTitle}
          </div>
          {branding.appSubtitle && size !== 'xs' && size !== 'sm' && (
            <div className="text-xs text-gray-600 leading-tight">
              {branding.appSubtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <LogoComponent />
      </motion.div>
    );
  }

  return <LogoComponent />;
};

export default AppLogo;