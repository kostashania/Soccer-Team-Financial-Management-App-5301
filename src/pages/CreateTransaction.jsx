import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../components/common/SafeIcon';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import toast from 'react-hot-toast';

const { FiSave, FiUpload, FiX } = FiIcons;

const CreateTransaction = () => {
  const { user } = useAuth();
  const { categories, items, addTransaction } = useData();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      submittedBy: user?.name,
      type: 'expense',
      status: 'paid',
      official: 'true',
      count: 'true'
    }
  });

  const watchedType = watch('type');
  const watchedCategory = watch('categoryId');
  const watchedStatus = watch('status');

  // Filter categories based on selected type
  const filteredCategories = categories.filter(cat => cat.type === watchedType);
  
  // Filter items based on selected category
  const filteredItems = items.filter(item => {
    console.log('Filtering items. Item categoryId:', item.categoryId, 'Selected categoryId:', watchedCategory, 'Match:', item.categoryId === parseInt(watchedCategory));
    return item.categoryId === parseInt(watchedCategory);
  });

  console.log('All categories:', categories);
  console.log('All items:', items);
  console.log('Filtered categories for type', watchedType, ':', filteredCategories);
  console.log('Filtered items for category', watchedCategory, ':', filteredItems);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const transactionData = {
        type: data.type,
        categoryId: parseInt(data.categoryId),
        itemId: parseInt(data.itemId),
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

      console.log('Submitting transaction:', transactionData);
      await addTransaction(transactionData);
      reset();
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error('Failed to create transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Create Transaction</h1>

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
                Type *
              </label>
              <select
                {...register('type', { required: 'Type is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                {...register('categoryId', { required: 'Category is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select a category</option>
                {filteredCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>}
            </div>

            {/* Item */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item *
              </label>
              <select
                {...register('itemId', { required: 'Item is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={!watchedCategory}
              >
                <option value="">Select an item</option>
                {filteredItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              {errors.itemId && <p className="mt-1 text-sm text-red-600">{errors.itemId.message}</p>}
              {watchedCategory && filteredItems.length === 0 && (
                <p className="mt-1 text-sm text-yellow-600">No items found for this category</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
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
                Description *
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
                Status *
              </label>
              <select
                {...register('status', { required: 'Status is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
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
                <span className="ml-2 text-sm text-gray-700">Official</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  {...register('official')}
                  value="false"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Unofficial</span>
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

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SafeIcon icon={FiSave} className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Creating...' : 'Create Transaction'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateTransaction;