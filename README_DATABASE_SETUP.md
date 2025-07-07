# Database Setup for Subscription Management

## Issue Resolution: "Failed to create package: Database error occurred"

The error occurs because the `subscription_packages` table doesn't exist in your Supabase database. Here's how to fix it:

## Step 1: Create the Required Tables

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the SQL Script**
   - Copy the entire content from `create_subscription_tables.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the script

## Step 2: Verify Table Creation

After running the script, verify that these tables were created:

- `subscription_packages` - Stores package definitions
- `tenant_subscriptions` - Stores tenant subscription records
- `subscription_payments` - Stores payment history
- `discount_codes` - Stores discount codes
- `subscription_reminders` - Stores reminder settings

## Step 3: Check Row Level Security (RLS)

The script automatically sets up Row Level Security policies to ensure:

- Only superadmins can create/edit packages
- Tenants can only see their own subscriptions
- Payment data is properly isolated

## Step 4: Verify Default Data

The script also inserts default packages:

1. **Basic Plan** - €50/year, up to 10 users
2. **Professional Plan** - €100/year, up to 50 users  
3. **Enterprise Plan** - €200/year, unlimited users

## Step 5: Test Package Creation

After running the SQL script:

1. Go to Super Admin → Package Management
2. Try creating a new package
3. The error should be resolved

## Troubleshooting

If you still encounter issues:

1. **Check Permissions**: Ensure your database user has CREATE TABLE permissions
2. **Check Dependencies**: Verify the `tenants` and `users_central` tables exist
3. **Check UUID Extension**: Ensure the `uuid-ossp` extension is enabled

## Alternative: Manual Table Creation

If the automated script fails, you can create tables manually using the Supabase Dashboard:

1. Go to Database → Tables
2. Create each table manually using the schema from the SQL file

## Verification Query

Run this query to verify everything is working:

```sql
SELECT 
  table_name,
  column_name,
  data_type 
FROM information_schema.columns 
WHERE table_name IN (
  'subscription_packages',
  'tenant_subscriptions', 
  'subscription_payments',
  'discount_codes',
  'subscription_reminders'
)
ORDER BY table_name, ordinal_position;
```

This should return all columns for the subscription-related tables.