import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import AppLogo from '../common/AppLogo';
import { useBranding } from '../../contexts/BrandingContext';
import toast from 'react-hot-toast';

const { FiSave, FiUpload, FiTrash2, FiEye, FiRefreshCw, FiImage, FiType, FiSettings } = FiIcons;

const BrandingSettings = () => {
  const { branding, updateBranding, uploadLogo, removeLogo, loading, fetchBranding } = useBranding();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    defaultValues: {
      appTitle: branding.appTitle,
      appSubtitle: branding.appSubtitle
    }
  });

  // Reset form when branding changes
  React.useEffect(() => {
    console.log('Resetting form with branding:', branding);
    reset({
      appTitle: branding.appTitle,
      appSubtitle: branding.appSubtitle
    });
    setValue('appTitle', branding.appTitle);
    setValue('appSubtitle', branding.appSubtitle);
  }, [branding, reset, setValue]);

  const onSubmit = async (data) => {
    console.log('Form submitted with data:', data);
    const result = await updateBranding({
      appTitle: data.appTitle,
      appSubtitle: data.appSubtitle
    });
    
    if (result.success) {
      // Refresh the data to ensure we have the latest
      setTimeout(() => {
        fetchBranding();
      }, 500);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('File selected:', file);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);

    // Upload file
    handleLogoUpload(file);
  };

  const handleLogoUpload = async (file) => {
    setUploading(true);
    try {
      const result = await uploadLogo(file);
      if (result.success) {
        setPreviewUrl(null);
        // Refresh the branding data
        setTimeout(() => {
          fetchBranding();
        }, 500);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (window.confirm('Are you sure you want to remove the current logo?')) {
      const result = await removeLogo();
      if (result.success) {
        setPreviewUrl(null);
        // Refresh the branding data
        setTimeout(() => {
          fetchBranding();
        }, 500);
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRefreshBranding = async () => {
    console.log('Refreshing branding data...');
    await fetchBranding();
    toast.success('Branding data refreshed!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Debug Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <SafeIcon icon={FiSettings} className="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">Current Branding State</h3>
              <p className="text-xs text-blue-700">
                Title: "{branding.appTitle}" | Subtitle: "{branding.appSubtitle}" | Logo: {branding.logoUrl ? 'Set' : 'None'}
              </p>
            </div>
          </div>
          <button
            onClick={handleRefreshBranding}
            className="flex items-center px-3 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-md transition-colors"
          >
            <SafeIcon icon={FiRefreshCw} className="w-4 h-4 mr-1" />
            Refresh
          </button>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <SafeIcon icon={FiEye} className="w-6 h-6 text-primary-600 mr-3" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Live Preview</h2>
            <p className="text-sm text-gray-600">See how your branding looks across different sizes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Extra Large */}
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 mb-3">Extra Large</p>
            <div className="flex justify-center">
              <AppLogo size="xl" animate={false} />
            </div>
          </div>

          {/* Large */}
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 mb-3">Large</p>
            <div className="flex justify-center">
              <AppLogo size="lg" animate={false} />
            </div>
          </div>

          {/* Medium */}
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 mb-3">Medium</p>
            <div className="flex justify-center">
              <AppLogo size="md" animate={false} />
            </div>
          </div>

          {/* Small */}
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 mb-3">Small</p>
            <div className="flex justify-center">
              <AppLogo size="sm" animate={false} />
            </div>
          </div>
        </div>

        {/* Icon Only Previews */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-3">Icon Only (for compact spaces)</p>
          <div className="flex items-center space-x-4">
            <AppLogo size="xl" showText={false} animate={false} />
            <AppLogo size="lg" showText={false} animate={false} />
            <AppLogo size="md" showText={false} animate={false} />
            <AppLogo size="sm" showText={false} animate={false} />
            <AppLogo size="xs" showText={false} animate={false} />
          </div>
        </div>
      </div>

      {/* App Title & Subtitle Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <SafeIcon icon={FiType} className="w-6 h-6 text-primary-600 mr-3" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">App Title & Subtitle</h2>
            <p className="text-sm text-gray-600">Customize your application's name and tagline</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                App Title *
              </label>
              <input
                type="text"
                {...register('appTitle', { 
                  required: 'App title is required',
                  maxLength: { value: 50, message: 'Title must be less than 50 characters' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter app title"
              />
              {errors.appTitle && (
                <p className="mt-1 text-sm text-red-600">{errors.appTitle.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                App Subtitle
              </label>
              <input
                type="text"
                {...register('appSubtitle', {
                  maxLength: { value: 100, message: 'Subtitle must be less than 100 characters' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter app subtitle"
              />
              {errors.appSubtitle && (
                <p className="mt-1 text-sm text-red-600">{errors.appSubtitle.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              <SafeIcon icon={FiSave} className="w-4 h-4 mr-2" />
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Logo Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <SafeIcon icon={FiImage} className="w-6 h-6 text-primary-600 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Logo Settings</h2>
              <p className="text-sm text-gray-600">Upload and manage your application logo</p>
            </div>
          </div>
          {branding.logoUrl && (
            <button
              onClick={handleRemoveLogo}
              className="flex items-center px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
            >
              <SafeIcon icon={FiTrash2} className="w-4 h-4 mr-2" />
              Remove Logo
            </button>
          )}
        </div>

        {/* Current Logo Display */}
        {(branding.logoUrl || previewUrl) && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-3">
              {previewUrl ? 'Preview' : 'Current Logo'}
            </p>
            <div className="flex items-center space-x-4">
              <img
                src={previewUrl || branding.logoUrl}
                alt="Logo"
                className="w-16 h-16 object-contain bg-white rounded-lg border border-gray-200"
              />
              <div className="text-sm text-gray-600">
                {previewUrl ? (
                  <p className="text-orange-600 font-medium">Preview - Upload in progress...</p>
                ) : (
                  <>
                    <p><strong>File:</strong> {branding.logoFileName}</p>
                    <p><strong>URL:</strong> {branding.logoUrl}</p>
                    <p><strong>Status:</strong> Active</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
            disabled={uploading}
          />
          
          <SafeIcon icon={FiUpload} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900">
              {branding.logoUrl ? 'Update Logo' : 'Upload Logo'}
            </p>
            <p className="text-sm text-gray-600">
              Drag and drop an image here, or click to browse
            </p>
            <p className="text-xs text-gray-500">
              Supports: PNG, JPG, GIF • Max size: 5MB • Recommended: Square format
            </p>
          </div>

          <button
            onClick={triggerFileInput}
            disabled={uploading}
            className="mt-4 flex items-center justify-center mx-auto px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SafeIcon icon={uploading ? FiRefreshCw : FiUpload} className={`w-4 h-4 mr-2 ${uploading ? 'animate-spin' : ''}`} />
            {uploading ? 'Uploading...' : 'Choose File'}
          </button>
        </div>

        {/* Logo Guidelines */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <SafeIcon icon={FiSettings} className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">Logo Guidelines</h3>
              <ul className="mt-2 text-sm text-blue-700 space-y-1">
                <li>• Use square or nearly square images for best results</li>
                <li>• Transparent backgrounds work best</li>
                <li>• High contrast logos are more readable</li>
                <li>• The logo will be automatically resized to fit different UI elements</li>
                <li>• Test your logo across different sizes using the preview above</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BrandingSettings;