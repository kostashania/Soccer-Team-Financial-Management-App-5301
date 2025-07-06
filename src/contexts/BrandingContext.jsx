import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../lib/supabase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const BrandingContext = createContext();

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};

export const BrandingProvider = ({ children }) => {
  const { user, tenant } = useAuth();
  const [branding, setBranding] = useState({
    appTitle: 'Soccer Team Finance',
    appSubtitle: 'Financial Management System',
    logoUrl: null,
    logoFileName: null
  });
  const [loading, setLoading] = useState(true);

  // Check if tenant_id column exists in app_settings table
  const ensureAppSettingsColumn = async () => {
    try {
      const { error } = await supabase
        .from('app_settings_stf2024')
        .select('tenant_id')
        .limit(1);

      if (error && error.message.includes('does not exist')) {
        console.log('tenant_id column does not exist in app_settings_stf2024');
        return false;
      }
      return true;
    } catch (error) {
      console.log('Tenant column check failed for app_settings_stf2024:', error);
      return false;
    }
  };

  // Fetch branding settings with tenant isolation
  const fetchBranding = async () => {
    if (!user || user.role === 'superadmin') {
      setBranding({
        appTitle: 'Soccer Team Finance',
        appSubtitle: 'Multi-Tenant Management System',
        logoUrl: null,
        logoFileName: null
      });
      setLoading(false);
      return;
    }

    if (!tenant) {
      console.log('No tenant information for branding');
      setBranding({
        appTitle: 'Soccer Team Finance',
        appSubtitle: 'Financial Management System',
        logoUrl: null,
        logoFileName: null
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching branding settings for tenant:', tenant.id);

      const hasTenantColumn = await ensureAppSettingsColumn();

      let settingsQuery = supabase
        .from('app_settings_stf2024')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (hasTenantColumn) {
        settingsQuery = settingsQuery.eq('tenant_id', tenant.id);
      }

      const { data, error } = await settingsQuery;

      if (error) {
        console.error('Error fetching branding:', error);
        throw error;
      }

      console.log('Branding data fetched:', data);
      if (data && data.length > 0) {
        const settings = data[0];
        const newBranding = {
          appTitle: settings.app_title || tenant.name || 'Soccer Team Finance',
          appSubtitle: settings.app_subtitle || 'Financial Management System',
          logoUrl: settings.logo_url,
          logoFileName: settings.logo_file_name
        };
        console.log('Setting branding to:', newBranding);
        setBranding(newBranding);
      } else {
        console.log('No branding data found, creating default...');
        await createDefaultSettings();
      }
    } catch (error) {
      console.error('Error in fetchBranding:', error);
      // Use tenant-specific defaults on error
      setBranding({
        appTitle: tenant?.name || 'Soccer Team Finance',
        appSubtitle: 'Financial Management System',
        logoUrl: null,
        logoFileName: null
      });
    } finally {
      setLoading(false);
    }
  };

  // Create default settings with tenant-specific data
  const createDefaultSettings = async () => {
    if (!tenant) return;

    try {
      console.log('Creating default settings for tenant:', tenant.id);

      const hasTenantColumn = await ensureAppSettingsColumn();
      
      const settingsData = {
        app_title: tenant.name || 'Soccer Team Finance',
        app_subtitle: 'Financial Management System',
        logo_url: null,
        logo_file_name: null
      };

      if (hasTenantColumn) {
        settingsData.tenant_id = tenant.id;
      }

      const { data, error } = await supabase
        .from('app_settings_stf2024')
        .insert(settingsData)
        .select()
        .single();

      if (error) {
        console.log('Error creating default settings:', error);
        setBranding({
          appTitle: tenant.name || 'Soccer Team Finance',
          appSubtitle: 'Financial Management System',
          logoUrl: null,
          logoFileName: null
        });
        return;
      }

      console.log('Default settings created:', data);
      setBranding({
        appTitle: data.app_title,
        appSubtitle: data.app_subtitle,
        logoUrl: data.logo_url,
        logoFileName: data.logo_file_name
      });
    } catch (error) {
      console.error('Error creating default settings:', error);
      setBranding({
        appTitle: tenant?.name || 'Soccer Team Finance',
        appSubtitle: 'Financial Management System',
        logoUrl: null,
        logoFileName: null
      });
    }
  };

  // Update branding settings with tenant isolation
  const updateBranding = async (updates) => {
    if (!tenant) return { success: false, error: 'No tenant information' };

    try {
      console.log('Updating branding for tenant:', tenant.id, 'with:', updates);

      const hasTenantColumn = await ensureAppSettingsColumn();

      // Get the current record ID for this tenant
      let existingQuery = supabase
        .from('app_settings_stf2024')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1);

      if (hasTenantColumn) {
        existingQuery = existingQuery.eq('tenant_id', tenant.id);
      }

      const { data: existingData } = await existingQuery;

      let result;
      const updateData = {
        app_title: updates.appTitle !== undefined ? updates.appTitle : branding.appTitle,
        app_subtitle: updates.appSubtitle !== undefined ? updates.appSubtitle : branding.appSubtitle,
        logo_url: updates.logoUrl !== undefined ? updates.logoUrl : branding.logoUrl,
        logo_file_name: updates.logoFileName !== undefined ? updates.logoFileName : branding.logoFileName,
        updated_at: new Date().toISOString()
      };

      if (hasTenantColumn) {
        updateData.tenant_id = tenant.id;
      }

      if (existingData && existingData.length > 0) {
        // Update existing record
        let updateQuery = supabase
          .from('app_settings_stf2024')
          .update(updateData)
          .eq('id', existingData[0].id);

        if (hasTenantColumn) {
          updateQuery = updateQuery.eq('tenant_id', tenant.id);
        }

        const { data, error } = await updateQuery
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Insert new record
        delete updateData.updated_at; // Remove updated_at for insert
        
        const { data, error } = await supabase
          .from('app_settings_stf2024')
          .insert(updateData)
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      console.log('Branding update result:', result);
      
      // Update local state immediately
      const newBranding = {
        appTitle: result.app_title,
        appSubtitle: result.app_subtitle,
        logoUrl: result.logo_url,
        logoFileName: result.logo_file_name
      };
      
      console.log('Setting new branding state:', newBranding);
      setBranding(newBranding);

      toast.success('Branding updated successfully!');
      return { success: true };
    } catch (error) {
      console.error('Error updating branding:', error);
      toast.error(`Failed to update branding: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  // FIXED: Upload logo file with proper error handling
  const uploadLogo = async (file) => {
    if (!tenant) return { success: false, error: 'No tenant information' };

    try {
      console.log('Starting logo upload for tenant:', tenant.name);
      
      // Show loading toast
      const uploadToast = toast.loading('Uploading logo...');

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.dismiss(uploadToast);
        throw new Error('Please select an image file');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.dismiss(uploadToast);
        throw new Error('File size must be less than 5MB');
      }

      // Remove old logo if exists
      if (branding.logoFileName) {
        console.log('Removing old logo:', branding.logoFileName);
        await supabase.storage
          .from('app-logos')
          .remove([branding.logoFileName]);
      }

      // Create tenant-specific filename
      const fileExt = file.name.split('.').pop();
      const fileName = `tenant_${tenant.id}/logo_${Date.now()}.${fileExt}`;
      console.log('Uploading to storage with filename:', fileName);

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('app-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        toast.dismiss(uploadToast);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('app-logos')
        .getPublicUrl(fileName);

      const logoUrl = urlData.publicUrl;
      console.log('Generated public URL:', logoUrl);

      // Update branding with new logo
      const result = await updateBranding({
        logoUrl,
        logoFileName: fileName
      });

      toast.dismiss(uploadToast);

      if (result.success) {
        toast.success('Logo uploaded successfully!');
        
        // Force a refresh of the branding state
        setTimeout(() => {
          fetchBranding();
        }, 1000);
        
        return { success: true, logoUrl };
      }
      return result;
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error(error.message || 'Failed to upload logo');
      return { success: false, error: error.message };
    }
  };

  // FIXED: Remove logo with proper cleanup
  const removeLogo = async () => {
    if (!tenant) return { success: false, error: 'No tenant information' };

    try {
      console.log('Removing logo...', branding.logoFileName);
      
      const removeToast = toast.loading('Removing logo...');

      // Delete from storage if exists
      if (branding.logoFileName) {
        const { error: deleteError } = await supabase.storage
          .from('app-logos')
          .remove([branding.logoFileName]);

        if (deleteError) {
          console.error('Error deleting from storage:', deleteError);
          // Continue anyway - the file might not exist
        }
      }

      // Update branding to remove logo
      const result = await updateBranding({
        logoUrl: null,
        logoFileName: null
      });

      toast.dismiss(removeToast);

      if (result.success) {
        toast.success('Logo removed successfully!');
        
        // Force a refresh of the branding state
        setTimeout(() => {
          fetchBranding();
        }, 500);
      }
      return result;
    } catch (error) {
      console.error('Error removing logo:', error);
      toast.error('Failed to remove logo');
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    if (user && tenant) {
      console.log('Fetching branding for tenant:', tenant.name);
      fetchBranding();
    } else if (user && user.role === 'superadmin') {
      // Superadmin uses default branding
      setBranding({
        appTitle: 'Soccer Team Finance',
        appSubtitle: 'Multi-Tenant Management System',
        logoUrl: null,
        logoFileName: null
      });
      setLoading(false);
    }
  }, [user, tenant]);

  // Debug: Log branding state changes
  useEffect(() => {
    console.log('Branding state updated:', branding);
  }, [branding]);

  const value = {
    branding,
    loading,
    updateBranding,
    uploadLogo,
    removeLogo,
    fetchBranding
  };

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
};