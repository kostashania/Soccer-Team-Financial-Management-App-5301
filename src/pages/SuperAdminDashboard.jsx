import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../components/common/SafeIcon';
import { useSuperAdmin } from '../contexts/SuperAdminContext';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const { 
  FiPlus, FiEdit3, FiCopy, FiTrash2, FiSettings, FiGlobe, FiUsers, 
  FiCalendar, FiDollarSign, FiMail, FiEye, FiSave, FiX, FiBuilding 
} = FiIcons;

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const {
    tenants,
    globalSettings,
    loading,
    createTenant,
    updateTenant,
    duplicateTenant,
    updateGlobalSettings,
    isSuperAdmin
  } = useSuperAdmin();

  const [activeTab, setActiveTab] = useState('tenants');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [editingTenant, setEditingTenant] = useState(null);

  const createForm = useForm();
  const duplicateForm = useForm();
  const settingsForm = useForm({
    defaultValues: globalSettings || {}
  });

  // Reset settings form when globalSettings changes
  React.useEffect(() => {
    if (globalSettings) {
      settingsForm.reset(globalSettings);
    }
  }, [globalSettings, settingsForm]);

  if (!user || !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only super administrators can access this area.</p>
        </div>
      </div>
    );
  }

  const handleCreateTenant = async (data) => {
    const result = await createTenant(data);
    if (result.success) {
      setShowCreateModal(false);
      createForm.reset();
    }
  };

  const handleDuplicateTenant = async (data) => {
    if (!selectedTenant) return;
    
    const result = await duplicateTenant(
      selectedTenant.id,
      data.newDomain,
      data.newName
    );
    
    if (result.success) {
      setShowDuplicateModal(false);
      setSelectedTenant(null);
      duplicateForm.reset();
    }
  };

  const handleUpdateGlobalSettings = async (data) => {
    const result = await updateGlobalSettings(data);
    if (result.success) {
      // Settings updated
    }
  };

  const handleToggleTenantStatus = async (tenant) => {
    await updateTenant(tenant.id, { active: !tenant.active });
  };

  const tabs = [
    { id: 'tenants', label: 'Tenant Management', icon: FiBuilding },
    { id: 'global', label: 'Global Settings', icon: FiGlobe },
    { id: 'reminders', label: 'Email Reminders', icon: FiMail }
  ];

  const activeTenants = tenants.filter(t => t.active).length;
  const expiringSoon = tenants.filter(t => {
    const endDate = new Date(t.end_date);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return endDate <= thirtyDaysFromNow && t.active;
  }).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <motion.div
        className="max-w-7xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage all tenants and global settings</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-50">
                <SafeIcon icon={FiBuilding} className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tenants</p>
                <p className="text-2xl font-bold text-blue-600">{tenants.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-50">
                <SafeIcon icon={FiUsers} className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Tenants</p>
                <p className="text-2xl font-bold text-green-600">{activeTenants}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-50">
                <SafeIcon icon={FiCalendar} className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-yellow-600">{expiringSoon}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-50">
                <SafeIcon icon={FiDollarSign} className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-purple-600">€{(activeTenants * 50).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <SafeIcon icon={tab.icon} className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tenant Management Tab */}
        {activeTab === 'tenants' && (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Tenant Management</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <SafeIcon icon={FiPlus} className="w-4 h-4 mr-2" />
                Create Tenant
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tenant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Domain
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subscription
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tenants.map((tenant) => (
                      <tr key={tenant.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                            <div className="text-sm text-gray-500">{tenant.schema_name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {tenant.domain}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
                            {tenant.plan}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div>{format(new Date(tenant.start_date), 'MMM d, yyyy')}</div>
                            <div className="text-xs text-gray-500">
                              Expires: {format(new Date(tenant.end_date), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleTenantStatus(tenant)}
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              tenant.active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {tenant.active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedTenant(tenant);
                                setShowDuplicateModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="Duplicate"
                            >
                              <SafeIcon icon={FiCopy} className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingTenant(tenant)}
                              className="text-green-600 hover:text-green-900"
                              title="Edit"
                            >
                              <SafeIcon icon={FiEdit3} className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Global Settings Tab */}
        {activeTab === 'global' && (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Global Pre-Login Settings</h2>
              
              <form onSubmit={settingsForm.handleSubmit(handleUpdateGlobalSettings)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      App Title
                    </label>
                    <input
                      type="text"
                      {...settingsForm.register('app_title', { required: 'Title is required' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      App Subtitle
                    </label>
                    <input
                      type="text"
                      {...settingsForm.register('app_subtitle')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Main Text
                    </label>
                    <textarea
                      {...settingsForm.register('text')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secondary Text
                    </label>
                    <textarea
                      {...settingsForm.register('text2')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Button Text
                    </label>
                    <input
                      type="text"
                      {...settingsForm.register('button')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Button URL
                    </label>
                    <input
                      type="url"
                      {...settingsForm.register('button_url')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secondary Button Text
                    </label>
                    <input
                      type="text"
                      {...settingsForm.register('button2')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secondary Button URL
                    </label>
                    <input
                      type="url"
                      {...settingsForm.register('button2_url')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <SafeIcon icon={FiSave} className="w-4 h-4 mr-2" />
                    Save Global Settings
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* Create Tenant Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              className="bg-white rounded-lg max-w-md w-full p-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Create New Tenant</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <SafeIcon icon={FiX} className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={createForm.handleSubmit(handleCreateTenant)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tenant Name *
                  </label>
                  <input
                    type="text"
                    {...createForm.register('name', { required: 'Name is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Soccer Team Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Domain *
                  </label>
                  <input
                    type="text"
                    {...createForm.register('domain', { required: 'Domain is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="teamdomain.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Password *
                  </label>
                  <input
                    type="password"
                    {...createForm.register('adminPassword', { required: 'Password is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Admin password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plan
                  </label>
                  <select
                    {...createForm.register('plan')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subscription (Months)
                  </label>
                  <input
                    type="number"
                    {...createForm.register('subscriptionMonths')}
                    defaultValue={12}
                    min={1}
                    max={60}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <SafeIcon icon={FiPlus} className="w-4 h-4 mr-2" />
                    Create Tenant
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Duplicate Tenant Modal */}
        {showDuplicateModal && selectedTenant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              className="bg-white rounded-lg max-w-md w-full p-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Duplicate Tenant</h2>
                <button
                  onClick={() => setShowDuplicateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <SafeIcon icon={FiX} className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  Duplicating: <strong>{selectedTenant.name}</strong>
                </p>
              </div>

              <form onSubmit={duplicateForm.handleSubmit(handleDuplicateTenant)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Tenant Name *
                  </label>
                  <input
                    type="text"
                    {...duplicateForm.register('newName', { required: 'Name is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="New Soccer Team Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Domain *
                  </label>
                  <input
                    type="text"
                    {...duplicateForm.register('newDomain', { required: 'Domain is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="newteamdomain.com"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <SafeIcon icon={FiCopy} className="w-4 h-4 mr-2" />
                    Duplicate Tenant
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDuplicateModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SuperAdminDashboard;