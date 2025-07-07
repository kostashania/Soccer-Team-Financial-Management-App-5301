import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../lib/supabase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SubscriptionContext = createContext();

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const { user, tenant } = useAuth();
  const [packages, setPackages] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch available packages
  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_packages')
        .select('*')
        .eq('active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  // Fetch current tenant subscription
  const fetchCurrentSubscription = async () => {
    if (!tenant) return;
    try {
      const { data, error } = await supabase
        .from('tenant_subscriptions')
        .select(`
          *,
          package:subscription_packages(*)
        `)
        .eq('tenant_id', tenant.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setCurrentSubscription(data);
    } catch (error) {
      console.error('Error fetching current subscription:', error);
    }
  };

  // Fetch subscription history
  const fetchSubscriptionHistory = async () => {
    if (!tenant) return;
    try {
      const { data, error } = await supabase
        .from('tenant_subscriptions')
        .select(`
          *,
          package:subscription_packages(*)
        `)
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptionHistory(data || []);
    } catch (error) {
      console.error('Error fetching subscription history:', error);
    }
  };

  // Create new subscription
  const createSubscription = async (packageId, customPrice = null, customDuration = null) => {
    if (!tenant) return { success: false, error: 'No tenant found' };

    try {
      // Get package details
      const { data: packageData, error: packageError } = await supabase
        .from('subscription_packages')
        .select('*')
        .eq('id', packageId)
        .single();

      if (packageError) throw packageError;

      const price = customPrice || packageData.price;
      const duration = customDuration || packageData.duration_months;

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + duration);

      // Deactivate current subscription if exists
      if (currentSubscription) {
        await supabase
          .from('tenant_subscriptions')
          .update({ 
            status: 'cancelled',
            cancelled_at: new Date().toISOString()
          })
          .eq('id', currentSubscription.id);
      }

      // Create new subscription
      const { data, error } = await supabase
        .from('tenant_subscriptions')
        .insert({
          tenant_id: tenant.id,
          package_id: packageId,
          price: price,
          duration_months: duration,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: 'pending_payment',
          is_custom: customPrice !== null || customDuration !== null
        })
        .select()
        .single();

      if (error) throw error;

      // Update tenant subscription info
      await supabase
        .from('tenants')
        .update({
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          plan: packageData.name.toLowerCase()
        })
        .eq('id', tenant.id);

      await fetchCurrentSubscription();
      await fetchSubscriptionHistory();
      toast.success('Subscription created successfully!');
      
      return { success: true, subscription: data };
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error(`Failed to create subscription: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  // Process payment for subscription
  const processPayment = async (subscriptionId, paymentMethod, paymentDetails = {}) => {
    try {
      // In a real implementation, you would integrate with Stripe, PayPal, etc.
      // For now, we'll simulate payment processing
      const { data, error } = await supabase
        .from('tenant_subscriptions')
        .update({
          status: 'active',
          payment_method: paymentMethod,
          payment_details: paymentDetails,
          paid_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) throw error;

      // Create payment record
      await supabase
        .from('subscription_payments')
        .insert({
          subscription_id: subscriptionId,
          tenant_id: tenant.id,
          amount: data.price,
          payment_method: paymentMethod,
          payment_details: paymentDetails,
          status: 'completed',
          processed_at: new Date().toISOString()
        });

      await fetchCurrentSubscription();
      await fetchSubscriptionHistory();
      toast.success('Payment processed successfully!');
      return { success: true };
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(`Payment failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  // Cancel subscription
  const cancelSubscription = async (subscriptionId) => {
    try {
      const { error } = await supabase
        .from('tenant_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      await fetchCurrentSubscription();
      await fetchSubscriptionHistory();
      toast.success('Subscription cancelled successfully!');
      return { success: true };
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error(`Failed to cancel subscription: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  // Check if subscription is expiring soon
  const isExpiringSoon = (daysThreshold = 30) => {
    if (!currentSubscription) return false;
    const endDate = new Date(currentSubscription.end_date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= daysThreshold && daysUntilExpiry > 0;
  };

  // Check if subscription is expired
  const isExpired = () => {
    if (!currentSubscription) return false;
    const endDate = new Date(currentSubscription.end_date);
    const today = new Date();
    return today > endDate;
  };

  // Get days until expiry
  const getDaysUntilExpiry = () => {
    if (!currentSubscription) return null;
    const endDate = new Date(currentSubscription.end_date);
    const today = new Date();
    return Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchPackages(),
        fetchCurrentSubscription(),
        fetchSubscriptionHistory()
      ]);
      setLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user, tenant]);

  const value = {
    packages,
    currentSubscription,
    subscriptionHistory,
    loading,
    createSubscription,
    processPayment,
    cancelSubscription,
    fetchPackages,
    fetchCurrentSubscription,
    fetchSubscriptionHistory,
    isExpiringSoon,
    isExpired,
    getDaysUntilExpiry
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};