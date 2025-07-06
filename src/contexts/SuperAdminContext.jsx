import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase, { createTenantSchema, duplicateTemplateToTenant } from '../lib/supabase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SuperAdminContext = createContext();

export const useSuperAdmin = () => {
  const context = useContext(SuperAdminContext);
  if (!context) {
    throw new Error('useSuperAdmin must be used within a SuperAdminProvider');
  }
  return context;
};

export const SuperAdminProvider = ({ children }) => {
  const { user } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [globalSettings, setGlobalSettings] = useState(null);
  const [reminderSettings, setReminderSettings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Check if user is superadmin
  const isSuperAdmin = user?.role === 'superadmin';

  // Fetch all tenants with user counts
  const fetchTenants = async () => {
    if (!isSuperAdmin) return;
    
    try {
      setLoading(true);
      
      // Fetch tenants with user counts
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select(`
          *,
          users:users_central(count)
        `)
        .order('created_at', { ascending: false });

      if (tenantsError) throw tenantsError;

      // Transform the data to include user count
      const tenantsWithUserCount = tenantsData?.map(tenant => ({
        ...tenant,
        userCount: tenant.users?.[0]?.count || 0
      })) || [];

      setTenants(tenantsWithUserCount);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast.error('Failed to fetch tenants');
    } finally {
      setLoading(false);
    }
  };

  // Fetch global settings
  const fetchGlobalSettings = async () => {
    if (!isSuperAdmin) return;
    
    try {
      const { data, error } = await supabase
        .from('global_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      setGlobalSettings(data);
    } catch (error) {
      console.error('Error fetching global settings:', error);
    }
  };

  // Create new tenant with user
  const createTenant = async (tenantData) => {
    if (!isSuperAdmin) return { success: false, error: 'Access denied' };
    
    try {
      const { name, domain, plan = 'basic', subscriptionMonths = 12, adminEmail, adminPassword } = tenantData;
      
      // Validate required fields
      if (!adminEmail || !adminPassword) {
        throw new Error('Admin email and password are required');
      }
      
      // Generate schema name
      const schemaName = `tenant_${domain.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
      
      // Calculate subscription dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + subscriptionMonths);
      
      console.log('Creating tenant with data:', { name, domain, adminEmail });
      
      // Create tenant record
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name,
          domain,
          schema_name: schemaName,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          plan,
          active: true
        })
        .select()
        .single();

      if (tenantError) {
        console.error('Tenant creation error:', tenantError);
        throw tenantError;
      }
      
      console.log('Tenant created:', tenant);
      
      // Create admin user for the tenant
      const { data: userData, error: userError } = await supabase
        .from('users_central')
        .insert({
          tenant_id: tenant.id,
          email: adminEmail,
          name: `${name} Administrator`,
          role: 'admin',
          password: adminPassword,
          active: true
        })
        .select()
        .single();

      if (userError) {
        console.error('User creation error:', userError);
        // If user creation fails, we should clean up the tenant
        await supabase.from('tenants').delete().eq('id', tenant.id);
        throw new Error(`Failed to create admin user: ${userError.message}`);
      }
      
      console.log('User created:', userData);
      
      // Create tenant schema and duplicate template data
      const schemaResult = await createTenantSchema(schemaName);
      if (!schemaResult.success) {
        console.warn('Schema creation warning:', schemaResult.error);
        // Don't fail the entire process for schema creation
      }
      
      const duplicateResult = await duplicateTemplateToTenant(schemaName, domain);
      if (!duplicateResult.success) {
        console.warn('Template duplication warning:', duplicateResult.error);
        // Don't fail the entire process for template duplication
      }
      
      // Create default reminder settings
      const reminderTemplates = [
        {
          days_before: 15,
          subject: 'Υπενθύμιση Ανανέωσης - 15 ημέρες',
          content: 'Η συνδρομή σας λήγει σε 15 ημέρες.'
        },
        {
          days_before: 10,
          subject: 'Υπενθύμιση Ανανέωσης - 10 ημέρες',
          content: 'Η συνδρομή σας λήγει σε 10 ημέρες.'
        },
        {
          days_before: 1,
          subject: 'Επείγουσα Υπενθύμιση - 1 ημέρα',
          content: 'Η συνδρομή σας λήγει αύριο!'
        }
      ];

      for (const reminder of reminderTemplates) {
        await supabase
          .from('subscription_reminders')
          .insert({
            tenant_id: tenant.id,
            days_before: reminder.days_before,
            email_subject: reminder.subject,
            email_content: reminder.content,
            enabled: true
          });
      }
      
      // Create default categories and items for the tenant
      const defaultCategories = [
        { name: 'Training Equipment', type: 'expense' },
        { name: 'Match Fees', type: 'expense' },
        { name: 'Membership Fees', type: 'income' },
        { name: 'Sponsorship', type: 'income' }
      ];
      
      for (const category of defaultCategories) {
        const { data: categoryData } = await supabase
          .from('categories_stf2024')
          .insert({
            name: category.name,
            type: category.type,
            tenant_id: tenant.id
          })
          .select()
          .single();
          
        if (categoryData) {
          // Add some default items for each category
          if (category.name === 'Training Equipment') {
            await supabase
              .from('items_stf2024')
              .insert([
                { name: 'Balls', category_id: categoryData.id, tenant_id: tenant.id },
                { name: 'Cones', category_id: categoryData.id, tenant_id: tenant.id }
              ]);
          } else if (category.name === 'Match Fees') {
            await supabase
              .from('items_stf2024')
              .insert([
                { name: 'Referee Fees', category_id: categoryData.id, tenant_id: tenant.id },
                { name: 'Pitch Rental', category_id: categoryData.id, tenant_id: tenant.id }
              ]);
          } else if (category.name === 'Membership Fees') {
            await supabase
              .from('items_stf2024')
              .insert([
                { name: 'Annual Membership', category_id: categoryData.id, tenant_id: tenant.id },
                { name: 'Monthly Dues', category_id: categoryData.id, tenant_id: tenant.id }
              ]);
          } else if (category.name === 'Sponsorship') {
            await supabase
              .from('items_stf2024')
              .insert([
                { name: 'Local Business Sponsor', category_id: categoryData.id, tenant_id: tenant.id },
                { name: 'Event Sponsor', category_id: categoryData.id, tenant_id: tenant.id }
              ]);
          }
        }
      }
      
      await fetchTenants();
      
      toast.success(`Tenant "${name}" created successfully with admin user!`);
      
      return { success: true, tenant, user: userData };
    } catch (error) {
      console.error('Error creating tenant:', error);
      toast.error(`Failed to create tenant: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  // Create user for existing tenant
  const createTenantUser = async (tenantId, userData) => {
    if (!isSuperAdmin) return { success: false, error: 'Access denied' };
    
    try {
      const { data, error } = await supabase
        .from('users_central')
        .insert({
          tenant_id: tenantId,
          email: userData.email,
          name: userData.name,
          role: userData.role || 'admin',
          password: userData.password || 'password',
          active: true
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchTenants();
      toast.success('User created successfully!');
      
      return { success: true, user: data };
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(`Failed to create user: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  // Update tenant
  const updateTenant = async (tenantId, updates) => {
    if (!isSuperAdmin) return { success: false, error: 'Access denied' };
    
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId);

      if (error) throw error;
      
      await fetchTenants();
      toast.success('Tenant updated successfully!');
      
      return { success: true };
    } catch (error) {
      console.error('Error updating tenant:', error);
      toast.error(`Failed to update tenant: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  // Duplicate tenant
  const duplicateTenant = async (sourceTenantId, newDomain, newName) => {
    if (!isSuperAdmin) return { success: false, error: 'Access denied' };
    
    try {
      // Get source tenant
      const { data: sourceTenant, error: sourceError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', sourceTenantId)
        .single();

      if (sourceError) throw sourceError;
      
      // Create new tenant with duplicated data
      const result = await createTenant({
        name: newName,
        domain: newDomain,
        plan: sourceTenant.plan,
        subscriptionMonths: 12,
        adminEmail: `admin@${newDomain}`,
        adminPassword: 'password'
      });
      
      if (result.success) {
        // Now duplicate the data from source tenant to new tenant
        try {
          // Duplicate categories
          const { data: categories } = await supabase
            .from('categories_stf2024')
            .select('*')
            .eq('tenant_id', sourceTenantId);
            
          if (categories && categories.length > 0) {
            for (const category of categories) {
              // Create new category
              const { data: newCategory } = await supabase
                .from('categories_stf2024')
                .insert({
                  name: category.name,
                  type: category.type,
                  tenant_id: result.tenant.id
                })
                .select()
                .single();
                
              if (newCategory) {
                // Get items for this category
                const { data: items } = await supabase
                  .from('items_stf2024')
                  .select('*')
                  .eq('category_id', category.id)
                  .eq('tenant_id', sourceTenantId);
                  
                if (items && items.length > 0) {
                  // Create new items
                  for (const item of items) {
                    await supabase
                      .from('items_stf2024')
                      .insert({
                        name: item.name,
                        category_id: newCategory.id,
                        tenant_id: result.tenant.id
                      });
                  }
                }
              }
            }
          }
          
          // Duplicate platform buttons
          const { data: buttons } = await supabase
            .from('platform_buttons_stf2024')
            .select('*')
            .eq('tenant_id', sourceTenantId);
            
          if (buttons && buttons.length > 0) {
            for (const button of buttons) {
              await supabase
                .from('platform_buttons_stf2024')
                .insert({
                  text: button.text,
                  url: button.url,
                  tenant_id: result.tenant.id
                });
            }
          }
        } catch (duplicateError) {
          console.warn('Error during data duplication:', duplicateError);
          // Continue anyway as the tenant was created successfully
        }
        
        toast.success(`Tenant duplicated successfully as "${newName}"`);
      }
      
      return result;
    } catch (error) {
      console.error('Error duplicating tenant:', error);
      toast.error(`Failed to duplicate tenant: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  // Update global settings
  const updateGlobalSettings = async (settings) => {
    if (!isSuperAdmin) return { success: false, error: 'Access denied' };
    
    try {
      let result;
      
      if (globalSettings?.id) {
        // Update existing
        const { data, error } = await supabase
          .from('global_settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString()
          })
          .eq('id', globalSettings.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('global_settings')
          .insert(settings)
          .select()
          .single();

        if (error) throw error;
        result = data;
      }
      
      setGlobalSettings(result);
      toast.success('Global settings updated successfully!');
      
      return { success: true };
    } catch (error) {
      console.error('Error updating global settings:', error);
      toast.error(`Failed to update settings: ${error.message}`);
      return { success: false, error: error.message };
    }
  };
  
  // Fetch all user data for SuperAdmin
  const fetchAllUsers = async () => {
    if (!isSuperAdmin) return [];
    
    try {
      const { data, error } = await supabase
        .from('users_central')
        .select(`
          *,
          tenant:tenants(name, domain)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  };
  
  // Financial data methods
  const fetchFinancialData = async () => {
    if (!isSuperAdmin) return null;
    
    try {
      // Get active tenants
      const { data: activeTenants } = await supabase
        .from('tenants')
        .select('*')
        .eq('active', true);
        
      const monthlyRevenue = activeTenants?.reduce((total, tenant) => {
        return total + (tenant.plan === 'premium' ? 100 : 50);
      }, 0) || 0;
      
      // Calculate total revenue from all time
      const { data: allTenants } = await supabase
        .from('tenants')
        .select('*');
        
      const totalRevenue = allTenants?.reduce((total, tenant) => {
        // Calculate months active
        const startDate = new Date(tenant.start_date);
        const endDate = tenant.active ? new Date() : new Date(tenant.end_date);
        const monthsActive = Math.max(1, Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24 * 30)));
        
        return total + (tenant.plan === 'premium' ? 100 : 50) * monthsActive;
      }, 0) || 0;
      
      return {
        monthlyRevenue,
        totalRevenue,
        activeSubscriptions: activeTenants?.length || 0,
        totalTenants: allTenants?.length || 0
      };
    } catch (error) {
      console.error('Error fetching financial data:', error);
      return null;
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchTenants();
      fetchGlobalSettings();
    }
  }, [isSuperAdmin]);

  const value = {
    tenants,
    globalSettings,
    reminderSettings,
    loading,
    createTenant,
    createTenantUser,
    updateTenant,
    duplicateTenant,
    updateGlobalSettings,
    fetchTenants,
    fetchGlobalSettings,
    fetchAllUsers,
    fetchFinancialData,
    isSuperAdmin
  };

  return (
    <SuperAdminContext.Provider value={value}>
      {children}
    </SuperAdminContext.Provider>
  );
};