-- Fix Foreign Key Constraints for Staff-User Integration
-- This migration removes problematic foreign key constraints

-- 1. Check and remove any problematic foreign key constraints on users table
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Find all foreign key constraints on the users table
    FOR constraint_record IN
        SELECT 
            tc.constraint_name,
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE 
            tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'users'
    LOOP
        -- Drop the foreign key constraint
        EXECUTE 'ALTER TABLE ' || constraint_record.table_name || 
                ' DROP CONSTRAINT IF EXISTS ' || constraint_record.constraint_name;
        
        RAISE NOTICE 'Dropped foreign key constraint: %', constraint_record.constraint_name;
    END LOOP;
END $$;

-- 2. Check and remove any problematic foreign key constraints on staff table
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Find all foreign key constraints on the staff table
    FOR constraint_record IN
        SELECT 
            tc.constraint_name,
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE 
            tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'staff'
    LOOP
        -- Drop the foreign key constraint
        EXECUTE 'ALTER TABLE ' || constraint_record.table_name || 
                ' DROP CONSTRAINT IF EXISTS ' || constraint_record.constraint_name;
        
        RAISE NOTICE 'Dropped foreign key constraint: %', constraint_record.constraint_name;
    END LOOP;
END $$;

-- 3. Recreate proper foreign key constraints for staff table
-- Add user_account_id foreign key constraint to staff table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'staff' 
        AND constraint_name = 'staff_user_account_id_fkey'
    ) THEN
        ALTER TABLE staff 
        ADD CONSTRAINT staff_user_account_id_fkey 
        FOREIGN KEY (user_account_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Recreate proper foreign key constraints for users table
-- Add staff_id foreign key constraint to users table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'users' 
        AND constraint_name = 'users_staff_id_fkey'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT users_staff_id_fkey 
        FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 5. Ensure proper constraints on new integration tables
-- Fix staff_user_links foreign key constraints
DO $$
BEGIN
    -- Drop existing constraints if they exist
    ALTER TABLE staff_user_links DROP CONSTRAINT IF EXISTS staff_user_links_staff_id_fkey;
    ALTER TABLE staff_user_links DROP CONSTRAINT IF EXISTS staff_user_links_user_id_fkey;
    
    -- Recreate proper constraints
    ALTER TABLE staff_user_links 
    ADD CONSTRAINT staff_user_links_staff_id_fkey 
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE;
    
    ALTER TABLE staff_user_links 
    ADD CONSTRAINT staff_user_links_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
END $$;

-- Fix account_creation_workflow foreign key constraints
DO $$
BEGIN
    -- Drop existing constraints if they exist
    ALTER TABLE account_creation_workflow DROP CONSTRAINT IF EXISTS account_creation_workflow_staff_id_fkey;
    
    -- Recreate proper constraints
    ALTER TABLE account_creation_workflow 
    ADD CONSTRAINT account_creation_workflow_staff_id_fkey 
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE;
END $$;

-- Fix email_invitations foreign key constraints
DO $$
BEGIN
    -- Drop existing constraints if they exist
    ALTER TABLE email_invitations DROP CONSTRAINT IF EXISTS email_invitations_staff_id_fkey;
    
    -- Recreate proper constraints
    ALTER TABLE email_invitations 
    ADD CONSTRAINT email_invitations_staff_id_fkey 
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE;
END $$;

-- 6. Add comments for documentation
COMMENT ON CONSTRAINT staff_user_account_id_fkey ON staff IS 'Links staff to their user account';
COMMENT ON CONSTRAINT users_staff_id_fkey ON users IS 'Links user account to staff record';
COMMENT ON CONSTRAINT staff_user_links_staff_id_fkey ON staff_user_links IS 'Links to staff record';
COMMENT ON CONSTRAINT staff_user_links_user_id_fkey ON staff_user_links IS 'Links to user account';
COMMENT ON CONSTRAINT account_creation_workflow_staff_id_fkey ON account_creation_workflow IS 'Links to staff record';
COMMENT ON CONSTRAINT email_invitations_staff_id_fkey ON email_invitations IS 'Links to staff record';




