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

  // Fetch branding settings with tenant isolation
  const fetchBranding = async () => {
    if (!user || user.role === 'superadmin') {
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

      // Add tenant_id column to app_settings table if it doesn't exist
      await supabase.rpc('add_tenant_column_if_not_exists', {
        table_name: 'app_settings_stf2024',
        tenant_id: tenant.id
      }).catch(() => {
        // Column might already exist, continue
      });

      // Try to get existing settings for this tenant
      const { data, error } = await supabase
        .from('app_settings_stf2024')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error && error.details?.includes('tenant_id')) {
        // If tenant_id column doesn't exist, get all settings
        console.log('Tenant column not found, using default branding');
        setBranding({
          appTitle: tenant.name || 'Soccer Team Finance',
          appSubtitle: 'Financial Management System',
          logoUrl: null,
          logoFileName: null
        });
      } else if (error) {
        console.error('Error fetching branding:', error);
        throw error;
      } else {
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

      const { data, error } = await supabase
        .from('app_settings_stf2024')
        .insert({
          app_title: tenant.name || 'Soccer Team Finance',
          app_subtitle: 'Financial Management System',
          logo_url: null,
          logo_file_name: null,
          tenant_id: tenant.id
        })
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
    }
  };

  // Update branding settings with tenant isolation
  const updateBranding = async (updates) => {
    if (!tenant) return { success: false, error: 'No tenant information' };

    try {
      console.log('Updating branding for tenant:', tenant.id, 'with:', updates);

      // Get the current record ID for this tenant
      const { data: existingData } = await supabase
        .from('app_settings_stf2024')
        .select('id')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
        .limit(1);

      let result;
      if (existingData && existingData.length > 0) {
        // Update existing record
        const { data, error } = await supabase
          .from('app_settings_stf2024')
          .update({
            app_title: updates.appTitle !== undefined ? updates.appTitle : branding.appTitle,
            app_subtitle: updates.appSubtitle !== undefined ? updates.appSubtitle : branding.appSubtitle,
            logo_url: updates.logoUrl !== undefined ? updates.logoUrl : branding.logoUrl,
            logo_file_name: updates.logoFileName !== undefined ? updates.logoFileName : branding.logoFileName,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData[0].id)
          .eq('tenant_id', tenant.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('app_settings_stf2024')
          .insert({
            app_title: updates.appTitle || branding.appTitle,
            app_subtitle: updates.appSubtitle || branding.appSubtitle,
            logo_url: updates.logoUrl || branding.logoUrl,
            logo_file_name: updates.logoFileName || branding.logoFileName,
            tenant_id: tenant.id
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      console.log('Branding update result:', result);
      // Update local state
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

  // Upload logo file with tenant-specific storage
  const uploadLogo = async (file) => {
    if (!tenant) return { success: false, error: 'No tenant information' };

    try {
      console.log('Starting logo upload for tenant:', tenant.name);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
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

      if (result.success) {
        toast.success('Logo uploaded successfully!');
        return { success: true, logoUrl };
      }
      return result;
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error(error.message || 'Failed to upload logo');
      return { success: false, error: error.message };
    }
  };

  // Remove logo with tenant isolation
  const removeLogo = async () => {
    if (!tenant) return { success: false, error: 'No tenant information' };

    try {
      console.log('Removing logo...', branding.logoFileName);

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

      if (result.success) {
        toast.success('Logo removed successfully!');
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