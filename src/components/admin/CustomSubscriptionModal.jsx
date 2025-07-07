import React from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiX, FiSave, FiDollarSign, FiCalendar, FiSettings } = FiIcons;

const CustomSubscriptionModal = ({ isOpen, onClose, onSubmit, tenant, packages, loading = false }) => {
  const { 
    register, 
    handleSubmit, 
    watch, 
    formState: { errors }, 
    reset 
  } = useForm();

  const selectedPackageId = watch('packageId');
  const selectedPackage = packages.find(p => p.id === selectedPackageId);
  const useCustomPrice = watch('useCustomPrice');
  const useCustomDuration = watch('useCustomDuration');

  const handleFormSubmit = (data) => {
    const customPrice = data.useCustomPrice ? parseFloat(data.customPrice) : null;
    const customDuration = data.useCustomDuration ? parseInt(data.customDuration) : null;

    onSubmit({
      tenantId: tenant.id,
      packageId: data.packageId,
      customPrice,
      customDuration,
      notes: data.notes
    });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div 
        className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Create Custom Subscription</h2>
              <p className="text-sm text-gray-600 mt-1">For tenant: {tenant?.name}</p>
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
              <SafeIcon icon={FiX} className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Base Package Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Package *
              </label>
              <select 
                {...register('packageId', { required: 'Please select a base package' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a package</option>
                {packages.filter(p => p.active).map(pkg => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} - €{pkg.price} / {pkg.duration_months} months
                  </option>
                ))}
              </select>
              {errors.packageId && (
                <p className="mt-1 text-sm text-red-600">{errors.packageId.message}</p>
              )}
            </div>

            {/* Selected Package Info */}
            {selectedPackage && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Selected Package Details</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><strong>Name:</strong> {selectedPackage.name}</p>
                  <p><strong>Price:</strong> €{selectedPackage.price}</p>
                  <p><strong>Duration:</strong> {selectedPackage.duration_months} months</p>
                  {selectedPackage.max_users && (
                    <p><strong>Max Users:</strong> {selectedPackage.max_users}</p>
                  )}
                  {selectedPackage.description && (
                    <p><strong>Description:</strong> {selectedPackage.description}</p>
                  )}
                </div>
              </div>
            )}

            {/* Custom Price Option */}
            <div className="space-y-3">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="useCustomPrice" 
                  {...register('useCustomPrice')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="useCustomPrice" className="ml-2 block text-sm text-gray-900">
                  Use custom price
                </label>
              </div>
              {useCustomPrice && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Price (€) *
                  </label>
                  <div className="relative">
                    <SafeIcon icon={FiDollarSign} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      {...register('customPrice', { 
                        required: useCustomPrice ? 'Custom price is required' : false,
                        min: { value: 0, message: 'Price must be positive' }
                      })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  {errors.customPrice && (
                    <p className="mt-1 text-sm text-red-600">{errors.customPrice.message}</p>
                  )}
                </div>
              )}
            </div>

            {/* Custom Duration Option */}
            <div className="space-y-3">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="useCustomDuration" 
                  {...register('useCustomDuration')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="useCustomDuration" className="ml-2 block text-sm text-gray-900">
                  Use custom duration
                </label>
              </div>
              {useCustomDuration && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Duration (Months) *
                  </label>
                  <div className="relative">
                    <SafeIcon icon={FiCalendar} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      {...register('customDuration', { 
                        required: useCustomDuration ? 'Custom duration is required' : false,
                        min: { value: 1, message: 'Duration must be at least 1 month' },
                        max: { value: 60, message: 'Duration cannot exceed 60 months' }
                      })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="12"
                    />
                  </div>
                  {errors.customDuration && (
                    <p className="mt-1 text-sm text-red-600">{errors.customDuration.message}</p>
                  )}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea 
                {...register('notes')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any special notes about this custom subscription..."
              />
            </div>

            {/* Summary */}
            {selectedPackage && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Subscription Summary</h3>
                <div className="space-y-1 text-sm text-gray-700">
                  <p>
                    <strong>Price:</strong> € {useCustomPrice ? (watch('customPrice') || '0.00') : selectedPackage.price.toFixed(2)}
                  </p>
                  <p>
                    <strong>Duration:</strong> {useCustomDuration ? (watch('customDuration') || selectedPackage.duration_months) : selectedPackage.duration_months} months
                  </p>
                  <p>
                    <strong>Type:</strong> {(useCustomPrice || useCustomDuration) ? ' Custom Subscription' : ' Standard Package'}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button 
                type="button" 
                onClick={handleClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SafeIcon icon={FiSave} className="w-4 h-4 mr-2" />
                {loading ? 'Creating...' : 'Create Subscription'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default CustomSubscriptionModal;