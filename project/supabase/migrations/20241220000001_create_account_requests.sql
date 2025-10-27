-- Create account_requests table
CREATE TABLE IF NOT EXISTS public.account_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL,
  staff_name VARCHAR(255) NOT NULL,
  staff_email VARCHAR(255) NOT NULL,
  requested_by UUID NOT NULL,
  requested_by_name VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'::VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE NULL,
  rejected_at TIMESTAMP WITH TIME ZONE NULL,
  approved_by UUID NULL,
  rejected_by UUID NULL,
  rejection_reason TEXT NULL,
  email_sent BOOLEAN DEFAULT FALSE,
  notes TEXT NULL,
  
  CONSTRAINT account_requests_pkey PRIMARY KEY (id),
  CONSTRAINT fk_account_requests_staff_id FOREIGN KEY (staff_id) REFERENCES public.staff (id) ON DELETE CASCADE,
  CONSTRAINT fk_account_requests_requested_by FOREIGN KEY (requested_by) REFERENCES public.users (id) ON DELETE CASCADE,
  CONSTRAINT fk_account_requests_approved_by FOREIGN KEY (approved_by) REFERENCES public.users (id) ON DELETE SET NULL,
  CONSTRAINT fk_account_requests_rejected_by FOREIGN KEY (rejected_by) REFERENCES public.users (id) ON DELETE SET NULL,
  CONSTRAINT account_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_account_requests_staff_id ON public.account_requests (staff_id);
CREATE INDEX IF NOT EXISTS idx_account_requests_status ON public.account_requests (status);
CREATE INDEX IF NOT EXISTS idx_account_requests_created_at ON public.account_requests (created_at);
CREATE INDEX IF NOT EXISTS idx_account_requests_requested_by ON public.account_requests (requested_by);

-- Add RLS policies
ALTER TABLE public.account_requests ENABLE ROW LEVEL SECURITY;

-- Policy for HR users to view and create requests
CREATE POLICY "HR users can view account requests" ON public.account_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('hr_admin', 'hr_staff', 'super_admin')
    )
  );

CREATE POLICY "HR users can create account requests" ON public.account_requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('hr_admin', 'hr_staff', 'super_admin')
    )
  );

-- Policy for user management to update requests
CREATE POLICY "User management can update account requests" ON public.account_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'admin')
    )
  );
