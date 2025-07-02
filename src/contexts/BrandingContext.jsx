import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../lib/supabase';
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
  const [branding, setBranding] = useState({
    appTitle: 'Soccer Team Finance',
    appSubtitle: 'Financial Management System',
    logoUrl: null,
    logoFileName: null
  });
  const [loading, setLoading] = useState(true);

  // Fetch branding settings
  const fetchBranding = async () => {
    try {
      setLoading(true);
      console.log('Fetching branding settings...');

      // Try to get existing settings
      const { data, error } = await supabase
        .from('app_settings_stf2024')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching branding:', error);
        throw error;
      }

      console.log('Branding data fetched:', data);

      if (data && data.length > 0) {
        const settings = data[0];
        const newBranding = {
          appTitle: settings.app_title || 'Soccer Team Finance',
          appSubtitle: settings.app_subtitle || 'Financial Management System',
          logoUrl: settings.logo_url,
          logoFileName: settings.logo_file_name
        };
        
        console.log('Setting branding to:', newBranding);
        setBranding(newBranding);
      } else {
        console.log('No branding data found, creating default...');
        // Create default settings
        await createDefaultSettings();
      }
    } catch (error) {
      console.error('Error in fetchBranding:', error);
      // Use defaults on error
      setBranding({
        appTitle: 'Soccer Team Finance',
        appSubtitle: 'Financial Management System',
        logoUrl: null,
        logoFileName: null
      });
    } finally {
      setLoading(false);
    }
  };

  // Create default settings
  const createDefaultSettings = async () => {
    try {
      console.log('Creating default settings...');
      const { data, error } = await supabase
        .from('app_settings_stf2024')
        .insert({
          app_title: 'Soccer Team Finance',
          app_subtitle: 'Financial Management System',
          logo_url: null,
          logo_file_name: null
        })
        .select()
        .single();

      if (error) throw error;

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

  // Update branding settings
  const updateBranding = async (updates) => {
    try {
      console.log('Updating branding with:', updates);

      // Get the current record ID
      const { data: existingData } = await supabase
        .from('app_settings_stf2024')
        .select('id')
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
            logo_file_name: updates.logoFileName || branding.logoFileName
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

  // Upload logo file
  const uploadLogo = async (file) => {
    try {
      console.log('Starting logo upload...', file);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `logo_${Date.now()}.${fileExt}`;

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

  // Remove logo
  const removeLogo = async () => {
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
    fetchBranding();
  }, []);

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