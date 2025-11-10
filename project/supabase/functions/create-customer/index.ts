// Edge Function: create-customer
// This function creates a customer record when called after user signup
// Deploy this to: supabase/functions/create-customer/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ResponseBody {
  success: boolean
  customer?: Record<string, unknown>
  message?: string
  skipped?: boolean
  error?: string
}

const respond = (status: number, body: ResponseBody) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload = await req.json()
    const isAuthHook = Boolean(payload?.type && payload?.record)
    const source = payload?.source ?? (isAuthHook ? 'auth-hook' : null)

    if (!source || source === 'auth-hook') {
      const provider =
        payload?.record?.app_metadata?.provider ??
        payload?.provider ??
        payload?.user_metadata?.provider

      if (provider && provider !== 'email') {
        console.log('Skipping automatic customer creation for OAuth provider:', provider)
        return respond(200, {
          success: true,
          skipped: true,
          message: 'OAuth sign-ins must complete profile manually'
        })
      }

      console.log('No source provided; ignoring request.')
      return respond(200, {
        success: true,
        skipped: true,
        message: 'No customer created – missing source'
      })
    }

    const userId =
      payload.user_id ??
      payload?.record?.id ??
      payload?.record?.user_id
    const email =
      payload.email ??
      payload?.record?.email ??
      payload?.record?.user_email

    if (!userId || !email) {
      throw new Error('Missing required fields: user_id and email')
    }

    console.log('Processing customer request:', { userId, email, source })

    const metadata = payload.user_metadata ?? payload.raw_user_meta_data ?? payload?.record?.user_metadata ?? {}
    const rawMetadata = payload.raw_user_meta_data ?? payload.user_metadata ?? {}

    const firstName = extractFirstName(metadata, rawMetadata, email)
    const lastName = extractLastName(metadata, rawMetadata)
    const phone = extractPhone(metadata, rawMetadata)

    const address = payload.address ?? null
    const city = payload.city ?? null
    const province = payload.province ?? null
    const postalCode = payload.postal_code ?? null
    const customerType = payload.customer_type ?? 'individual'

    const { data: existingCustomer } = await supabaseClient
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingCustomer) {
      console.log('Customer already exists, updating...', existingCustomer.id)

      const { error: updateError, data: updated } = await supabaseClient
        .from('customers')
        .update({
          first_name: firstName || existingCustomer.first_name,
          last_name: lastName || existingCustomer.last_name,
          phone: phone ?? existingCustomer.phone,
          address: address ?? existingCustomer.address,
          city: city ?? existingCustomer.city,
          province: province ?? existingCustomer.province,
          postal_code: postalCode ?? existingCustomer.postal_code,
          customer_type: customerType ?? existingCustomer.customer_type,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingCustomer.id)
        .select('*')
        .maybeSingle()

      if (updateError) {
        throw new Error(`Failed to update customer: ${updateError.message}`)
      }

      return respond(200, {
        success: true,
        customer: sanitiseCustomer(updated ?? existingCustomer),
        message: 'Customer updated'
      })
    }

    const { customerNumber, customerCode } = generateCustomerIdentifiers()
    const now = new Date().toISOString()

    const { data: customer, error } = await supabaseClient
      .from('customers')
      .insert({
        user_id: userId,
        customer_number: customerNumber,
        customer_code: customerCode,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        customer_type: customerType,
        is_active: true,
        is_guest: false,
        address,
        city,
        province,
        postal_code: postalCode,
        registration_date: now,
        total_spent: 0,
        total_lifetime_spent: 0,
        loyalty_points: 0,
        loyalty_tier: 'bronze',
        created_at: now,
        updated_at: now
      })
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to create customer: ${error.message}`)
    }

    console.log('Customer created successfully:', customer.id)

    return respond(200, {
      success: true,
      customer: sanitiseCustomer(customer),
      message: 'Customer created'
    })

  } catch (error) {
    console.error('create-customer error:', error)
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return respond(400, {
      success: false,
      error: message
    })
  }
})

function extractFirstName(metadata: any, raw: any, email: string): string {
  return (
    metadata?.first_name ||
    raw?.first_name ||
    metadata?.given_name ||
    raw?.given_name ||
    splitName(metadata?.full_name || raw?.full_name || metadata?.name)[0] ||
    email.split('@')[0]
  )
}

function extractLastName(metadata: any, raw: any): string {
  const fullName = metadata?.full_name || raw?.full_name || metadata?.name || ''
  const nameParts = splitName(fullName)

  return (
    metadata?.last_name ||
    raw?.last_name ||
    metadata?.family_name ||
    raw?.family_name ||
    nameParts.slice(1).join(' ')
  )
}

function extractPhone(metadata: any, raw: any): string | null {
  return (
    metadata?.phone ||
    raw?.phone ||
    metadata?.phone_number ||
    raw?.phone_number ||
    null
  )
}

function splitName(fullName?: string): string[] {
  if (!fullName) return []
  return fullName.trim().split(/\s+/)
}

function generateCustomerIdentifiers() {
  const now = new Date()
  const datePart = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`
  const random = Math.floor(1000 + Math.random() * 9000)
  return {
    customerNumber: `CUST-${datePart}-${random}`,
    customerCode: `C${datePart}${random}`
  }
}

function sanitiseCustomer(customer: Record<string, unknown>) {
  return {
    id: customer.id,
    customer_number: customer.customer_number,
    customer_code: customer.customer_code,
    email: customer.email,
    first_name: customer.first_name,
    last_name: customer.last_name,
    phone: customer.phone,
    address: customer.address,
    city: customer.city,
    province: customer.province,
    postal_code: customer.postal_code,
    customer_type: customer.customer_type,
    is_active: customer.is_active,
    created_at: customer.created_at,
    updated_at: customer.updated_at
  }
}
