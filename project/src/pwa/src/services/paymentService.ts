import { PaymentMethod, PaymentTransaction, Payment } from '../types'
import { supabase } from './supabase'
import { getManilaTimestamp } from '../utils/dateTime'

interface PaymentServiceConfig {
  supabaseUrl: string
  supabaseAnonKey: string
}

interface CreatePaymentRequest {
  orderId: string
  paymentMethodId: string
  amount: number
  referenceNumber?: string
  notes?: string
  processedBy: string
}

interface CreatePaymentResponse {
  success: boolean
  payment?: Payment
  paymentId?: string
  error?: string
}

interface ProcessPaymentRequest {
  orderId: string
  paymentMethod: string
  amount: number
  referenceNumber?: string
  gatewayResponse?: any
  processedBy: string
}

class PaymentService {
  private config: PaymentServiceConfig

  constructor(config: PaymentServiceConfig) {
    this.config = config
  }

  /**
   * Initialize Supabase client (helper method)
   */
  private async initSupabase(): Promise<void> {
    // Wait a bit for Supabase to initialize
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  /**
   * Get all available payment methods
   */
  async getPaymentMethods(): Promise<{ success: boolean; methods?: PaymentMethod[]; error?: string }> {
    try {
      // Wait for Supabase client to be initialized
      if (!supabase) {
        await this.initSupabase()
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data: methods, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) {
        throw new Error(`Failed to fetch payment methods: ${error.message}`)
      }

      return {
        success: true,
        methods
      }

    } catch (error) {
      console.error('Error fetching payment methods:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Create a payment record
   */
  async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    try {
      // Wait for Supabase client to be initialized
      if (!supabase) {
        await this.initSupabase()
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { orderId, paymentMethodId, amount, referenceNumber, notes, processedBy } = request

      // Get payment method details to calculate processing fee
      const { data: paymentMethod, error: methodError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('id', paymentMethodId)
        .single()

      if (methodError) {
        throw new Error(`Payment method not found: ${methodError.message}`)
      }

      // Calculate processing fee
      const processingFee = amount * (paymentMethod.processing_fee || 0)

      const paymentData = {
        order_id: orderId,
        payment_method_id: paymentMethodId,
        amount,
        reference_number: referenceNumber || null,
        status: 'pending',
        processing_fee: processingFee,
        notes: notes || null,
        processed_by: processedBy,
        created_at: getManilaTimestamp()
      }

      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert(paymentData)
        .select(`
          *,
          payment_method:payment_methods(*),
          order:orders(*)
        `)
        .single()

      if (paymentError) {
        throw new Error(`Failed to create payment: ${paymentError.message}`)
      }

      return {
        success: true,
        payment,
        paymentId: payment.id
      }

    } catch (error) {
      console.error('Error creating payment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Process payment transaction (for digital payments)
   */
  async processPayment(request: ProcessPaymentRequest): Promise<CreatePaymentResponse> {
    try {
      // Wait for Supabase client to be initialized
      if (!supabase) {
        await this.initSupabase()
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { orderId, paymentMethod, amount, referenceNumber, gatewayResponse, processedBy } = request

      // Find payment method by type
      const { data: paymentMethodData, error: methodError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('type', paymentMethod)
        .eq('is_active', true)
        .single()

      if (methodError) {
        throw new Error(`Payment method not found: ${methodError.message}`)
      }

      // Create payment transaction record
      const transactionData = {
        order_id: orderId,
        transaction_id: referenceNumber || `TXN-${Date.now()}`,
        payment_method: paymentMethod,
        payment_gateway: this.getGatewayName(paymentMethod),
        amount,
        currency: 'PHP',
        processing_fee: amount * (paymentMethodData.processing_fee || 0),
        status: 'pending',
        reference_number: referenceNumber,
        gateway_response: gatewayResponse || null,
        created_at: getManilaTimestamp()
      }

      const { data: transaction, error: transactionError } = await supabase
        .from('payment_transactions')
        .insert(transactionData)
        .select()
        .single()

      if (transactionError) {
        throw new Error(`Failed to create payment transaction: ${transactionError.message}`)
      }

      // Create payment record
      const paymentResult = await this.createPayment({
        orderId,
        paymentMethodId: paymentMethodData.id,
        amount,
        referenceNumber,
        processedBy
      })

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Failed to create payment')
      }

      return paymentResult

    } catch (error) {
      console.error('Error processing payment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(paymentId: string, status: string, gatewayStatus?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Wait for Supabase client to be initialized
      if (!supabase) {
        await this.initSupabase()
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const updateData: any = {
        status,
        updated_at: getManilaTimestamp()
      }

      if (gatewayStatus) {
        updateData.gateway_status = gatewayStatus
      }

      if (status === 'completed') {
        updateData.completed_at = getManilaTimestamp()
      }

      const { error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', paymentId)

      if (error) {
        throw new Error(`Failed to update payment status: ${error.message}`)
      }

      return { success: true }

    } catch (error) {
      console.error('Error updating payment status:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get payment by order ID
   */
  async getPaymentByOrder(orderId: string): Promise<{ success: boolean; payment?: Payment; error?: string }> {
    try {
      // Wait for Supabase client to be initialized
      if (!supabase) {
        await this.initSupabase()
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data: payment, error } = await supabase
        .from('payments')
        .select(`
          *,
          payment_method:payment_methods(*),
          order:orders(*)
        `)
        .eq('order_id', orderId)
        .single()

      if (error) {
        throw new Error(`Failed to get payment: ${error.message}`)
      }

      return {
        success: true,
        payment
      }

    } catch (error) {
      console.error('Error getting payment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get payment transactions for an order
   */
  async getPaymentTransactions(orderId: string): Promise<{ success: boolean; transactions?: PaymentTransaction[]; error?: string }> {
    try {
      // Wait for Supabase client to be initialized
      if (!supabase) {
        await this.initSupabase()
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data: transactions, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to get payment transactions: ${error.message}`)
      }

      return {
        success: true,
        transactions
      }

    } catch (error) {
      console.error('Error getting payment transactions:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Process cash payment
   */
  async processCashPayment(orderId: string, amount: number, processedBy: string | null = null): Promise<CreatePaymentResponse> {
    try {
      // Wait for Supabase client to be initialized
      if (!supabase) {
        await this.initSupabase()
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      // Get cash payment method
      const { data: cashMethod, error: methodError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('type', 'cash')
        .eq('is_active', true)
        .single()

      if (methodError) {
        throw new Error(`Cash payment method not found: ${methodError.message}`)
      }

      // Create payment record
      const paymentData = {
        order_id: orderId,
        payment_method_id: cashMethod.id,
        amount,
        reference_number: `CASH-${Date.now()}`,
        status: 'completed', // Cash payments are immediately completed
        processing_fee: 0, // No processing fee for cash
        notes: 'Cash payment at pickup',
        processed_by: processedBy, // null for customer-initiated payments
        created_at: getManilaTimestamp()
      }

      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert(paymentData)
        .select(`
          *,
          payment_method:payment_methods(*)
        `)
        .single()

      if (paymentError) {
        throw new Error(`Failed to create cash payment: ${paymentError.message}`)
      }

      return {
        success: true,
        payment,
        paymentId: payment.id
      }

    } catch (error) {
      console.error('Error processing cash payment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Process GCash payment (staff verification)
   * This is called when staff verifies a GCash payment in the POS
   */
  async processGCashPayment(
    orderId: string, 
    amount: number, 
    referenceNumber: string,
    processedBy: string
  ): Promise<CreatePaymentResponse> {
    try {
      // Wait for Supabase client to be initialized
      if (!supabase) {
        await this.initSupabase()
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      console.log('💳 Processing GCash payment verification...')
      console.log('Order ID:', orderId)
      console.log('Reference Number:', referenceNumber)
      console.log('Amount:', amount)

      // Get GCash payment method
      const { data: gcashMethod, error: methodError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('type', 'gcash')
        .eq('is_active', true)
        .single()

      if (methodError) {
        console.error('❌ GCash payment method not found:', methodError)
        throw new Error(`GCash payment method not found: ${methodError.message}`)
      }

      console.log('✅ Found GCash payment method:', gcashMethod.id)

      // Calculate processing fee (usually 0 for GCash P2P)
      const processingFee = amount * (gcashMethod.processing_fee || 0)

      // Create payment record
      const paymentData = {
        order_id: orderId,
        payment_method_id: gcashMethod.id,
        amount,
        reference_number: referenceNumber,
        status: 'completed', // GCash payment is completed after verification
        processing_fee: processingFee,
        notes: `GCash payment verified by staff. Reference: ${referenceNumber}`,
        processed_by: processedBy,
        completed_at: getManilaTimestamp(),
        created_at: getManilaTimestamp()
      }

      console.log('📝 Creating payment record...')

      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert(paymentData)
        .select(`
          *,
          payment_method:payment_methods(*)
        `)
        .single()

      if (paymentError) {
        console.error('❌ Failed to create payment:', paymentError)
        throw new Error(`Failed to create GCash payment: ${paymentError.message}`)
      }

      console.log('✅ Payment record created:', payment.id)

      // Create payment transaction record for audit trail
      const transactionData = {
        order_id: orderId,
        transaction_id: referenceNumber,
        payment_method: 'gcash',
        payment_gateway: 'GCash',
        amount,
        currency: 'PHP',
        processing_fee: processingFee,
        status: 'completed',
        reference_number: referenceNumber,
        gateway_response: {
          verified_by: processedBy,
          verified_at: getManilaTimestamp(),
          verification_method: 'manual'
        },
        created_at: getManilaTimestamp()
      }

      console.log('📝 Creating transaction record...')

      const { error: transactionError } = await supabase
        .from('payment_transactions')
        .insert(transactionData)

      if (transactionError) {
        console.warn('⚠️ Failed to create transaction record:', transactionError)
        // Non-critical, continue
      } else {
        console.log('✅ Transaction record created')
      }

      return {
        success: true,
        payment,
        paymentId: payment.id
      }

    } catch (error) {
      console.error('❌ Error processing GCash payment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Verify GCash reference number format
   */
  verifyGCashReference(referenceNumber: string): boolean {
    // GCash reference numbers are typically 13 digits
    const gcashPattern = /^\d{13}$/
    return gcashPattern.test(referenceNumber.trim())
  }

  /**
   * Get gateway name based on payment method
   */
  private getGatewayName(paymentMethod: string): string {
    switch (paymentMethod) {
      case 'gcash':
        return 'GCash'
      case 'paymaya':
        return 'PayMaya'
      case 'card':
        return 'Stripe'
      case 'cash':
        return 'Cash'
      default:
        return 'Unknown'
    }
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return !!supabase
  }
}

export default PaymentService