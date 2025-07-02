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

  // Fetch all tenants
  const fetchTenants = async () => {
    if (!isSuperAdmin) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data || []);
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

  // Create new tenant
  const createTenant = async (tenantData) => {
    if (!isSuperAdmin) return { success: false, error: 'Access denied' };

    try {
      const { name, domain, plan = 'basic', subscriptionMonths = 12 } = tenantData;
      
      // Generate schema name
      const schemaName = `tenant_${domain.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
      
      // Calculate subscription dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + subscriptionMonths);

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

      if (tenantError) throw tenantError;

      // Create tenant schema and duplicate template data
      const schemaResult = await createTenantSchema(schemaName);
      if (!schemaResult.success) {
        throw new Error('Failed to create tenant schema');
      }

      const duplicateResult = await duplicateTemplateToTenant(schemaName, domain);
      if (!duplicateResult.success) {
        throw new Error('Failed to duplicate template data');
      }

      // Create admin user for the tenant
      const { error: userError } = await supabase
        .from('users_central')
        .insert({
          tenant_id: tenant.id,
          email: `admin@${domain}`,
          name: `${name} Administrator`,
          role: 'admin',
          password: tenantData.adminPassword || 'password',
          active: true
        });

      if (userError) throw userError;

      // Create default reminder settings
      const reminderTemplates = [
        { days_before: 15, subject: 'Υπενθύμιση Ανανέωσης - 15 ημέρες', content: 'Η συνδρομή σας λήγει σε 15 ημέρες.' },
        { days_before: 10, subject: 'Υπενθύμιση Ανανέωσης - 10 ημέρες', content: 'Η συνδρομή σας λήγει σε 10 ημέρες.' },
        { days_before: 1, subject: 'Επείγουσα Υπενθύμιση - 1 ημέρα', content: 'Η συνδρομή σας λήγει αύριο!' }
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

      await fetchTenants();
      toast.success(`Tenant "${name}" created successfully!`);
      return { success: true, tenant };
    } catch (error) {
      console.error('Error creating tenant:', error);
      toast.error(`Failed to create tenant: ${error.message}`);
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
        subscriptionMonths: 12
      });

      if (result.success) {
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
    updateTenant,
    duplicateTenant,
    updateGlobalSettings,
    fetchTenants,
    fetchGlobalSettings,
    isSuperAdmin
  };

  return (
    <SuperAdminContext.Provider value={value}>
      {children}
    </SuperAdminContext.Provider>
  );
};