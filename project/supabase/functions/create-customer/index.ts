// Edge Function: create-customer
// This function creates a customer record when called after user signup
// Deploy this to: supabase/functions/create-customer/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    // Supabase automatically provides these environment variables to Edge Functions
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the request body
    const { user_id, email, user_metadata, raw_user_meta_data } = await req.json()

    if (!user_id || !email) {
      throw new Error('Missing required fields: user_id and email')
    }

    console.log('Creating customer for user:', { user_id, email })

    // Extract user data from metadata
    const firstName = extractFirstName(user_metadata, raw_user_meta_data, email)
    const lastName = extractLastName(user_metadata, raw_user_meta_data)
    const phone = extractPhone(user_metadata, raw_user_meta_data)

    // Generate unique customer identifiers
    const timestamp = Date.now().toString().slice(-8)
    const customerNumber = `CUST-${timestamp}`
    const customerCode = `C${timestamp}`

    // Create customer record
    const { data: customer, error } = await supabaseClient
      .from('customers')
      .insert({
        user_id,
        customer_number: customerNumber,
        customer_code: customerCode,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        customer_type: 'individual',
        is_active: true,
        is_guest: false,
        registration_date: new Date().toISOString(),
        total_spent: 0.00,
        total_lifetime_spent: 0.00,
        loyalty_points: 0,
        loyalty_tier: 'bronze',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating customer:', error)
      throw new Error(`Failed to create customer: ${error.message}`)
    }

    console.log('Customer created successfully:', customer.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        customer: {
          id: customer.id,
          customer_number: customer.customer_number,
          email: customer.email,
          first_name: customer.first_name,
          last_name: customer.last_name
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

// Helper functions to extract user data
function extractFirstName(userMetadata: any, rawUserMetaData: any, email: string): string {
  return (
    rawUserMetaData?.first_name ||
    userMetadata?.first_name ||
    userMetadata?.given_name ||
    splitName(rawUserMetaData?.full_name || userMetadata?.full_name || userMetadata?.name || email)[0] ||
    email.split('@')[0]
  )
}

function extractLastName(userMetadata: any, rawUserMetaData: any): string {
  const fullName = rawUserMetaData?.full_name || userMetadata?.full_name || userMetadata?.name || ''
  const nameParts = splitName(fullName)
  
  return (
    rawUserMetaData?.last_name ||
    userMetadata?.last_name ||
    userMetadata?.family_name ||
    nameParts.slice(1).join(' ') ||
    ''
  )
}

function extractPhone(userMetadata: any, rawUserMetaData: any): string | null {
  return (
    rawUserMetaData?.phone ||
    userMetadata?.phone ||
    userMetadata?.phone_number ||
    null
  )
}

function splitName(fullName: string): string[] {
  if (!fullName) return []
  return fullName.trim().split(/\s+/)
}
