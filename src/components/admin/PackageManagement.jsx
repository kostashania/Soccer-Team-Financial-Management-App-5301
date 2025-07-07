import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import supabase from '../../lib/supabase';
import toast from 'react-hot-toast';

const { 
  FiPlus, FiEdit3, FiTrash2, FiSave, FiX, FiPackage, FiDollarSign, 
  FiCalendar, FiToggleLeft, FiToggleRight, FiUsers 
} = FiIcons;

const PackageManagement = ({ packages, onPackagesChange }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const createForm = useForm();
  const editForm = useForm();

  // Check if table exists and create it if needed
  const ensurePackagesTable = async () => {
    try {
      console.log('Checking if subscription_packages table exists...');
      
      // First, try to select from the table to see if it exists
      const { data, error } = await supabase
        .from('subscription_packages')
        .select('id')
        .limit(1);

      if (error && error.message.includes('does not exist')) {
        console.log('Table does not exist, creating it...');
        
        // Create the table using RPC function or direct SQL
        const { error: createError } = await supabase.rpc('create_packages_table', {});
        
        if (createError) {
          // If RPC doesn't work, we'll use a different approach
          console.log('RPC failed, trying direct table creation...');
          throw new Error('Table creation failed. Please contact administrator.');
        }
        
        console.log('Table created successfully');
        return true;
      } else if (error) {
        console.error('Error checking table:', error);
        throw error;
      }
      
      console.log('Table exists');
      return true;
    } catch (error) {
      console.error('Error ensuring table exists:', error);
      throw error;
    }
  };

  const handleCreatePackage = async (data) => {
    if (isCreating) return;
    
    try {
      setIsCreating(true);
      console.log('Creating package with data:', data);
      
      // Validate required fields
      if (!data.name || !data.price || !data.duration_months) {
        throw new Error('Name, price, and duration are required');
      }

      // Ensure table exists first
      await ensurePackagesTable();

      const packageData = {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        price: parseFloat(data.price),
        duration_months: parseInt(data.duration_months),
        max_users: data.max_users ? parseInt(data.max_users) : null,
        features: data.features ? 
          data.features.split('\n')
            .map(f => f.trim())
            .filter(f => f.length > 0) : 
          [],
        active: data.active !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Inserting package data:', packageData);

      // Try the insert operation
      const { data: result, error } = await supabase
        .from('subscription_packages')
        .insert([packageData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Provide more specific error messages based on the error
        if (error.message.includes('does not exist')) {
          throw new Error('Database table not found. Please ensure the subscription_packages table is created.');
        } else if (error.message.includes('permission')) {
          throw new Error('Permission denied. Please check your database permissions.');
        } else if (error.message.includes('duplicate')) {
          throw new Error('A package with this name already exists.');
        } else {
          throw new Error(error.message || 'Database error occurred');
        }
      }

      if (!result) {
        throw new Error('No data returned from package creation');
      }

      console.log('Package created successfully:', result);

      // Refresh the packages list
      await onPackagesChange();
      
      // Close modal and reset form
      setShowCreateModal(false);
      createForm.reset();
      
      toast.success('Package created successfully!');
    } catch (error) {
      console.error('Error creating package:', error);
      toast.error(`Failed to create package: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditPackage = async (data) => {
    if (!editingPackage) return;
    try {
      const packageData = {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        price: parseFloat(data.price),
        duration_months: parseInt(data.duration_months),
        max_users: data.max_users ? parseInt(data.max_users) : null,
        features: data.features ? 
          data.features.split('\n')
            .map(f => f.trim())
            .filter(f => f.length > 0) : 
          [],
        active: data.active,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('subscription_packages')
        .update(packageData)
        .eq('id', editingPackage.id);

      if (error) {
        console.error('Update error:', error);
        throw new Error(error.message || 'Failed to update package');
      }

      await onPackagesChange();
      setShowEditModal(false);
      setEditingPackage(null);
      editForm.reset();
      toast.success('Package updated successfully!');
    } catch (error) {
      console.error('Error updating package:', error);
      toast.error(`Failed to update package: ${error.message}`);
    }
  };

  const handleDeletePackage = async (packageId) => {
    if (!confirm('Are you sure you want to delete this package? This action cannot be undone.')) {
      return;
    }
    try {
      const { error } = await supabase
        .from('subscription_packages')
        .delete()
        .eq('id', packageId);

      if (error) {
        console.error('Delete error:', error);
        throw new Error(error.message || 'Failed to delete package');
      }

      await onPackagesChange();
      toast.success('Package deleted successfully!');
    } catch (error) {
      console.error('Error deleting package:', error);
      toast.error(`Failed to delete package: ${error.message}`);
    }
  };

  const handleToggleActive = async (packageId, currentActive) => {
    try {
      const { error } = await supabase
        .from('subscription_packages')
        .update({ 
          active: !currentActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', packageId);

      if (error) {
        console.error('Toggle error:', error);
        throw new Error(error.message || 'Failed to update package status');
      }

      await onPackagesChange();
      toast.success(`Package ${!currentActive ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Error toggling package status:', error);
      toast.error(`Failed to update package status: ${error.message}`);
    }
  };

  const openEditModal = (pkg) => {
    setEditingPackage(pkg);
    editForm.reset({
      name: pkg.name,
      description: pkg.description || '',
      price: pkg.price,
      duration_months: pkg.duration_months,
      max_users: pkg.max_users || '',
      features: Array.isArray(pkg.features) ? pkg.features.join('\n') : '',
      active: pkg.active
    });
    setShowEditModal(true);
  };

  // Create Package Modal
  const CreatePackageModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div 
        className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Create New Package</h2>
            <button 
              onClick={() => setShowCreateModal(false)} 
              className="text-gray-400 hover:text-gray-600"
              disabled={isCreating}
            >
              <SafeIcon icon={FiX} className="w-6 h-6" />
            </button>
          </div>
          <form onSubmit={createForm.handleSubmit(handleCreatePackage)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Package Name *
              </label>
              <input 
                type="text" 
                {...createForm.register('name', { 
                  required: 'Package name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  maxLength: { value: 100, message: 'Name must be less than 100 characters' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Basic Plan"
                disabled={isCreating}
              />
              {createForm.formState.errors.name && (
                <p className="mt-1 text-sm text-red-600">{createForm.formState.errors.name.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea 
                {...createForm.register('description', {
                  maxLength: { value: 500, message: 'Description must be less than 500 characters' }
                })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Package description..."
                disabled={isCreating}
              />
              {createForm.formState.errors.description && (
                <p className="mt-1 text-sm text-red-600">{createForm.formState.errors.description.message}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (€) *
                </label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  {...createForm.register('price', { 
                    required: 'Price is required', 
                    min: { value: 0, message: 'Price must be positive' },
                    max: { value: 9999, message: 'Price must be less than €9999' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="50.00"
                  disabled={isCreating}
                />
                {createForm.formState.errors.price && (
                  <p className="mt-1 text-sm text-red-600">{createForm.formState.errors.price.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (Months) *
                </label>
                <input 
                  type="number" 
                  min="1"
                  max="60"
                  {...createForm.register('duration_months', { 
                    required: 'Duration is required', 
                    min: { value: 1, message: 'Duration must be at least 1 month' },
                    max: { value: 60, message: 'Duration must be less than 60 months' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="12"
                  disabled={isCreating}
                />
                {createForm.formState.errors.duration_months && (
                  <p className="mt-1 text-sm text-red-600">{createForm.formState.errors.duration_months.message}</p>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Users (Optional)
              </label>
              <input 
                type="number" 
                min="1"
                {...createForm.register('max_users', { 
                  min: { value: 1, message: 'Max users must be at least 1' } 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10 (leave empty for unlimited)"
                disabled={isCreating}
              />
              {createForm.formState.errors.max_users && (
                <p className="mt-1 text-sm text-red-600">{createForm.formState.errors.max_users.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Features (One per line)
              </label>
              <textarea 
                {...createForm.register('features')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Financial tracking&#10;User management&#10;Email support&#10;Basic reports"
                disabled={isCreating}
              />
            </div>
            
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="active" 
                {...createForm.register('active')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                defaultChecked
                disabled={isCreating}
              />
              <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                Active
              </label>
            </div>
            
            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                disabled={isCreating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                    Creating...
                  </>
                ) : (
                  'Create Package'
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );

  // Edit Package Modal
  const EditPackageModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div 
        className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Edit Package</h2>
            <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
              <SafeIcon icon={FiX} className="w-6 h-6" />
            </button>
          </div>
          {editingPackage && (
            <form onSubmit={editForm.handleSubmit(handleEditPackage)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Package Name *
                </label>
                <input 
                  type="text" 
                  {...editForm.register('name', { 
                    required: 'Package name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' },
                    maxLength: { value: 100, message: 'Name must be less than 100 characters' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {editForm.formState.errors.name && (
                  <p className="mt-1 text-sm text-red-600">{editForm.formState.errors.name.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea 
                  {...editForm.register('description', {
                    maxLength: { value: 500, message: 'Description must be less than 500 characters' }
                  })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (€) *
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    {...editForm.register('price', { 
                      required: 'Price is required', 
                      min: { value: 0, message: 'Price must be positive' },
                      max: { value: 9999, message: 'Price must be less than €9999' }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {editForm.formState.errors.price && (
                    <p className="mt-1 text-sm text-red-600">{editForm.formState.errors.price.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (Months) *
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    max="60"
                    {...editForm.register('duration_months', { 
                      required: 'Duration is required', 
                      min: { value: 1, message: 'Duration must be at least 1 month' },
                      max: { value: 60, message: 'Duration must be less than 60 months' }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {editForm.formState.errors.duration_months && (
                    <p className="mt-1 text-sm text-red-600">{editForm.formState.errors.duration_months.message}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Users (Optional)
                </label>
                <input 
                  type="number" 
                  min="1"
                  {...editForm.register('max_users', { 
                    min: { value: 1, message: 'Max users must be at least 1' } 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Leave empty for unlimited"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Features (One per line)
                </label>
                <textarea 
                  {...editForm.register('features')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="edit-active" 
                  {...editForm.register('active')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="edit-active" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>
              
              <div className="flex justify-end pt-4">
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Update Package
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Subscription Packages</h3>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <SafeIcon icon={FiPlus} className="w-4 h-4 mr-2" />
          Create Package
        </button>
      </div>

      {/* Database Status Check */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <SafeIcon icon={FiPackage} className="w-5 h-5 text-blue-600 mr-2" />
          <div>
            <p className="text-sm font-medium text-blue-900">Package Management Status</p>
            <p className="text-xs text-blue-700">
              {packages.length} packages loaded. If you encounter database errors, the subscription_packages table may need to be created.
            </p>
          </div>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <motion.div 
            key={pkg.id} 
            className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
              pkg.active ? 'border-blue-200 hover:border-blue-300' : 'border-gray-200 opacity-75'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{pkg.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                </div>
                <button 
                  onClick={() => handleToggleActive(pkg.id, pkg.active)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                    pkg.active ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  <SafeIcon icon={pkg.active ? FiToggleRight : FiToggleLeft} className="w-3 h-3" />
                  <span>{pkg.active ? 'Active' : 'Inactive'}</span>
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <SafeIcon icon={FiDollarSign} className="w-4 h-4 mr-2" />
                  <span>€{pkg.price.toFixed(2)} / {pkg.duration_months} month{pkg.duration_months > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <SafeIcon icon={FiCalendar} className="w-4 h-4 mr-2" />
                  <span>{pkg.duration_months} month subscription</span>
                </div>
                {pkg.max_users && (
                  <div className="flex items-center text-sm text-gray-600">
                    <SafeIcon icon={FiUsers} className="w-4 h-4 mr-2" />
                    <span>Up to {pkg.max_users} users</span>
                  </div>
                )}
              </div>

              {pkg.features && Array.isArray(pkg.features) && pkg.features.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-900 mb-2">Features:</h5>
                  <ul className="space-y-1">
                    {pkg.features.slice(0, 3).map((feature, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {feature}
                      </li>
                    ))}
                    {pkg.features.length > 3 && (
                      <li className="text-sm text-gray-500">
                        +{pkg.features.length - 3} more features
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="flex space-x-2">
                <button 
                  onClick={() => openEditModal(pkg)}
                  className="flex-1 flex items-center justify-center px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                >
                  <SafeIcon icon={FiEdit3} className="w-4 h-4 mr-1" />
                  Edit
                </button>
                <button 
                  onClick={() => handleDeletePackage(pkg.id)}
                  className="flex-1 flex items-center justify-center px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                >
                  <SafeIcon icon={FiTrash2} className="w-4 h-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {packages.length === 0 && (
        <div className="text-center py-12">
          <SafeIcon icon={FiPackage} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No subscription packages found</p>
          <p className="text-sm text-gray-500 mb-4">
            The subscription_packages table may not exist in your database.
          </p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="text-blue-600 hover:text-blue-800"
          >
            Create your first package
          </button>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && <CreatePackageModal />}
      {showEditModal && <EditPackageModal />}
    </div>
  );
};

export default PackageManagement;