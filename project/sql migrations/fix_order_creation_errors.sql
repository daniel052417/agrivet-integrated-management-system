-- Fix Order Creation Database Errors
-- This script addresses the foreign key constraint violations and UUID issues

-- 1. Update audit_logs table to allow NULL user_id for customer-initiated operations
ALTER TABLE audit_logs 
ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add a constraint to allow NULL user_id for customer operations or valid staff user IDs
ALTER TABLE audit_logs 
ADD CONSTRAINT chk_audit_logs_user_id 
CHECK (user_id IS NULL OR user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

-- 3. Add a column to track if this was a customer-initiated action
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS is_customer_action BOOLEAN DEFAULT false;

-- 4. Add a column to track customer ID for customer actions
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);

-- 5. Update payments table to allow NULL processed_by for customer-initiated payments
ALTER TABLE payments 
ALTER COLUMN processed_by DROP NOT NULL;

-- 6. Update inventory_transactions table to allow NULL created_by for customer actions
ALTER TABLE inventory_transactions 
ALTER COLUMN created_by DROP NOT NULL;

-- 5. Ensure customers table has proper structure
-- Check if customers table exists and has the right columns
DO $$
BEGIN
    -- Create customers table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
        CREATE TABLE customers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            customer_code VARCHAR(50) UNIQUE NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(255) UNIQUE,
            phone VARCHAR(20),
            address TEXT,
            city VARCHAR(100),
            state VARCHAR(100),
            postal_code VARCHAR(20),
            country VARCHAR(100) DEFAULT 'Philippines',
            date_of_birth DATE,
            gender VARCHAR(10),
            customer_type VARCHAR(20) DEFAULT 'individual',
            is_active BOOLEAN DEFAULT true,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
    END IF;
END $$;

-- 6. Add missing columns to customers table if they don't exist
DO $$
BEGIN
    -- Add customer_code if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'customer_code') THEN
        ALTER TABLE customers ADD COLUMN customer_code VARCHAR(50) UNIQUE;
    END IF;
    
    -- Add other missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'city') THEN
        ALTER TABLE customers ADD COLUMN city VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'state') THEN
        ALTER TABLE customers ADD COLUMN state VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'postal_code') THEN
        ALTER TABLE customers ADD COLUMN postal_code VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'country') THEN
        ALTER TABLE customers ADD COLUMN country VARCHAR(100) DEFAULT 'Philippines';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'date_of_birth') THEN
        ALTER TABLE customers ADD COLUMN date_of_birth DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'gender') THEN
        ALTER TABLE customers ADD COLUMN gender VARCHAR(10);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'customer_type') THEN
        ALTER TABLE customers ADD COLUMN customer_type VARCHAR(20) DEFAULT 'individual';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'is_active') THEN
        ALTER TABLE customers ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'notes') THEN
        ALTER TABLE customers ADD COLUMN notes TEXT;
    END IF;
END $$;

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_customer_code ON customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);

-- 8. Add RLS policies for customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Allow public to insert customers (for guest orders)
CREATE POLICY "Allow public to insert customers" ON customers
    FOR INSERT WITH CHECK (true);

-- Allow public to select customers
CREATE POLICY "Allow public to select customers" ON customers
    FOR SELECT USING (true);

-- Allow public to update customers
CREATE POLICY "Allow public to update customers" ON customers
    FOR UPDATE USING (true);

-- 9. Fix inventory table constraints
-- Make sure inventory table allows updates
ALTER TABLE inventory 
DROP CONSTRAINT IF EXISTS chk_inventory_quantity_positive;

ALTER TABLE inventory 
ADD CONSTRAINT chk_inventory_quantity_positive 
CHECK (quantity_on_hand >= 0);

-- 10. Create a function to generate customer codes
CREATE OR REPLACE FUNCTION generate_customer_code()
RETURNS TEXT AS $$
BEGIN
    RETURN 'CUST-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('customer_code_seq')::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Create sequence for customer codes if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS customer_code_seq START 1;

-- 11. Add trigger to auto-generate customer codes
CREATE OR REPLACE FUNCTION set_customer_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.customer_code IS NULL OR NEW.customer_code = '' THEN
        NEW.customer_code := generate_customer_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_customer_code ON customers;
CREATE TRIGGER trigger_set_customer_code
    BEFORE INSERT ON customers
    FOR EACH ROW
    EXECUTE FUNCTION set_customer_code();

-- 12. Verify the fixes
SELECT 'System user created' as status, count(*) as count FROM users WHERE id = '00000000-0000-0000-0000-000000000000'
UNION ALL
SELECT 'Customers table ready' as status, count(*) as count FROM information_schema.tables WHERE table_name = 'customers'
UNION ALL
SELECT 'Audit logs constraint updated' as status, count(*) as count FROM information_schema.table_constraints WHERE constraint_name = 'chk_audit_logs_user_id';
