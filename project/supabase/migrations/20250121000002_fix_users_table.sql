-- Fix Users Table for Staff-User Integration
-- This migration ensures the users table has proper UUID generation

-- 1. Ensure the users table has proper UUID default for id column
-- First, check if the column exists and has the right type
DO $$
BEGIN
    -- Check if the id column exists and is of type UUID
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'id' 
        AND data_type = 'uuid'
    ) THEN
        -- If id column doesn't exist or is not UUID, alter it
        ALTER TABLE users 
        ALTER COLUMN id SET DATA TYPE UUID USING id::UUID;
    END IF;
    
    -- Set default value for id column if it doesn't have one
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'id' 
        AND column_default IS NOT NULL
    ) THEN
        ALTER TABLE users 
        ALTER COLUMN id SET DEFAULT gen_random_uuid();
    END IF;
    
    -- Make sure id is the primary key
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'users' 
        AND constraint_type = 'PRIMARY KEY'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT users_pkey PRIMARY KEY (id);
    END IF;
END $$;

-- 2. Ensure the users table has proper constraints
-- Make sure email is unique
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'users' 
        AND constraint_name = 'users_email_key'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT users_email_key UNIQUE (email);
    END IF;
END $$;

-- 3. Add any missing columns with proper defaults
DO $$
BEGIN
    -- Add username column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'username'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN username VARCHAR(50) UNIQUE;
    END IF;
    
    -- Add password_hash column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN password_hash TEXT;
    END IF;
    
    -- Add first_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'first_name'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN first_name VARCHAR(100);
    END IF;
    
    -- Add last_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'last_name'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN last_name VARCHAR(100);
    END IF;
    
    -- Add phone_number column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'phone_number'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN phone_number VARCHAR(20);
    END IF;
    
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Add last_login_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'last_login_at'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add role column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN role VARCHAR(50) DEFAULT 'user';
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
END $$;

-- 4. Create trigger for updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.triggers 
        WHERE trigger_name = 'update_users_updated_at'
    ) THEN
        CREATE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON users 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 5. Add comments for documentation
COMMENT ON TABLE users IS 'User accounts for the system';
COMMENT ON COLUMN users.id IS 'Primary key - UUID';
COMMENT ON COLUMN users.email IS 'User email address - must be unique';
COMMENT ON COLUMN users.username IS 'Username for login - must be unique';
COMMENT ON COLUMN users.role IS 'User role (admin, manager, staff, user, etc.)';
COMMENT ON COLUMN users.staff_id IS 'Reference to linked staff record';




