import { createClient } from '@supabase/supabase-js'

// Get environment variables
const SUPABASE_URL = 'https://bjelydvroavsqczejpgd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWx5ZHZyb2F2c3FjemVqcGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjE2MDcsImV4cCI6MjA2NjU5NzYwN30.f-693IO1d0TCBQRiWcSTvjCT8I7bb0t9Op_gvD5LeIE'

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  )
}

// Validate URL format
if (!SUPABASE_URL.startsWith('https://') || !SUPABASE_URL.includes('.supabase.co')) {
  throw new Error('Invalid Supabase URL format. Expected: https://your-project.supabase.co')
}

// Create client with proper configuration
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: { 'X-Client-Info': 'soccer-team-finance' }
  }
})

// Test connection function
export const testConnection = async () => {
  try {
    // Simple select query to test connection - using a table that should definitely exist
    const { data, error } = await supabase
      .from('users_central')
      .select('id')
      .limit(1)

    if (error) {
      console.error('Connection test error:', error)
      return { success: false, error: error.message }
    }

    console.log('Connection test successful:', data)
    return { success: true, message: 'Connected successfully' }
  } catch (error) {
    console.error('Connection test failed:', error)
    return { success: false, error: error.message }
  }
}

// Get database info
export const getDatabaseInfo = () => {
  return {
    url: SUPABASE_URL,
    project_id: SUPABASE_URL.split('//')[1].split('.')[0],
    schema: 'public',
    tables: [
      'users_central',
      'tenants',
      'global_settings',
      'subscription_packages',
      'tenant_subscriptions',
      'subscription_payments',
      'subscription_reminders',
      'users_stf2024',
      'categories_stf2024',
      'items_stf2024',
      'transactions_stf2024',
      'platform_buttons_stf2024',
      'app_settings_stf2024'
    ]
  }
}

// Tenant management functions
export const createTenantSchema = async (schemaName) => {
  try {
    // This would need to be done via a secure Edge Function or RPC
    // For now, we'll simulate it
    console.log(`Creating schema: ${schemaName}`)
    return { success: true }
  } catch (error) {
    console.error('Error creating tenant schema:', error)
    return { success: false, error: error.message }
  }
}

export const duplicateTemplateToTenant = async (tenantSchemaName, domain) => {
  try {
    // This would copy all template data to the new tenant schema
    // Implementation would be via Edge Function
    console.log(`Duplicating template to: ${tenantSchemaName} with domain: ${domain}`)
    return { success: true }
  } catch (error) {
    console.error('Error duplicating template:', error)
    return { success: false, error: error.message }
  }
}

export default supabase