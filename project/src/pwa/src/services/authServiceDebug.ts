import { supabase } from './supabase'

// ============================================================================
// DEBUG AUTH SERVICE
// ============================================================================
// This is a debug version of the auth service with detailed logging

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  first_name: string
  last_name: string
  phone?: string
}

export interface AuthResponse {
  user: any | null
  session: any | null
  error: string | null
}

class AuthServiceDebug {
  constructor() {
    console.log('🔧 AuthServiceDebug: Service initialized')
  }

  // Register a new PWA customer using Supabase Auth
  async register(data: RegisterData): Promise<AuthResponse> {
    console.log('🚀 AuthServiceDebug: Starting registration process')
    console.log('📝 AuthServiceDebug: Registration data:', {
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone
    })

    try {
      console.log('🔐 AuthServiceDebug: Step 1 - Calling Supabase Auth signUp...')
      
      // Use Supabase Auth to create user with customer role
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.first_name,
            last_name: data.last_name,
            phone: data.phone,
            customer_type: 'individual'
          }
        }
      })

      console.log('🔐 AuthServiceDebug: Step 1 - Supabase Auth response:', {
        hasUser: !!authData.user,
        userId: authData.user?.id,
        userEmail: authData.user?.email,
        hasError: !!authError,
        errorMessage: authError?.message
      })

      if (authError) {
        console.error('❌ AuthServiceDebug: Step 1 - Supabase Auth error:', authError)
        return {
          user: null,
          session: null,
          error: `Registration failed: ${authError.message}`
        }
      }

      if (!authData.user) {
        console.error('❌ AuthServiceDebug: Step 1 - No user data returned from Supabase Auth')
        return {
          user: null,
          session: null,
          error: 'Registration failed: No user data returned'
        }
      }

      console.log('✅ AuthServiceDebug: Step 1 - User created in auth.users successfully')
      console.log('🔄 AuthServiceDebug: Step 2 - Waiting for trigger to create customer record...')

      // Wait for trigger to create customer record
      await new Promise(resolve => setTimeout(resolve, 2000))
      console.log('⏰ AuthServiceDebug: Step 2 - Waited 2 seconds for trigger')

      // Check if customer record was created by trigger
      console.log('🔍 AuthServiceDebug: Step 3 - Checking if customer record exists...')
      
      let customer = null
      let retries = 0
      const maxRetries = 5

      while (!customer && retries < maxRetries) {
        console.log(`🔄 AuthServiceDebug: Step 3 - Attempt ${retries + 1}/${maxRetries} to fetch customer record`)
        
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', authData.user.id)
          .single()

        console.log('🔍 AuthServiceDebug: Step 3 - Customer fetch response:', {
          hasData: !!customerData,
          hasError: !!customerError,
          errorCode: customerError?.code,
          errorMessage: customerError?.message,
          errorDetails: customerError?.details,
          errorHint: customerError?.hint
        })

        if (customerData) {
          customer = customerData
          console.log('✅ AuthServiceDebug: Step 3 - Customer record found:', {
            id: customer.id,
            email: customer.email,
            first_name: customer.first_name,
            last_name: customer.last_name,
            customer_number: customer.customer_number,
            customer_code: customer.customer_code
          })
          break
        }

        if (customerError) {
          console.error(`❌ AuthServiceDebug: Step 3 - Customer fetch error (attempt ${retries + 1}):`, customerError)
        }

        retries++
        if (retries < maxRetries) {
          console.log(`⏰ AuthServiceDebug: Step 3 - Waiting 1 second before retry ${retries + 1}...`)
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      if (!customer) {
        console.error('❌ AuthServiceDebug: Step 3 - Customer record not found after all retries')
        
        // Try to manually create customer record as fallback
        console.log('🛠️ AuthServiceDebug: Step 4 - Attempting manual customer creation as fallback...')
        
        const { data: manualCustomer, error: manualError } = await supabase
          .from('customers')
          .insert({
            user_id: authData.user.id,
            email: authData.user.email,
            first_name: data.first_name,
            last_name: data.last_name,
            phone: data.phone,
            customer_type: 'regular',
            is_active: true,
            is_guest: false
          })
          .select()
          .single()

        console.log('🛠️ AuthServiceDebug: Step 4 - Manual customer creation response:', {
          hasData: !!manualCustomer,
          hasError: !!manualError,
          errorMessage: manualError?.message
        })

        if (manualCustomer) {
          customer = manualCustomer
          console.log('✅ AuthServiceDebug: Step 4 - Manual customer creation successful')
        } else {
          console.error('❌ AuthServiceDebug: Step 4 - Manual customer creation failed:', manualError)
          return {
            user: null,
            session: null,
            error: 'User created but failed to create customer record'
          }
        }
      }

      console.log('🔍 AuthServiceDebug: Step 5 - Checking RLS policies...')
      
      // Test RLS access
      const { data: rlsTest, error: rlsError } = await supabase
        .from('customers')
        .select('id, email')
        .eq('user_id', authData.user.id)
        .limit(1)

      console.log('🔍 AuthServiceDebug: Step 5 - RLS test response:', {
        hasData: !!rlsTest,
        dataLength: rlsTest?.length,
        hasError: !!rlsError,
        errorMessage: rlsError?.message
      })

      // Session will be handled by Supabase Auth and pwa_sessions
      console.log('✅ AuthServiceDebug: Registration completed successfully')
      return {
        user: customer,
        session: null, // Session managed by Supabase Auth
        error: null
      }

    } catch (error) {
      console.error('❌ AuthServiceDebug: Unexpected error during registration:', error)
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error.message : 'Registration failed'
      }
    }
  }

  // Login with email and password using Supabase Auth
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('🚀 AuthServiceDebug: Starting login process')
    console.log('📝 AuthServiceDebug: Login credentials:', { email: credentials.email })

    try {
      console.log('🔐 AuthServiceDebug: Step 1 - Calling Supabase Auth signInWithPassword...')
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      console.log('🔐 AuthServiceDebug: Step 1 - Supabase Auth response:', {
        hasUser: !!authData.user,
        userId: authData.user?.id,
        userEmail: authData.user?.email,
        hasSession: !!authData.session,
        hasError: !!authError,
        errorMessage: authError?.message
      })

      if (authError) {
        console.error('❌ AuthServiceDebug: Step 1 - Supabase Auth error:', authError)
        return {
          user: null,
          session: null,
          error: `Login failed: ${authError.message}`
        }
      }

      if (!authData.user) {
        console.error('❌ AuthServiceDebug: Step 1 - No user data returned from Supabase Auth')
        return {
          user: null,
          session: null,
          error: 'Login failed: No user data returned'
        }
      }

      console.log('✅ AuthServiceDebug: Step 1 - User authenticated successfully')
      console.log('🔍 AuthServiceDebug: Step 2 - Fetching customer record...')

      // Get customer from public.customers
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', authData.user.id)
        .single()

      console.log('🔍 AuthServiceDebug: Step 2 - Customer fetch response:', {
        hasData: !!customer,
        hasError: !!customerError,
        errorCode: customerError?.code,
        errorMessage: customerError?.message,
        errorDetails: customerError?.details
      })

      if (customerError || !customer) {
        console.error('❌ AuthServiceDebug: Step 2 - Error fetching customer record:', customerError)
        return {
          user: null,
          session: null,
          error: 'User not found in customer records'
        }
      }

      console.log('✅ AuthServiceDebug: Step 2 - Customer record found:', {
        id: customer.id,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name
      })

      // Session will be handled by Supabase Auth and pwa_sessions
      console.log('✅ AuthServiceDebug: Login completed successfully')
      return {
        user: customer,
        session: null, // Session managed by Supabase Auth
        error: null
      }

    } catch (error) {
      console.error('❌ AuthServiceDebug: Unexpected error during login:', error)
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error.message : 'Login failed'
      }
    }
  }


  // Test database connection and permissions
  async testDatabaseAccess() {
    console.log('🧪 AuthServiceDebug: Testing database access...')
    
    try {
      // Test 1: Check if we can access customers table
      console.log('🧪 AuthServiceDebug: Test 1 - Checking customers table access...')
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id, email')
        .limit(1)

      console.log('🧪 AuthServiceDebug: Test 1 - Customers table access:', {
        hasData: !!customers,
        dataLength: customers?.length,
        hasError: !!customersError,
        errorMessage: customersError?.message
      })

      // Test 2: Check if we can insert into customers table
      console.log('🧪 AuthServiceDebug: Test 2 - Testing customers table insert...')
      const testUserId = gen_random_uuid()
      const { data: insertData, error: insertError } = await supabase
        .from('customers')
        .insert({
          user_id: testUserId,
          email: 'test-debug@example.com',
          first_name: 'Test',
          last_name: 'Debug',
          customer_type: 'regular',
          is_active: true,
          is_guest: false
        })
        .select()

      console.log('🧪 AuthServiceDebug: Test 2 - Customers table insert:', {
        hasData: !!insertData,
        hasError: !!insertError,
        errorMessage: insertError?.message
      })

      // Clean up test data
      if (insertData) {
        await supabase
          .from('customers')
          .delete()
          .eq('user_id', testUserId)
        console.log('🧪 AuthServiceDebug: Test data cleaned up')
      }

      return {
        customersAccess: !customersError,
        customersInsert: !insertError,
        customersError: customersError?.message,
        insertError: insertError?.message
      }

    } catch (error) {
      console.error('❌ AuthServiceDebug: Database access test failed:', error)
      return {
        customersAccess: false,
        customersInsert: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Export singleton instance
export const authServiceDebug = new AuthServiceDebug()

// Helper function to generate UUID (if not available)
function gen_random_uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}




