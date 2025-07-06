-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Subscription Packages Table
CREATE TABLE IF NOT EXISTS subscription_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_months INTEGER NOT NULL DEFAULT 12,
  max_users INTEGER, -- NULL means unlimited
  features JSONB DEFAULT '[]'::jsonb,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenant Subscriptions Table
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES subscription_packages(id),
  price DECIMAL(10,2) NOT NULL, -- Actual price paid (may differ from package price for custom subscriptions)
  duration_months INTEGER NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'active', 'cancelled', 'expired')),
  is_custom BOOLEAN DEFAULT false, -- True if price or duration differs from package
  payment_method VARCHAR(100),
  payment_details JSONB,
  notes TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription Payments Table (for payment history)
CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES tenant_subscriptions(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(100) NOT NULL,
  payment_details JSONB,
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id VARCHAR(255), -- External payment processor transaction ID
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Discount Codes Table (for future use)
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value DECIMAL(10,2) NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant_id ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON tenant_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_end_date ON tenant_subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription_id ON subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_tenant_id ON subscription_payments(tenant_id);

-- Row Level Security
ALTER TABLE subscription_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Packages are readable by everyone (for package selection)
CREATE POLICY "Public read access on packages" ON subscription_packages FOR SELECT USING (active = true);

-- Only superadmins can manage packages
CREATE POLICY "Superadmin full access on packages" ON subscription_packages FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users_central 
    WHERE id = auth.uid() AND role = 'superadmin'
  )
);

-- Tenants can read their own subscriptions
CREATE POLICY "Tenants read own subscriptions" ON tenant_subscriptions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users_central u
    JOIN tenants t ON u.tenant_id = t.id
    WHERE u.id = auth.uid() AND t.id = tenant_id
  )
);

-- Superadmins can manage all subscriptions
CREATE POLICY "Superadmin full access on subscriptions" ON tenant_subscriptions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users_central 
    WHERE id = auth.uid() AND role = 'superadmin'
  )
);

-- Similar policies for payments and discount codes...

-- Insert default packages
INSERT INTO subscription_packages (name, description, price, duration_months, max_users, features, active) VALUES
('Basic Plan', 'Perfect for small teams getting started with financial management', 50.00, 12, 10, 
 '["Financial tracking", "Basic reports", "Email support", "Up to 10 users", "Mobile access"]', true),
('Professional Plan', 'Ideal for growing teams with advanced needs', 100.00, 12, 50, 
 '["Advanced financial tracking", "Detailed reports", "Priority support", "Up to 50 users", "Custom branding", "API access"]', true),
('Enterprise Plan', 'Complete solution for large organizations', 200.00, 12, null, 
 '["Full financial suite", "Advanced analytics", "24/7 support", "Unlimited users", "Custom integrations", "Dedicated account manager"]', true)
ON CONFLICT DO NOTHING;

-- Insert default discount codes
INSERT INTO discount_codes (code, type, value, max_uses, description, active) VALUES
('WELCOME2024', 'percentage', 20.00, 100, '20% discount for new customers', true),
('SAVE50', 'fixed', 50.00, 50, 'Fixed 50€ discount', true)
ON CONFLICT (code) DO NOTHING;