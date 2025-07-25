import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../components/common/SafeIcon';
import PackageManagement from '../components/admin/PackageManagement';
import CustomSubscriptionModal from '../components/admin/CustomSubscriptionModal';
import { useSuperAdmin } from '../contexts/SuperAdminContext';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { getDatabaseInfo } from '../lib/supabase';
import supabase from '../lib/supabase';
import toast from 'react-hot-toast';

const {
  FiPlus, FiEdit3, FiCopy, FiTrash2, FiSettings, FiGlobe, FiUsers, FiCalendar,
  FiDollarSign, FiMail, FiEye, FiSave, FiX, FiBuilding, FiLogOut, FiUserPlus,
  FiInfo, FiDatabase, FiServer, FiKey, FiShield, FiCode, FiLayers, FiGitBranch,
  FiCpu, FiHardDrive, FiWifi, FiLock, FiFileText, FiMonitor, FiActivity,
  FiCreditCard, FiPercent, FiTrendingUp, FiTrendingDown, FiBarChart3, FiGift,
  FiToggleLeft, FiToggleRight, FiRefreshCw, FiCheckCircle, FiTag, FiPackage,
  FiUpload, FiImage, FiType
} = FiIcons;

const SuperAdminDashboard = () => {
  const { user, logout } = useAuth();
  const {
    tenants,
    globalSettings,
    loading,
    createTenant,
    createTenantUser,
    updateTenant,
    duplicateTenant,
    updateGlobalSettings,
    isSuperAdmin,
    fetchTenants,
    fetchAllUsers,
    fetchFinancialData
  } = useSuperAdmin();

  const [activeTab, setActiveTab] = useState('tenants');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCustomSubscriptionModal, setShowCustomSubscriptionModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [editingTenant, setEditingTenant] = useState(null);

  // User Management State
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showCreateUserGlobalModal, setShowCreateUserGlobalModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFilter, setUserFilter] = useState({ tenant: '', role: '', status: '' });

  // Financial Management State
  const [financialData, setFinancialData] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    activeSubscriptions: 0,
    totalTenants: 0
  });

  // Package Management State
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);

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

  // Load packages
  const loadPackages = async () => {
    setLoadingPackages(true);
    try {
      const { data, error } = await supabase
        .from('subscription_packages')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error loading packages:', error);
      toast.error('Failed to load packages');
    } finally {
      setLoadingPackages(false);
    }
  };

  // Load all users for user management tab
  const loadAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('users_central')
        .select(`
          *,
          tenant:tenants(name, domain)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        throw error;
      }

      console.log('Loaded users:', data);
      setAllUsers(data || []);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users: " + error.message);
      setAllUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Load financial data
  const loadFinancialData = async () => {
    try {
      console.log('Loading financial data...');
      // Calculate revenue based on tenants
      const activeTenants = tenants.filter(t => t.active);
      const monthlyRevenue = activeTenants.reduce((total, tenant) => {
        return total + (tenant.plan === 'premium' ? 100 : 50);
      }, 0);

      // Calculate total revenue from all time
      const totalRevenue = tenants.reduce((total, tenant) => {
        // Calculate months active
        const startDate = new Date(tenant.start_date);
        const endDate = tenant.active ? new Date() : new Date(tenant.end_date);
        const monthsActive = Math.max(1, Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24 * 30)));
        return total + (tenant.plan === 'premium' ? 100 : 50) * monthsActive;
      }, 0);

      const newFinancialData = {
        monthlyRevenue,
        totalRevenue,
        activeSubscriptions: activeTenants.length,
        totalTenants: tenants.length
      };
      console.log('Financial data calculated:', newFinancialData);
      setFinancialData(newFinancialData);
    } catch (error) {
      console.error("Error loading financial data:", error);
      toast.error("Failed to load financial data");
    }
  };

  // Fetch system information
  const fetchSystemInfo = async () => {
    try {
      setDbInfo(getDatabaseInfo());
      
      // Get database statistics
      const tables = [
        'users_central',
        'tenants',
        'global_settings',
        'subscription_reminders',
        'subscription_packages',
        'tenant_subscriptions',
        'subscription_payments',
        'categories_stf2024',
        'items_stf2024',
        'transactions_stf2024',
        'platform_buttons_stf2024',
        'app_settings_stf2024'
      ];
      
      const tableStats = {};
      for (const table of tables) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
            
          if (!error) {
            tableStats[table] = count || 0;
          } else {
            tableStats[table] = 'N/A';
          }
        } catch (err) {
          tableStats[table] = 'N/A';
        }
      }
      
      setSystemInfo({
        tableStats,
        environment: {
          isDevelopment: import.meta.env.DEV,
          isProduction: import.meta.env.PROD,
          nodeEnv: import.meta.env.MODE,
          buildTime: new Date().toISOString()
        },
        database: {
          type: "PostgreSQL",
          provider: "Supabase",
          version: "14.x",
          url: import.meta.env.VITE_SUPABASE_URL
        },
        storage: {
          provider: "Supabase Storage",
          buckets: ["app-logos", "attachments"]
        }
      });
    } catch (error) {
      console.error('Error fetching system info:', error);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      console.log('SuperAdmin detected, loading data...');
      fetchTenants();
      loadAllUsers();
      loadPackages();
      fetchSystemInfo();
    }
  }, [isSuperAdmin]);

  // Load financial data when tenants change
  useEffect(() => {
    if (tenants.length > 0) {
      console.log('Tenants loaded, calculating financial data...');
      loadFinancialData();
    }
  }, [tenants]);

  // User Management Functions
  const handleCreateUser = async (data) => {
    try {
      console.log('Creating user with data:', data);
      const { error } = await supabase
        .from('users_central')
        .insert([{
          tenant_id: data.tenant_id || null,
          name: data.name,
          email: data.email,
          role: data.role,
          password: data.password,
          active: data.active
        }]);

      if (error) throw error;
      await loadAllUsers();
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
      console.log('Updating user:', editingUser.id, 'with data:', data);
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
      await loadAllUsers();
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
      console.log('Deleting user:', userId);
      const { error } = await supabase
        .from('users_central')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      await loadAllUsers();
      toast.success('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(`Failed to delete user: ${error.message}`);
    }
  };

  // Custom Subscription Functions
  const handleCreateCustomSubscription = async (data) => {
    try {
      const { error } = await supabase
        .from('tenant_subscriptions')
        .insert({
          tenant_id: data.tenantId,
          package_id: data.packageId,
          price: data.customPrice || packages.find(p => p.id === data.packageId)?.price,
          duration_months: data.customDuration || packages.find(p => p.id === data.packageId)?.duration_months,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + (data.customDuration || packages.find(p => p.id === data.packageId)?.duration_months) * 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending_payment',
          is_custom: data.customPrice !== null || data.customDuration !== null,
          notes: data.notes
        });

      if (error) throw error;
      await fetchTenants();
      setShowCustomSubscriptionModal(false);
      toast.success('Custom subscription created successfully!');
    } catch (error) {
      console.error('Error creating custom subscription:', error);
      toast.error(`Failed to create custom subscription: ${error.message}`);
    }
  };

  // Tenant management functions
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
      toast.success('Global settings updated successfully!');
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

  const openCustomSubscriptionModal = (tenant) => {
    setSelectedTenant(tenant);
    setShowCustomSubscriptionModal(true);
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

  const tabs = [
    { id: 'tenants', label: 'Tenant Management', icon: FiBuilding },
    { id: 'users', label: 'User Management', icon: FiUsers },
    { id: 'packages', label: 'Package Management', icon: FiPackage },
    { id: 'subscriptions', label: 'Subscription Management', icon: FiCreditCard },
    { id: 'global', label: 'Global Settings', icon: FiGlobe },
    { id: 'info', label: 'System Info', icon: FiInfo }
  ];

  const activeTenants = tenants.filter(t => t.active).length;
  const expiringSoon = tenants.filter(t => {
    const endDate = new Date(t.end_date);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return endDate <= thirtyDaysFromNow && t.active;
  }).length;

  // Create Tenant Modal
  const CreateTenantModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div 
        className="bg-white rounded-lg max-w-md w-full p-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Create New Tenant</h2>
          <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
            <SafeIcon icon={FiX} className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={createForm.handleSubmit(handleCreateTenant)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Name *</label>
            <input 
              type="text" 
              {...createForm.register('name', { required: 'Tenant name is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="My Soccer Team"
            />
            {createForm.formState.errors.name && (
              <p className="mt-1 text-sm text-red-600">{createForm.formState.errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Domain *</label>
            <input 
              type="text" 
              {...createForm.register('domain', { required: 'Domain is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="mysoccerteam.com"
            />
            {createForm.formState.errors.domain && (
              <p className="mt-1 text-sm text-red-600">{createForm.formState.errors.domain.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email *</label>
            <input 
              type="email" 
              {...createForm.register('adminEmail', { required: 'Admin email is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@mysoccerteam.com"
            />
            {createForm.formState.errors.adminEmail && (
              <p className="mt-1 text-sm text-red-600">{createForm.formState.errors.adminEmail.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Password *</label>
            <input 
              type="password" 
              {...createForm.register('adminPassword', { required: 'Admin password is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter admin password"
            />
            {createForm.formState.errors.adminPassword && (
              <p className="mt-1 text-sm text-red-600">{createForm.formState.errors.adminPassword.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
            <select {...createForm.register('plan')} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Months</label>
            <input 
              type="number" 
              {...createForm.register('subscriptionMonths')} 
              defaultValue={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Tenant
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );

  // Edit Tenant Modal
  const EditTenantModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div 
        className="bg-white rounded-lg max-w-md w-full p-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Edit Tenant</h2>
          <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
            <SafeIcon icon={FiX} className="w-6 h-6" />
          </button>
        </div>
        {editingTenant && (
          <form onSubmit={editForm.handleSubmit(handleEditTenant)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Name *</label>
              <input 
                type="text" 
                {...editForm.register('name', { required: 'Tenant name is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Domain *</label>
              <input 
                type="text" 
                {...editForm.register('domain', { required: 'Domain is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
              <select {...editForm.register('plan')} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <div className="flex items-center">
              <input 
                type="checkbox" 
                {...editForm.register('active')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">Active</label>
            </div>
            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Update Tenant
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );

  // Create User Global Modal
  const CreateUserGlobalModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div 
        className="bg-white rounded-lg max-w-md w-full p-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Create New User</h2>
          <button onClick={() => setShowCreateUserGlobalModal(false)} className="text-gray-400 hover:text-gray-600">
            <SafeIcon icon={FiX} className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={createUserGlobalForm.handleSubmit(handleCreateUser)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tenant</label>
            <select {...createUserGlobalForm.register('tenant_id')} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select Tenant (optional for superadmin)</option>
              {tenants.map(tenant => (
                <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input 
              type="text" 
              {...createUserGlobalForm.register('name', { required: 'Name is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input 
              type="email" 
              {...createUserGlobalForm.register('email', { required: 'Email is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
            <select {...createUserGlobalForm.register('role', { required: 'Role is required' })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select Role</option>
              <option value="superadmin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="board">Board Member</option>
              <option value="cashier">Cashier</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input 
              type="password" 
              {...createUserGlobalForm.register('password', { required: 'Password is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue="password"
            />
          </div>
          <div className="flex items-center">
            <input 
              type="checkbox" 
              {...createUserGlobalForm.register('active')}
              defaultChecked
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">Active</label>
          </div>
          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create User
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );

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
            <p className="mt-2 text-gray-600">Manage tenants, users, packages, and subscriptions</p>
          </div>
          <button 
            onClick={logout} 
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <SafeIcon icon={FiLogOut} className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
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
              <div className="p-3 rounded-lg bg-purple-50">
                <SafeIcon icon={FiPackage} className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Packages</p>
                <p className="text-2xl font-bold text-purple-600">{packages.length}</p>
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
              <div className="p-3 rounded-lg bg-red-50">
                <SafeIcon icon={FiDollarSign} className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-red-600">€{financialData.monthlyRevenue}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap ${
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tenants.map((tenant) => (
                      <tr key={tenant.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                          <div className="text-sm text-gray-500">{tenant.domain}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            tenant.plan === 'premium' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {tenant.plan}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button 
                            onClick={() => handleToggleTenantStatus(tenant)}
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              tenant.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {tenant.active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {tenant.created_at ? format(new Date(tenant.created_at), 'MMM d, yyyy') : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => openEditModal(tenant)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            title="Edit Tenant"
                          >
                            <SafeIcon icon={FiEdit3} className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => openCreateUserModal(tenant)}
                            className="text-green-600 hover:text-green-900"
                            title="Create User"
                          >
                            <SafeIcon icon={FiUserPlus} className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

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
                <SafeIcon icon={FiPlus} className="w-4 h-4 mr-2" />
                Create User
              </button>
            </div>

            {/* User Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select 
                  value={userFilter.tenant} 
                  onChange={(e) => setUserFilter({...userFilter, tenant: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Tenants</option>
                  {tenants.map(tenant => (
                    <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                  ))}
                </select>
                <select 
                  value={userFilter.role} 
                  onChange={(e) => setUserFilter({...userFilter, role: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Roles</option>
                  <option value="superadmin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="board">Board Member</option>
                  <option value="cashier">Cashier</option>
                </select>
                <select 
                  value={userFilter.status} 
                  onChange={(e) => setUserFilter({...userFilter, status: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.tenant?.name || 'Global'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.role === 'superadmin' ? 'bg-red-100 text-red-800' :
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'board' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => openEditUserModal(user)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            title="Edit User"
                          >
                            <SafeIcon icon={FiEdit3} className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete User"
                          >
                            <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Package Management Tab */}
        {activeTab === 'packages' && (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <PackageManagement packages={packages} onPackagesChange={loadPackages} />
          </motion.div>
        )}

        {/* Subscription Management Tab */}
        {activeTab === 'subscriptions' && (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Tenant Subscriptions</h2>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Plan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tenants.map((tenant) => (
                      <tr key={tenant.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                          <div className="text-sm text-gray-500">{tenant.domain}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            tenant.plan === 'premium' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {tenant.plan}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            tenant.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {tenant.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {tenant.end_date ? format(new Date(tenant.end_date), 'MMM d, yyyy') : 'Not set'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => openCustomSubscriptionModal(tenant)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            title="Create Custom Subscription"
                          >
                            <SafeIcon icon={FiPlus} className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => openEditModal(tenant)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Edit Tenant"
                          >
                            <SafeIcon icon={FiEdit3} className="w-4 h-4" />
                          </button>
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
              <h2 className="text-xl font-bold text-gray-900 mb-6">Global Settings</h2>
              <form onSubmit={settingsForm.handleSubmit(handleUpdateGlobalSettings)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">App Title</label>
                    <input 
                      type="text" 
                      {...settingsForm.register('app_title')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Soccer Team Finance"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">App Subtitle</label>
                    <input 
                      type="text" 
                      {...settingsForm.register('app_subtitle')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Multi-Tenant Financial Management"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Main Text</label>
                  <textarea 
                    {...settingsForm.register('text')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Welcome message for the homepage"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary Button Text</label>
                    <input 
                      type="text" 
                      {...settingsForm.register('button')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Get Started"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary Button URL</label>
                    <input 
                      type="text" 
                      {...settingsForm.register('button_url')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="#"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button 
                    type="submit" 
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <SafeIcon icon={FiSave} className="w-4 h-4 mr-2" />
                    Save Settings
                  </button>
                </div>
              </form>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Database Info */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <SafeIcon icon={FiDatabase} className="w-6 h-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Database Information</h3>
                </div>
                {dbInfo && (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Provider:</span>
                      <span className="font-medium">Supabase</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Project ID:</span>
                      <span className="font-medium">{dbInfo.project_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Schema:</span>
                      <span className="font-medium">{dbInfo.schema}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tables:</span>
                      <span className="font-medium">{dbInfo.tables.length}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* System Stats */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <SafeIcon icon={FiActivity} className="w-6 h-6 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">System Statistics</h3>
                </div>
                {systemInfo && (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Environment:</span>
                      <span className="font-medium">{systemInfo.environment.nodeEnv}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Build Time:</span>
                      <span className="font-medium">{new Date(systemInfo.environment.buildTime).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Database Type:</span>
                      <span className="font-medium">{systemInfo.database.type}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Table Statistics */}
            {systemInfo && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <SafeIcon icon={FiBarChart3} className="w-6 h-6 text-purple-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Table Statistics</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(systemInfo.tableStats).map(([table, count]) => (
                    <div key={table} className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-900">{table}</div>
                      <div className="text-lg font-bold text-blue-600">{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Modals */}
        {showCreateModal && <CreateTenantModal />}
        {showEditModal && <EditTenantModal />}
        {showCreateUserGlobalModal && <CreateUserGlobalModal />}
        
        {/* Custom Subscription Modal */}
        <CustomSubscriptionModal
          isOpen={showCustomSubscriptionModal}
          onClose={() => {
            setShowCustomSubscriptionModal(false);
            setSelectedTenant(null);
          }}
          onSubmit={handleCreateCustomSubscription}
          tenant={selectedTenant}
          packages={packages}
        />
      </motion.div>
    </div>
  );
};

export default SuperAdminDashboard;