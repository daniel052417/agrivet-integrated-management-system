import { PaymentMethod, PaymentTransaction, Payment } from '../types'

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
  private supabase: any = null

  constructor(config: PaymentServiceConfig) {
    this.config = config
    this.initSupabase()
  }

  private async initSupabase() {
    try {
      if (!this.config.supabaseUrl || !this.config.supabaseAnonKey || 
          this.config.supabaseUrl === 'https://your-project-id.supabase.co' ||
          this.config.supabaseAnonKey === 'your-anon-key-here') {
        console.warn('⚠️ Supabase configuration missing for PaymentService')
        this.supabase = null
        return
      }

      const { createClient } = await import('@supabase/supabase-js')
      this.supabase = createClient(this.config.supabaseUrl, this.config.supabaseAnonKey)
      console.log('✅ PaymentService Supabase client initialized')
    } catch (error) {
      console.error('Failed to initialize PaymentService Supabase client:', error)
      this.supabase = null
    }
  }

  /**
   * Get all available payment methods
   */
  async getPaymentMethods(): Promise<{ success: boolean; methods?: PaymentMethod[]; error?: string }> {
    try {
      if (!this.supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data: methods, error } = await this.supabase
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
      if (!this.supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { orderId, paymentMethodId, amount, referenceNumber, notes, processedBy } = request

      // Get payment method details to calculate processing fee
      const { data: paymentMethod, error: methodError } = await this.supabase
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
        created_at: new Date().toISOString()
      }

      const { data: payment, error: paymentError } = await this.supabase
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
      if (!this.supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { orderId, paymentMethod, amount, referenceNumber, gatewayResponse, processedBy } = request

      // Find payment method by type
      const { data: paymentMethodData, error: methodError } = await this.supabase
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
        created_at: new Date().toISOString()
      }

      const { data: transaction, error: transactionError } = await this.supabase
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
      if (!this.supabase) {
        throw new Error('Supabase client not initialized')
      }

      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      }

      if (gatewayStatus) {
        updateData.gateway_status = gatewayStatus
      }

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }

      const { error } = await this.supabase
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
      if (!this.supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data: payment, error } = await this.supabase
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
      if (!this.supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data: transactions, error } = await this.supabase
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
   * Simulate payment processing (for demo/testing)
   */
  async simulatePayment(orderId: string, paymentMethod: string, amount: number): Promise<CreatePaymentResponse> {
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Simulate success/failure (90% success rate)
      const isSuccess = Math.random() > 0.1

      if (!isSuccess) {
        throw new Error('Payment processing failed. Please try again.')
      }

      // Create mock payment data
      const mockPayment: Payment = {
        id: `payment-${Date.now()}`,
        order_id: orderId,
        payment_method_id: `method-${paymentMethod}`,
        amount,
        reference_number: `REF-${Date.now()}`,
        status: 'completed',
        payment_date: new Date().toISOString(),
        processing_fee: amount * 0.02, // 2% processing fee
        notes: 'Simulated payment',
        processed_by: 'system',
        created_at: new Date().toISOString(),
        sales_transaction_id: null
      }

      return {
        success: true,
        payment: mockPayment,
        paymentId: mockPayment.id
      }

    } catch (error) {
      console.error('Error simulating payment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
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
    return !!this.supabase
  }
}

export default PaymentService
