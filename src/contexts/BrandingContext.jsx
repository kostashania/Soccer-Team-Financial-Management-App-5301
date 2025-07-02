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
      const { data, error } = await supabase
        .from('app_settings_stf2024')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setBranding({
          appTitle: data.app_title || 'Soccer Team Finance',
          appSubtitle: data.app_subtitle || 'Financial Management System',
          logoUrl: data.logo_url,
          logoFileName: data.logo_file_name
        });
      }
    } catch (error) {
      console.error('Error fetching branding:', error);
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

  // Update branding settings
  const updateBranding = async (updates) => {
    try {
      const { data, error } = await supabase
        .from('app_settings_stf2024')
        .upsert({
          app_title: updates.appTitle || branding.appTitle,
          app_subtitle: updates.appSubtitle || branding.appSubtitle,
          logo_url: updates.logoUrl !== undefined ? updates.logoUrl : branding.logoUrl,
          logo_file_name: updates.logoFileName !== undefined ? updates.logoFileName : branding.logoFileName,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) throw error;

      setBranding({
        appTitle: data.app_title,
        appSubtitle: data.app_subtitle,
        logoUrl: data.logo_url,
        logoFileName: data.logo_file_name
      });

      toast.success('Branding updated successfully!');
      return { success: true };
    } catch (error) {
      console.error('Error updating branding:', error);
      toast.error('Failed to update branding');
      return { success: false, error: error.message };
    }
  };

  // Upload logo file
  const uploadLogo = async (file) => {
    try {
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

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('app-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('app-logos')
        .getPublicUrl(fileName);

      const logoUrl = urlData.publicUrl;

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
      // Delete from storage if exists
      if (branding.logoFileName) {
        await supabase.storage
          .from('app-logos')
          .remove([branding.logoFileName]);
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