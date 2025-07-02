import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../components/common/SafeIcon';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import toast from 'react-hot-toast';

const { FiSave, FiUpload, FiX } = FiIcons;

const CreateTransaction = () => {
  const { user } = useAuth();
  const { categories, items, addTransaction } = useData();
  const { t } = useLanguage();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      submittedBy: user?.name,
      type: 'expense',
      status: 'paid',
      official: 'true',
      count: 'true',
      categoryId: '',
      itemId: ''
    }
  });

  const watchedType = watch('type');
  const watchedCategory = watch('categoryId');
  const watchedStatus = watch('status');

  // Filter categories based on selected type
  const filteredCategories = categories.filter(cat => cat.type === watchedType);

  // Filter items based on selected category - ensure proper comparison
  const filteredItems = items.filter(item => {
    const selectedCategoryId = watchedCategory ? parseInt(watchedCategory) : null;
    return selectedCategoryId && item.categoryId === selectedCategoryId;
  });

  // Reset itemId when category changes
  React.useEffect(() => {
    setValue('itemId', '');
  }, [watchedCategory, setValue]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    if (isSubmitting) return;

    console.log('=== TRANSACTION SUBMISSION START ===');
    console.log('Form submission data:', data);

    // Validate that category and item are selected
    if (!data.categoryId || data.categoryId === '') {
      toast.error('Please select a category');
      return;
    }

    if (!data.itemId || data.itemId === '') {
      toast.error('Please select an item');
      return;
    }

    // Make sure categories and items are loaded
    if (categories.length === 0) {
      toast.error('Categories not loaded. Please refresh the page and try again.');
      return;
    }

    if (items.length === 0) {
      toast.error('Items not loaded. Please refresh the page and try again.');
      return;
    }

    // Validate that the selected category and item exist
    const categoryId = parseInt(data.categoryId);
    const itemId = parseInt(data.itemId);
    
    const categoryExists = categories.find(c => c.id === categoryId);
    const itemExists = items.find(i => i.id === itemId);

    console.log('Validation details:', {
      formCategoryId: data.categoryId,
      formItemId: data.itemId,
      parsedCategoryId: categoryId,
      parsedItemId: itemId,
      categoryExists: categoryExists,
      itemExists: itemExists,
      allCategories: categories.map(c => ({ id: c.id, name: c.name, type: c.type })),
      allItems: items.map(i => ({ id: i.id, name: i.name, categoryId: i.categoryId })),
      filteredCategories: filteredCategories.map(c => ({ id: c.id, name: c.name })),
      filteredItems: filteredItems.map(i => ({ id: i.id, name: i.name }))
    });

    if (!categoryExists) {
      console.error('Category validation failed!');
      toast.error('Selected category is invalid. Please refresh the page and try again.');
      return;
    }

    if (!itemExists) {
      console.error('Item validation failed!');
      toast.error('Selected item is invalid. Please refresh the page and try again.');
      return;
    }

    setIsSubmitting(true);

    try {
      const transactionData = {
        type: data.type,
        categoryId: categoryId,
        itemId: itemId,
        amount: parseFloat(data.amount),
        description: data.description,
        status: data.status,
        expectedDate: data.expectedDate || null,
        official: data.official === 'true',
        count: data.count === 'true',
        submittedBy: data.submittedBy,
        attachments: selectedFiles.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type
        }))
      };

      console.log('Calling addTransaction with data:', transactionData);
      console.log('addTransaction function:', typeof addTransaction);
      
      // Ensure we're calling the transaction function, not item function
      if (typeof addTransaction !== 'function') {
        throw new Error('addTransaction function is not available');
      }

      await addTransaction(transactionData);
      
      console.log('Transaction created successfully!');
      
      reset({
        submittedBy: user?.name,
        type: 'expense',
        status: 'paid',
        official: 'true',
        count: 'true',
        categoryId: '',
        itemId: ''
      });
      setSelectedFiles([]);
      
      toast.success('Transaction created successfully!');
      
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error(`Failed to create transaction: ${error.message}`);
    } finally {
      setIsSubmitting(false);
      console.log('=== TRANSACTION SUBMISSION END ===');
    }
  };

  // Show loading if categories are not loaded yet
  if (categories.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mr-3"></div>
          <span>Loading categories and items...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('createTransaction')}</h1>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Submitted By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Submitted By
              </label>
              <input
                type="text"
                {...register('submittedBy')}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('type')} *
              </label>
              <select
                {...register('type', { required: 'Type is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="expense">{t('expense')}</option>
                <option value="income">{t('income')}</option>
              </select>
              {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('category')} *
              </label>
              <select
                {...register('categoryId', { required: 'Category is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">{t('selectOption')}</option>
                {filteredCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>}
              {filteredCategories.length === 0 && watchedType && (
                <p className="mt-1 text-sm text-yellow-600">No categories found for {watchedType} type</p>
              )}
              {filteredCategories.length > 0 && (
                <p className="mt-1 text-sm text-green-600">{filteredCategories.length} categories available for {watchedType}</p>
              )}
            </div>

            {/* Item */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('item')} *
              </label>
              <select
                {...register('itemId', { required: 'Item is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={!watchedCategory}
              >
                <option value="">{t('selectOption')}</option>
                {filteredItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              {errors.itemId && <p className="mt-1 text-sm text-red-600">{errors.itemId.message}</p>}
              {!watchedCategory && (
                <p className="mt-1 text-sm text-gray-500">Please select a category first</p>
              )}
              {watchedCategory && filteredItems.length === 0 && (
                <p className="mt-1 text-sm text-yellow-600">No items found for this category</p>
              )}
              {watchedCategory && filteredItems.length > 0 && (
                <p className="mt-1 text-sm text-green-600">{filteredItems.length} items available</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('amount')} *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('amount', {
                  required: 'Amount is required',
                  min: { value: 0.01, message: 'Amount must be greater than 0' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0.00"
              />
              {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('description')} *
              </label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter transaction description..."
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('status')} *
              </label>
              <select
                {...register('status', { required: 'Status is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="paid">{t('paid')}</option>
                <option value="pending">{t('pending')}</option>
              </select>
            </div>

            {/* Expected Date (if pending) */}
            {watchedStatus === 'pending' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Transaction Date *
                </label>
                <input
                  type="date"
                  {...register('expectedDate', {
                    required: watchedStatus === 'pending' ? 'Expected date is required for pending transactions' : false
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {errors.expectedDate && <p className="mt-1 text-sm text-red-600">{errors.expectedDate.message}</p>}
              </div>
            )}

            {/* Official/Unofficial Toggle */}
            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  {...register('official')}
                  value="true"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{t('official')}</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  {...register('official')}
                  value="false"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{t('unofficial')}</span>
              </label>
            </div>

            {/* Count Toggle */}
            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  {...register('count')}
                  value="true"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Count in cash calculation</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  {...register('count')}
                  value="false"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Don't count</span>
              </label>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <SafeIcon icon={FiUpload} className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-600">Click to upload files</span>
                </label>

                {selectedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <SafeIcon icon={FiX} className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Debug Information */}
            <div className="bg-gray-50 p-4 rounded-lg text-xs text-gray-600">
              <p><strong>Debug Info:</strong></p>
              <p>Categories loaded: {categories.length}</p>
              <p>Items loaded: {items.length}</p>
              <p>Selected type: {watchedType}</p>
              <p>Selected category: {watchedCategory} (parsed: {watchedCategory ? parseInt(watchedCategory) : 'none'})</p>
              <p>Filtered categories: {filteredCategories.length}</p>
              <p>Filtered items: {filteredItems.length}</p>
              <p>addTransaction function available: {typeof addTransaction === 'function' ? 'YES' : 'NO'}</p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SafeIcon icon={FiSave} className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Creating Transaction...' : t('createTransaction')}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateTransaction;