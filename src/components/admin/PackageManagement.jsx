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

  const createForm = useForm();
  const editForm = useForm();

  const handleCreatePackage = async (data) => {
    try {
      const { error } = await supabase
        .from('subscription_packages')
        .insert({
          name: data.name,
          description: data.description,
          price: parseFloat(data.price),
          duration_months: parseInt(data.duration_months),
          max_users: data.max_users ? parseInt(data.max_users) : null,
          features: data.features ? data.features.split('\n').filter(f => f.trim()) : [],
          active: data.active || true
        });

      if (error) throw error;

      await onPackagesChange();
      setShowCreateModal(false);
      createForm.reset();
      toast.success('Package created successfully!');
    } catch (error) {
      console.error('Error creating package:', error);
      toast.error(`Failed to create package: ${error.message}`);
    }
  };

  const handleEditPackage = async (data) => {
    if (!editingPackage) return;

    try {
      const { error } = await supabase
        .from('subscription_packages')
        .update({
          name: data.name,
          description: data.description,
          price: parseFloat(data.price),
          duration_months: parseInt(data.duration_months),
          max_users: data.max_users ? parseInt(data.max_users) : null,
          features: data.features ? data.features.split('\n').filter(f => f.trim()) : [],
          active: data.active
        })
        .eq('id', editingPackage.id);

      if (error) throw error;

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

      if (error) throw error;

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
        .update({ active: !currentActive })
        .eq('id', packageId);

      if (error) throw error;

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
      description: pkg.description,
      price: pkg.price,
      duration_months: pkg.duration_months,
      max_users: pkg.max_users,
      features: pkg.features ? pkg.features.join('\n') : '',
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
            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
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
                {...createForm.register('name', { required: 'Package name is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Basic Plan"
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
                {...createForm.register('description')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Package description..."
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
                  {...createForm.register('price', { required: 'Price is required', min: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="50.00"
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
                  {...createForm.register('duration_months', { required: 'Duration is required', min: 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="12"
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
                {...createForm.register('max_users', { min: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10 (leave empty for unlimited)"
              />
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
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                {...createForm.register('active')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                defaultChecked
              />
              <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                Active
              </label>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Package
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
                  {...editForm.register('name', { required: 'Package name is required' })}
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
                  {...editForm.register('description')}
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
                    {...editForm.register('price', { required: 'Price is required', min: 0 })}
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
                    {...editForm.register('duration_months', { required: 'Duration is required', min: 1 })}
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
                  {...editForm.register('max_users', { min: 1 })}
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
                    pkg.active
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
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

              {pkg.features && pkg.features.length > 0 && (
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