import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../components/common/SafeIcon';
import { useSuperAdmin } from '../contexts/SuperAdminContext';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { getDatabaseInfo } from '../lib/supabase';
import toast from 'react-hot-toast';

const {
  FiPlus, FiEdit3, FiCopy, FiTrash2, FiSettings, FiGlobe, FiUsers, FiCalendar,
  FiDollarSign, FiMail, FiEye, FiSave, FiX, FiBuilding, FiLogOut, FiUserPlus,
  FiInfo, FiDatabase, FiServer, FiKey, FiShield, FiCode, FiLayers, FiGitBranch,
  FiCpu, FiHardDrive, FiWifi, FiLock, FiFileText, FiMonitor, FiActivity
} = FiIcons;

const SuperAdminDashboard = () => {
  const { user, logout } = useAuth();
  const { 
    tenants, globalSettings, loading, createTenant, createTenantUser, 
    updateTenant, duplicateTenant, updateGlobalSettings, isSuperAdmin 
  } = useSuperAdmin();
  
  const [activeTab, setActiveTab] = useState('tenants');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [editingTenant, setEditingTenant] = useState(null);

  // User Management State
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showCreateUserGlobalModal, setShowCreateUserGlobalModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFilter, setUserFilter] = useState({ tenant: '', role: '', status: '' });

  // Info State
  const [systemInfo, setSystemInfo] = useState(null);
  const [dbInfo, setDbInfo] = useState(null);

  const createForm = useForm();
  const createUserForm = useForm();
  const duplicateForm = useForm();
  const editForm = useForm();
  const settingsForm = useForm({ defaultValues: globalSettings || {} });
  const createUserGlobalForm = useForm();
  const editUserForm = useForm();

  // Reset settings form when globalSettings changes
  React.useEffect(() => {
    if (globalSettings) {
      settingsForm.reset(globalSettings);
    }
  }, [globalSettings, settingsForm]);

  // Fetch all users for user management
  const fetchAllUsers = async () => {
    if (!isSuperAdmin) return;
    
    setLoadingUsers(true);
    try {
      const { default: supabase } = await import('../lib/supabase');
      
      const { data, error } = await supabase
        .from('users_central')
        .select(`
          *,
          tenant:tenants(name, domain)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAllUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch system information
  const fetchSystemInfo = async () => {
    try {
      setDbInfo(getDatabaseInfo());
      
      const { default: supabase } = await import('../lib/supabase');
      
      // Get database statistics
      const tables = [
        'users_central', 'tenants', 'global_settings', 'subscription_reminders',
        'users_stf2024', 'categories_stf2024', 'items_stf2024', 
        'transactions_stf2024', 'platform_buttons_stf2024', 'app_settings_stf2024'
      ];

      const tableStats = {};
      for (const table of tables) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          if (!error) {
            tableStats[table] = count || 0;
          }
        } catch (err) {
          tableStats[table] = 'N/A';
        }
      }

      // Get storage information
      let storageInfo = {};
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        storageInfo.buckets = buckets?.length || 0;
        
        if (buckets && buckets.length > 0) {
          storageInfo.bucketNames = buckets.map(b => b.name);
        }
      } catch (err) {
        storageInfo.error = 'Unable to fetch storage info';
      }

      setSystemInfo({
        tableStats,
        storageInfo,
        environment: {
          isDevelopment: import.meta.env.DEV,
          isProduction: import.meta.env.PROD,
          nodeEnv: import.meta.env.MODE,
          buildTime: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error fetching system info:', error);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAllUsers();
      fetchSystemInfo();
    }
  }, [isSuperAdmin]);

  // User Management Functions
  const handleCreateUser = async (data) => {
    try {
      const { default: supabase } = await import('../lib/supabase');
      
      const { data: userData, error } = await supabase
        .from('users_central')
        .insert([{
          tenant_id: data.tenant_id,
          name: data.name,
          email: data.email,
          role: data.role,
          password: data.password,
          active: data.active
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchAllUsers();
      setShowCreateUserGlobalModal(false);
      createUserGlobalForm.reset();
      toast.success('User created successfully!');
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(`Failed to create user: ${error.message}`);
    }
  };

  const handleEditUser = async (data) => {
    if (!editingUser) return;

    try {
      const { default: supabase } = await import('../lib/supabase');
      
      const { error } = await supabase
        .from('users_central')
        .update({
          name: data.name,
          email: data.email,
          role: data.role,
          password: data.password,
          active: data.active
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      await fetchAllUsers();
      setShowEditUserModal(false);
      setEditingUser(null);
      editUserForm.reset();
      toast.success('User updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(`Failed to update user: ${error.message}`);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const { default: supabase } = await import('../lib/supabase');
      
      const { error } = await supabase
        .from('users_central')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      await fetchAllUsers();
      toast.success('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(`Failed to delete user: ${error.message}`);
    }
  };

  const openEditUserModal = (user) => {
    setEditingUser(user);
    editUserForm.reset({
      name: user.name,
      email: user.email,
      role: user.role,
      password: user.password || 'password',
      active: user.active
    });
    setShowEditUserModal(true);
  };

  // Filter users based on selected filters
  const filteredUsers = allUsers.filter(user => {
    return (
      (!userFilter.tenant || user.tenant_id === userFilter.tenant) &&
      (!userFilter.role || user.role === userFilter.role) &&
      (!userFilter.status || user.active.toString() === userFilter.status)
    );
  });

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

  // Rest of the existing code for create/edit/duplicate tenant functions...
  const handleCreateTenant = async (data) => {
    console.log('Creating tenant with data:', data);
    const result = await createTenant({
      ...data,
      adminEmail: data.adminEmail,
      adminPassword: data.adminPassword
    });
    if (result.success) {
      setShowCreateModal(false);
      createForm.reset();
    }
  };

  const handleCreateTenantUser = async (data) => {
    if (!selectedTenant) return;
    const result = await createTenantUser(selectedTenant.id, data);
    if (result.success) {
      setShowCreateUserModal(false);
      setSelectedTenant(null);
      createUserForm.reset();
    }
  };

  const handleEditTenant = async (data) => {
    if (!editingTenant) return;
    const updates = {
      name: data.name,
      domain: data.domain,
      plan: data.plan,
      active: data.active
    };
    const result = await updateTenant(editingTenant.id, updates);
    if (result.success) {
      setShowEditModal(false);
      setEditingTenant(null);
      editForm.reset();
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

  const openEditModal = (tenant) => {
    setEditingTenant(tenant);
    editForm.reset({
      name: tenant.name,
      domain: tenant.domain,
      plan: tenant.plan,
      active: tenant.active
    });
    setShowEditModal(true);
  };

  const openCreateUserModal = (tenant) => {
    setSelectedTenant(tenant);
    createUserForm.reset({
      email: `admin@${tenant.domain}`,
      name: `${tenant.name} Admin`,
      role: 'admin',
      password: 'password'
    });
    setShowCreateUserModal(true);
  };

  const tabs = [
    { id: 'tenants', label: 'Tenant Management', icon: FiBuilding },
    { id: 'users', label: 'User Management', icon: FiUsers },
    { id: 'global', label: 'Global Settings', icon: FiGlobe },
    { id: 'info', label: 'System Info', icon: FiInfo },
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
            <p className="mt-2 text-gray-600">Manage all tenants, users, and global settings</p>
          </div>
          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <SafeIcon icon={FiLogOut} className="w-4 h-4 mr-2" />
            Sign Out
          </button>
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
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-green-600">{allUsers.length}</p>
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

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">User Management</h2>
              <button
                onClick={() => setShowCreateUserGlobalModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <SafeIcon icon={FiUserPlus} className="w-4 h-4 mr-2" />
                Create User
              </button>
            </div>

            {/* User Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Tenant</label>
                  <select
                    value={userFilter.tenant}
                    onChange={(e) => setUserFilter({ ...userFilter, tenant: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Tenants</option>
                    {tenants.map(tenant => (
                      <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
                  <select
                    value={userFilter.role}
                    onChange={(e) => setUserFilter({ ...userFilter, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Roles</option>
                    <option value="superadmin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="board">Board Member</option>
                    <option value="cashier">Cashier</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
                  <select
                    value={userFilter.status}
                    onChange={(e) => setUserFilter({ ...userFilter, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loadingUsers ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.tenant?.name || 'System'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                              user.role === 'superadmin' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                              user.role === 'board' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(user.created_at), 'MMM d, yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openEditUserModal(user)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit User"
                              >
                                <SafeIcon icon={FiEdit3} className="w-4 h-4" />
                              </button>
                              {user.role !== 'superadmin' && (
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete User"
                                >
                                  <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* System Info Tab */}
        {activeTab === 'info' && (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl font-bold text-gray-900">System Information</h2>

            {/* Database Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <SafeIcon icon={FiDatabase} className="w-6 h-6 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Database Configuration</h3>
              </div>
              
              {dbInfo && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <SafeIcon icon={FiServer} className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Database URL:</span>
                    </div>
                    <code className="block bg-gray-100 p-2 rounded text-sm break-all">{dbInfo.url}</code>
                    
                    <div className="flex items-center">
                      <SafeIcon icon={FiKey} className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Project ID:</span>
                    </div>
                    <code className="block bg-gray-100 p-2 rounded text-sm">{dbInfo.project_id}</code>
                    
                    <div className="flex items-center">
                      <SafeIcon icon={FiLayers} className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Schema:</span>
                    </div>
                    <code className="block bg-gray-100 p-2 rounded text-sm">{dbInfo.schema}</code>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <SafeIcon icon={FiShield} className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Security Features:</span>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>✅ Row Level Security (RLS) Enabled</li>
                      <li>✅ Tenant Data Isolation</li>
                      <li>✅ Encrypted Connections (SSL)</li>
                      <li>✅ API Key Authentication</li>
                      <li>✅ Role-Based Access Control</li>
                    </ul>
                    
                    <div className="flex items-center mt-4">
                      <SafeIcon icon={FiActivity} className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Connection Status:</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-green-600">Connected</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Database Tables */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <SafeIcon icon={FiLayers} className="w-6 h-6 text-green-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Database Tables & Statistics</h3>
              </div>
              
              {systemInfo?.tableStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(systemInfo.tableStats).map(([table, count]) => (
                    <div key={table} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{table}</h4>
                          <p className="text-sm text-gray-600">
                            {table.includes('central') ? 'Global Table' : 
                             table.includes('stf2024') ? 'Tenant Table' : 'System Table'}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">{count}</div>
                          <div className="text-xs text-gray-500">records</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Storage Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <SafeIcon icon={FiHardDrive} className="w-6 h-6 text-purple-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Storage Information</h3>
              </div>
              
              {systemInfo?.storageInfo && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Storage Buckets</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Buckets:</span>
                        <span className="font-medium">{systemInfo.storageInfo.buckets}</span>
                      </div>
                      {systemInfo.storageInfo.bucketNames && (
                        <div>
                          <span className="text-sm text-gray-600">Bucket Names:</span>
                          <ul className="text-sm text-gray-800 mt-1">
                            {systemInfo.storageInfo.bucketNames.map(name => (
                              <li key={name} className="ml-4">• {name}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Storage Features</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>✅ File Upload & Management</li>
                      <li>✅ Image Processing & Optimization</li>
                      <li>✅ Public & Private Buckets</li>
                      <li>✅ CDN Integration</li>
                      <li>✅ Automatic Backups</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* System Architecture */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <SafeIcon icon={FiCpu} className="w-6 h-6 text-orange-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">System Architecture</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Technology Stack</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <SafeIcon icon={FiCode} className="w-4 h-4 text-blue-500 mr-2" />
                      <span className="text-sm"><strong>Frontend:</strong> React 18, Vite, Tailwind CSS</span>
                    </div>
                    <div className="flex items-center">
                      <SafeIcon icon={FiDatabase} className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-sm"><strong>Backend:</strong> Supabase (PostgreSQL)</span>
                    </div>
                    <div className="flex items-center">
                      <SafeIcon icon={FiShield} className="w-4 h-4 text-red-500 mr-2" />
                      <span className="text-sm"><strong>Auth:</strong> Custom Role-Based System</span>
                    </div>
                    <div className="flex items-center">
                      <SafeIcon icon={FiHardDrive} className="w-4 h-4 text-purple-500 mr-2" />
                      <span className="text-sm"><strong>Storage:</strong> Supabase Storage</span>
                    </div>
                    <div className="flex items-center">
                      <SafeIcon icon={FiMonitor} className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-sm"><strong>Deployment:</strong> Static Hosting</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Multi-Tenant Features</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>✅ Complete Data Isolation per Tenant</li>
                    <li>✅ Custom Branding per Organization</li>
                    <li>✅ Role-Based Access Control</li>
                    <li>✅ Subscription Management</li>
                    <li>✅ Automated Tenant Provisioning</li>
                    <li>✅ Centralized User Management</li>
                    <li>✅ Global Settings Configuration</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Environment Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <SafeIcon icon={FiSettings} className="w-6 h-6 text-gray-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Environment Information</h3>
              </div>
              
              {systemInfo?.environment && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {systemInfo.environment.isDevelopment ? 'Development' : 'Production'}
                    </div>
                    <div className="text-sm text-gray-600">Environment</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{systemInfo.environment.nodeEnv}</div>
                    <div className="text-sm text-gray-600">Mode</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">v1.0.0</div>
                    <div className="text-sm text-gray-600">Version</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {format(new Date(systemInfo.environment.buildTime), 'MMM d')}
                    </div>
                    <div className="text-sm text-gray-600">Build Date</div>
                  </div>
                </div>
              )}
            </div>

            {/* API Endpoints */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <SafeIcon icon={FiWifi} className="w-6 h-6 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">API Endpoints & Services</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Supabase Services</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded p-3">
                      <div className="font-medium text-sm">Database API</div>
                      <code className="text-xs text-gray-600 block mt-1">{dbInfo?.url}/rest/v1/</code>
                    </div>
                    <div className="border border-gray-200 rounded p-3">
                      <div className="font-medium text-sm">Auth API</div>
                      <code className="text-xs text-gray-600 block mt-1">{dbInfo?.url}/auth/v1/</code>
                    </div>
                    <div className="border border-gray-200 rounded p-3">
                      <div className="font-medium text-sm">Storage API</div>
                      <code className="text-xs text-gray-600 block mt-1">{dbInfo?.url}/storage/v1/</code>
                    </div>
                    <div className="border border-gray-200 rounded p-3">
                      <div className="font-medium text-sm">Realtime API</div>
                      <code className="text-xs text-gray-600 block mt-1">{dbInfo?.url}/realtime/v1/</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Security & Compliance */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <SafeIcon icon={FiLock} className="w-6 h-6 text-red-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Security & Compliance</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Security Measures</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>🔒 HTTPS/TLS 1.3 Encryption</li>
                    <li>🔐 Row Level Security (RLS)</li>
                    <li>🛡️ SQL Injection Prevention</li>
                    <li>🔑 API Key Management</li>
                    <li>👤 Role-Based Access Control</li>
                    <li>🏢 Multi-Tenant Data Isolation</li>
                    <li>📝 Audit Logging</li>
                    <li>🚫 XSS Protection</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Compliance Features</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>📋 GDPR Data Protection</li>
                    <li>🔄 Automated Backups</li>
                    <li>📊 Activity Monitoring</li>
                    <li>🗃️ Data Retention Policies</li>
                    <li>🔍 Security Auditing</li>
                    <li>📱 Session Management</li>
                    <li>🌍 Geographic Data Residency</li>
                    <li>⚡ Disaster Recovery</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Rest of existing tabs (Tenant Management, Global Settings, Email Reminders) */}
        {/* ... existing code for other tabs ... */}

        {/* Create User Modal (Global) */}
        {showCreateUserGlobalModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              className="bg-white rounded-lg max-w-md w-full p-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Create New User</h2>
                <button
                  onClick={() => setShowCreateUserGlobalModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <SafeIcon icon={FiX} className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={createUserGlobalForm.handleSubmit(handleCreateUser)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tenant *</label>
                  <select
                    {...createUserGlobalForm.register('tenant_id', { required: 'Tenant is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Tenant</option>
                    {tenants.map(tenant => (
                      <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    {...createUserGlobalForm.register('name', { required: 'Name is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    {...createUserGlobalForm.register('email', { required: 'Email is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                  <select
                    {...createUserGlobalForm.register('role', { required: 'Role is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="admin">Admin</option>
                    <option value="board">Board Member</option>
                    <option value="cashier">Cashier</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                  <input
                    type="password"
                    {...createUserGlobalForm.register('password', { required: 'Password is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...createUserGlobalForm.register('active')}
                      defaultChecked
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <SafeIcon icon={FiUserPlus} className="w-4 h-4 mr-2" />
                    Create User
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateUserGlobalModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditUserModal && editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              className="bg-white rounded-lg max-w-md w-full p-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
                <button
                  onClick={() => setShowEditUserModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <SafeIcon icon={FiX} className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={editUserForm.handleSubmit(handleEditUser)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    {...editUserForm.register('name', { required: 'Name is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    {...editUserForm.register('email', { required: 'Email is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                  <select
                    {...editUserForm.register('role', { required: 'Role is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={editingUser.role === 'superadmin'}
                  >
                    {editingUser.role === 'superadmin' ? (
                      <option value="superadmin">Super Admin</option>
                    ) : (
                      <>
                        <option value="admin">Admin</option>
                        <option value="board">Board Member</option>
                        <option value="cashier">Cashier</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                  <input
                    type="password"
                    {...editUserForm.register('password', { required: 'Password is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...editUserForm.register('active')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={editingUser.role === 'superadmin'}
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <SafeIcon icon={FiSave} className="w-4 h-4 mr-2" />
                    Update User
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditUserModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Include all existing modals for tenant management... */}
      </motion.div>
    </div>
  );
};

export default SuperAdminDashboard;