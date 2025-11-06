-- Create staff_faces table for storing facial recognition data
-- This table stores face descriptors/embeddings for staff members

CREATE TABLE IF NOT EXISTS staff_faces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  
  -- Face descriptor data (stored as JSONB array of numbers)
  -- This is the 128-dimensional face descriptor from face-api.js
  face_descriptor JSONB NOT NULL,
  
  -- Face image data (optional, can store base64 or URL)
  face_image_url TEXT,
  
  -- Metadata
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  registered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT true, -- Primary face descriptor for the staff member
  
  -- Additional metadata
  device_info JSONB, -- Store device info if needed
  confidence_score DECIMAL(5, 4), -- Confidence score of face detection
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT staff_faces_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  CONSTRAINT staff_faces_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
  CONSTRAINT staff_faces_registered_by_fkey FOREIGN KEY (registered_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_staff_faces_staff_id ON staff_faces(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_faces_branch_id ON staff_faces(branch_id);
CREATE INDEX IF NOT EXISTS idx_staff_faces_is_active ON staff_faces(is_active);
CREATE INDEX IF NOT EXISTS idx_staff_faces_is_primary ON staff_faces(is_primary);

-- Create unique constraint: one primary face per staff member
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_faces_primary_per_staff 
ON staff_faces(staff_id) 
WHERE is_primary = true AND is_active = true;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_staff_faces_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_staff_faces_updated_at
BEFORE UPDATE ON staff_faces
FOR EACH ROW
EXECUTE FUNCTION update_staff_faces_updated_at();

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE staff_faces ENABLE ROW LEVEL SECURITY;

-- Policy: Staff can view their own face data
CREATE POLICY "Staff can view own face data"
ON staff_faces FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM staff 
    WHERE staff.id = staff_faces.staff_id 
    AND staff.user_account_id = auth.uid()
  )
);

-- Policy: HR and admins can manage all face data
CREATE POLICY "HR and admins can manage face data"
ON staff_faces FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    JOIN user_roles ON users.id = user_roles.user_id
    JOIN roles ON user_roles.role_id = roles.id
    WHERE users.id = auth.uid()
    AND (roles.name = 'hr-admin' OR roles.name = 'hr-staff' OR roles.name = 'super-admin')
  )
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON staff_faces TO authenticated;
GRANT USAGE ON SEQUENCE staff_faces_id_seq TO authenticated;



