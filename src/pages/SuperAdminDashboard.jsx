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
  FiCpu, FiHardDrive, FiWifi, FiLock, FiFileText, FiMonitor, FiActivity,
  FiCreditCard, FiPercent, FiTrendingUp, FiTrendingDown, FiBarChart3, FiGift,
  FiToggleLeft, FiToggleRight
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

  // Financial Management State
  const [financialData, setFinancialData] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    subscriptions: [],
    transactions: [],
    paymentMethods: []
  });
  const [paymentSettings, setPaymentSettings] = useState({
    stripe: { enabled: false, publishableKey: '', secretKey: '' },
    paypal: { enabled: false, clientId: '', clientSecret: '' },
    cash: { enabled: true, currency: 'EUR' }
  });
  const [discounts, setDiscounts] = useState([]);
  const [showCreateDiscountModal, setShowCreateDiscountModal] = useState(false);
  const [showEditDiscountModal, setShowEditDiscountModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);

  // Email Reminders State
  const [emailReminders, setEmailReminders] = useState([]);
  const [showCreateReminderModal, setShowCreateReminderModal] = useState(false);
  const [showEditReminderModal, setShowEditReminderModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);

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
  const createDiscountForm = useForm();
  const editDiscountForm = useForm();
  const createReminderForm = useForm();
  const editReminderForm = useForm();
  const paymentSettingsForm = useForm({ defaultValues: paymentSettings });

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

  // Fetch financial data
  const fetchFinancialData = async () => {
    if (!isSuperAdmin) return;

    try {
      const { default: supabase } = await import('../lib/supabase');
      
      // Fetch subscription data
      const { data: subscriptions } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      // Calculate revenue
      const totalRevenue = subscriptions?.reduce((sum, tenant) => {
        const monthsActive = Math.max(1, Math.floor((new Date() - new Date(tenant.start_date)) / (1000 * 60 * 60 * 24 * 30)));
        return sum + (tenant.plan === 'premium' ? 100 : 50) * monthsActive;
      }, 0) || 0;

      const monthlyRevenue = subscriptions?.filter(t => t.active).reduce((sum, tenant) => {
        return sum + (tenant.plan === 'premium' ? 100 : 50);
      }, 0) || 0;

      setFinancialData({
        totalRevenue,
        monthlyRevenue,
        subscriptions: subscriptions || [],
        transactions: [], // We'll populate this with actual transaction data
        paymentMethods: ['stripe', 'paypal', 'cash']
      });
    } catch (error) {
      console.error('Error fetching financial data:', error);
    }
  };

  // Fetch discounts
  const fetchDiscounts = async () => {
    if (!isSuperAdmin) return;

    try {
      const { default: supabase } = await import('../lib/supabase');
      
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') throw error;

      setDiscounts(data || []);
    } catch (error) {
      console.error('Error fetching discounts:', error);
    }
  };

  // Fetch email reminders
  const fetchEmailReminders = async () => {
    if (!isSuperAdmin) return;

    try {
      const { default: supabase } = await import('../lib/supabase');
      
      const { data, error } = await supabase
        .from('subscription_reminders')
        .select(`
          *,
          tenant:tenants(name, domain)
        `)
        .order('days_before', { ascending: true });

      if (error && error.code !== 'PGRST116') throw error;

      setEmailReminders(data || []);
    } catch (error) {
      console.error('Error fetching email reminders:', error);
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
      fetchFinancialData();
      fetchDiscounts();
      fetchEmailReminders();
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

  // Discount Management Functions
  const handleCreateDiscount = async (data) => {
    try {
      const { default: supabase } = await import('../lib/supabase');
      
      const { error } = await supabase
        .from('discount_codes')
        .insert([{
          code: data.code.toUpperCase(),
          type: data.type,
          value: parseFloat(data.value),
          max_uses: data.max_uses || null,
          expires_at: data.expires_at || null,
          active: data.active,
          description: data.description
        }]);

      if (error) throw error;

      await fetchDiscounts();
      setShowCreateDiscountModal(false);
      createDiscountForm.reset();
      toast.success('Discount code created successfully!');
    } catch (error) {
      console.error('Error creating discount:', error);
      toast.error(`Failed to create discount: ${error.message}`);
    }
  };

  const handleEditDiscount = async (data) => {
    if (!editingDiscount) return;

    try {
      const { default: supabase } = await import('../lib/supabase');
      
      const { error } = await supabase
        .from('discount_codes')
        .update({
          code: data.code.toUpperCase(),
          type: data.type,
          value: parseFloat(data.value),
          max_uses: data.max_uses || null,
          expires_at: data.expires_at || null,
          active: data.active,
          description: data.description
        })
        .eq('id', editingDiscount.id);

      if (error) throw error;

      await fetchDiscounts();
      setShowEditDiscountModal(false);
      setEditingDiscount(null);
      editDiscountForm.reset();
      toast.success('Discount code updated successfully!');
    } catch (error) {
      console.error('Error updating discount:', error);
      toast.error(`Failed to update discount: ${error.message}`);
    }
  };

  const handleDeleteDiscount = async (discountId) => {
    if (!confirm('Are you sure you want to delete this discount code?')) {
      return;
    }

    try {
      const { default: supabase } = await import('../lib/supabase');
      
      const { error } = await supabase
        .from('discount_codes')
        .delete()
        .eq('id', discountId);

      if (error) throw error;

      await fetchDiscounts();
      toast.success('Discount code deleted successfully!');
    } catch (error) {
      console.error('Error deleting discount:', error);
      toast.error(`Failed to delete discount: ${error.message}`);
    }
  };

  // Email Reminder Functions
  const handleCreateReminder = async (data) => {
    try {
      const { default: supabase } = await import('../lib/supabase');
      
      const { error } = await supabase
        .from('subscription_reminders')
        .insert([{
          tenant_id: data.tenant_id || null,
          days_before: parseInt(data.days_before),
          email_subject: data.email_subject,
          email_content: data.email_content,
          enabled: data.enabled
        }]);

      if (error) throw error;

      await fetchEmailReminders();
      setShowCreateReminderModal(false);
      createReminderForm.reset();
      toast.success('Email reminder created successfully!');
    } catch (error) {
      console.error('Error creating reminder:', error);
      toast.error(`Failed to create reminder: ${error.message}`);
    }
  };

  const handleEditReminder = async (data) => {
    if (!editingReminder) return;

    try {
      const { default: supabase } = await import('../lib/supabase');
      
      const { error } = await supabase
        .from('subscription_reminders')
        .update({
          tenant_id: data.tenant_id || null,
          days_before: parseInt(data.days_before),
          email_subject: data.email_subject,
          email_content: data.email_content,
          enabled: data.enabled
        })
        .eq('id', editingReminder.id);

      if (error) throw error;

      await fetchEmailReminders();
      setShowEditReminderModal(false);
      setEditingReminder(null);
      editReminderForm.reset();
      toast.success('Email reminder updated successfully!');
    } catch (error) {
      console.error('Error updating reminder:', error);
      toast.error(`Failed to update reminder: ${error.message}`);
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    if (!confirm('Are you sure you want to delete this email reminder?')) {
      return;
    }

    try {
      const { default: supabase } = await import('../lib/supabase');
      
      const { error } = await supabase
        .from('subscription_reminders')
        .delete()
        .eq('id', reminderId);

      if (error) throw error;

      await fetchEmailReminders();
      toast.success('Email reminder deleted successfully!');
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast.error(`Failed to delete reminder: ${error.message}`);
    }
  };

  // Payment Settings Functions
  const handleUpdatePaymentSettings = async (data) => {
    try {
      const { default: supabase } = await import('../lib/supabase');
      
      // Update global settings with payment configuration
      const paymentConfig = {
        stripe: {
          enabled: data.stripe_enabled,
          publishableKey: data.stripe_publishable_key,
          secretKey: data.stripe_secret_key
        },
        paypal: {
          enabled: data.paypal_enabled,
          clientId: data.paypal_client_id,
          clientSecret: data.paypal_client_secret
        },
        cash: {
          enabled: data.cash_enabled,
          currency: data.cash_currency
        }
      };

      const result = await updateGlobalSettings({
        payment_settings: JSON.stringify(paymentConfig)
      });

      if (result.success) {
        setPaymentSettings(paymentConfig);
        toast.success('Payment settings updated successfully!');
      }
    } catch (error) {
      console.error('Error updating payment settings:', error);
      toast.error(`Failed to update payment settings: ${error.message}`);
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

  const openEditDiscountModal = (discount) => {
    setEditingDiscount(discount);
    editDiscountForm.reset({
      code: discount.code,
      type: discount.type,
      value: discount.value,
      max_uses: discount.max_uses,
      expires_at: discount.expires_at,
      active: discount.active,
      description: discount.description
    });
    setShowEditDiscountModal(true);
  };

  const openEditReminderModal = (reminder) => {
    setEditingReminder(reminder);
    editReminderForm.reset({
      tenant_id: reminder.tenant_id,
      days_before: reminder.days_before,
      email_subject: reminder.email_subject,
      email_content: reminder.email_content,
      enabled: reminder.enabled
    });
    setShowEditReminderModal(true);
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

  const tabs = [
    { id: 'tenants', label: 'Tenant Management', icon: FiBuilding },
    { id: 'users', label: 'User Management', icon: FiUsers },
    { id: 'financial', label: 'Financial Management', icon: FiCreditCard },
    { id: 'global', label: 'Global Settings', icon: FiGlobe },
    { id: 'reminders', label: 'Email Reminders', icon: FiMail },
    { id: 'info', label: 'System Info', icon: FiInfo }
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
            <p className="mt-2 text-gray-600">Manage all tenants, users, financials, and global settings</p>
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
                <SafeIcon icon={FiDollarSign} className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-purple-600">€{financialData.monthlyRevenue.toLocaleString()}</p>
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
                <SafeIcon icon={FiPercent} className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Discounts</p>
                <p className="text-2xl font-bold text-red-600">{discounts.filter(d => d.active).length}</p>
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

            {/* Tenants Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tenants.map((tenant) => (
                      <tr key={tenant.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                            <div className="text-sm text-gray-500">{tenant.userCount || 0} users</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {tenant.domain}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                            tenant.plan === 'premium' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {tenant.plan}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleTenantStatus(tenant)}
                            className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                              tenant.active 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            <SafeIcon 
                              icon={tenant.active ? FiToggleRight : FiToggleLeft} 
                              className="w-4 h-4" 
                            />
                            <span>{tenant.active ? 'Active' : 'Inactive'}</span>
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>
                            <div>Start: {format(new Date(tenant.start_date), 'MMM d, yyyy')}</div>
                            <div>End: {format(new Date(tenant.end_date), 'MMM d, yyyy')}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openEditModal(tenant)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit Tenant"
                            >
                              <SafeIcon icon={FiEdit3} className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openCreateUserModal(tenant)}
                              className="text-green-600 hover:text-green-900"
                              title="Add User"
                            >
                              <SafeIcon icon={FiUserPlus} className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTenant(tenant);
                                setShowDuplicateModal(true);
                              }}
                              className="text-purple-600 hover:text-purple-900"
                              title="Duplicate Tenant"
                            >
                              <SafeIcon icon={FiCopy} className="w-4 h-4" />
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
            <h2 className="text-xl font-bold text-gray-900">Global Settings</h2>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <form onSubmit={settingsForm.handleSubmit(handleUpdateGlobalSettings)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Application Title</label>
                    <input
                      type="text"
                      {...settingsForm.register('app_title')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Soccer Team Finance"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Application Subtitle</label>
                    <input
                      type="text"
                      {...settingsForm.register('app_subtitle')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Multi-Tenant Financial Management"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Welcome Text</label>
                  <textarea
                    {...settingsForm.register('text')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Welcome to our financial management platform"
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Text</label>
                  <textarea
                    {...settingsForm.register('text2')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Need help? Contact our support team"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Button Text</label>
                    <input
                      type="text"
                      {...settingsForm.register('button2')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Contact Support"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Button URL</label>
                    <input
                      type="text"
                      {...settingsForm.register('button2_url')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="mailto:support@example.com"
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

        {/* Email Reminders Tab */}
        {activeTab === 'reminders' && (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Email Reminders</h2>
              <button
                onClick={() => setShowCreateReminderModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <SafeIcon icon={FiPlus} className="w-4 h-4 mr-2" />
                Create Reminder
              </button>
            </div>

            {/* Email Reminders Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Before</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {emailReminders.map((reminder) => (
                      <tr key={reminder.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {reminder.tenant?.name || 'All Tenants'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {reminder.days_before} days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{reminder.email_subject}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{reminder.email_content}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            reminder.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {reminder.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openEditReminderModal(reminder)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit Reminder"
                            >
                              <SafeIcon icon={FiEdit3} className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteReminder(reminder.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Reminder"
                            >
                              <SafeIcon icon={FiTrash2} className="w-4 h-4" />
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

        {/* Include other tabs (User Management, Financial Management, System Info) from previous implementation */}

        {/* All the modals from previous implementation */}
      </motion.div>
    </div>
  );
};

export default SuperAdminDashboard;