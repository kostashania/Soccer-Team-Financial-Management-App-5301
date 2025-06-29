import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://bjelydvroavsqczejpgd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWx5ZHZyb2F2c3FjemVqcGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjE2MDcsImV4cCI6MjA2NjU5NzYwN30.f-693IO1d0TCBQRiWcSTvjCT8I7bb0t9Op_gvD5LeIE'

if (SUPABASE_URL === 'https://<PROJECT-ID>.supabase.co' || SUPABASE_ANON_KEY === '<ANON_KEY>') {
  throw new Error('Missing Supabase variables')
}

// Create client with proper configuration
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})

// Test connection function
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('categories_stf2024')
      .select('count(*)', { count: 'exact' })
      .limit(1)
    
    if (error) throw error
    
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
    schema: 'public', // Supabase uses public schema by default
    tables: [
      'categories_stf2024',
      'items_stf2024', 
      'transactions_stf2024',
      'platform_buttons_stf2024',
      'users_stf2024'
    ]
  }
}

export default supabase