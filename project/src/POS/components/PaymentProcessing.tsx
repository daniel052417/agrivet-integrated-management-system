import React, { useState } from 'react';
import { ArrowLeft, CreditCard, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { CartItem, Customer, POSSession, PaymentFormData } from '../../types/pos';

interface PaymentProcessingProps {
  cart: CartItem[];
  selectedCustomer?: Customer | null;
  subtotal: number;
  tax: number;
  total: number;
  session: POSSession;
  onTransactionComplete: () => void;
  onBack: () => void;
}

const PaymentProcessing: React.FC<PaymentProcessingProps> = ({
  cart,
  selectedCustomer,
  subtotal,
  tax,
  total,
  session,
  onTransactionComplete,
  onBack
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'digital'>('cash');
  const [digitalPaymentType, setDigitalPaymentType] = useState<string>('');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [transactionComplete, setTransactionComplete] = useState(false);
  const [transactionNumber, setTransactionNumber] = useState<string>('');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price);
  };

  const calculateChange = () => {
    if (paymentMethod === 'cash' && amountPaid >= total) {
      return amountPaid - total;
    }
    return 0;
  };

  const isPaymentValid = () => {
    if (paymentMethod === 'cash') {
      return amountPaid >= total;
    } else if (paymentMethod === 'digital') {
      return digitalPaymentType && amountPaid >= total;
    }
    return false;
  };

  const handlePaymentComplete = async () => {
    if (!isPaymentValid()) {
      setError('Please ensure payment amount is sufficient');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Generate transaction number
      const transactionNum = await generateTransactionNumber();
      setTransactionNumber(transactionNum);

      // Create transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from('pos_transactions')
        .insert({
          transaction_number: transactionNum,
          pos_session_id: session.id,
          customer_id: selectedCustomer?.id || null,
          cashier_id: session.cashier_id,
          branch_id: session.branch_id,
          transaction_type: 'sale',
          subtotal: subtotal,
          discount_amount: cart.reduce((sum, item) => sum + item.discount, 0),
          tax_amount: tax,
          total_amount: total,
          payment_status: 'completed',
          status: 'active'
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Create transaction items
      const transactionItems = cart.map(item => ({
        transaction_id: transaction.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_sku: item.product.sku,
        quantity: item.quantity,
        unit_of_measure: item.product.unit_of_measure,
        unit_price: item.unitPrice,
        discount_amount: item.discount,
        line_total: item.lineTotal,
        weight_kg: item.weight || null,
        expiry_date: item.expiryDate || null,
        batch_number: item.batchNumber || null
      }));

      const { error: itemsError } = await supabase
        .from('pos_transaction_items')
        .insert(transactionItems);

      if (itemsError) throw itemsError;

      // Create payment record
      const paymentData = {
        transaction_id: transaction.id,
        payment_method: paymentMethod,
        payment_type: paymentMethod === 'digital' ? digitalPaymentType : null,
        amount: total,
        change_given: calculateChange(),
        reference_number: paymentMethod === 'digital' ? referenceNumber : null,
        payment_status: 'completed'
      };

      const { error: paymentError } = await supabase
        .from('pos_payments')
        .insert(paymentData);

      if (paymentError) throw paymentError;

      // Update product stock quantities
      for (const item of cart) {
        const newStock = item.product.stock_quantity - item.quantity;
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', item.product.id);

        if (stockError) throw stockError;
      }

      // Update session totals
      const { error: sessionError } = await supabase
        .from('pos_sessions')
        .update({
          total_sales: session.total_sales + total,
          total_transactions: session.total_transactions + 1
        })
        .eq('id', session.id);

      if (sessionError) throw sessionError;

      setTransactionComplete(true);

    } catch (error: any) {
      console.error('Payment processing error:', error);
      setError('Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateTransactionNumber = async (): Promise<string> => {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const { count } = await supabase
      .from('pos_transactions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00`);
    
    return `T${today}${String((count || 0) + 1).padStart(4, '0')}`;
  };

  const handlePrintReceipt = () => {
    // TODO: Implement receipt printing
    console.log('Printing receipt for transaction:', transactionNumber);
  };

  const handleNewTransaction = () => {
    onTransactionComplete();
  };

  if (transactionComplete) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-gray-600 mb-6">Transaction completed successfully</p>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 w-full max-w-md">
          <h3 className="font-semibold text-gray-900 mb-4">Transaction Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction #</span>
              <span className="font-medium">{transactionNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-medium capitalize">{paymentMethod}</span>
            </div>
            {paymentMethod === 'digital' && digitalPaymentType && (
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Type</span>
                <span className="font-medium capitalize">{digitalPaymentType}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount</span>
              <span className="font-medium">{formatPrice(total)}</span>
            </div>
            {paymentMethod === 'cash' && calculateChange() > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Change</span>
                <span className="font-medium text-green-600">{formatPrice(calculateChange())}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handlePrintReceipt}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Print Receipt
          </button>
          <button
            onClick={handleNewTransaction}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            New Transaction
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">Payment Processing</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          {/* Order Summary */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
            
            {selectedCustomer && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  Customer: {selectedCustomer.first_name} {selectedCustomer.last_name}
                </p>
                <p className="text-sm text-blue-700">
                  Type: {selectedCustomer.customer_type}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax (12%)</span>
                <span className="font-medium">{formatPrice(tax)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-green-600">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`p-4 border-2 rounded-lg text-center transition-colors ${
                  paymentMethod === 'cash'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <DollarSign className="w-8 h-8 mx-auto mb-2" />
                <span className="font-medium">Cash</span>
              </button>
              
              <button
                onClick={() => setPaymentMethod('digital')}
                className={`p-4 border-2 rounded-lg text-center transition-colors ${
                  paymentMethod === 'digital'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-8 h-8 mx-auto mb-2" />
                <span className="font-medium">Digital</span>
              </button>
            </div>

            {/* Digital Payment Type Selection */}
            {paymentMethod === 'digital' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Digital Payment Type
                </label>
                <select
                  value={digitalPaymentType}
                  onChange={(e) => setDigitalPaymentType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select payment type</option>
                  <option value="gcash">GCash</option>
                  <option value="paymaya">PayMaya</option>
                  <option value="grab_pay">GrabPay</option>
                  <option value="bpi">BPI</option>
                  <option value="bdo">BDO</option>
                  <option value="metrobank">Metrobank</option>
                </select>
              </div>
            )}

            {/* Amount Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount Paid
              </label>
              <input
                type="number"
                step="0.01"
                min={total}
                value={amountPaid || ''}
                onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                placeholder="0.00"
              />
            </div>

            {/* Reference Number for Digital Payments */}
            {paymentMethod === 'digital' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number (Optional)
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter reference number"
                />
              </div>
            )}

            {/* Change Display */}
            {paymentMethod === 'cash' && amountPaid > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Change</span>
                  <span className={`text-lg font-bold ${
                    calculateChange() >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPrice(calculateChange())}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={onBack}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Back to Cart
            </button>
            <button
              onClick={handlePaymentComplete}
              disabled={!isPaymentValid() || isProcessing}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Complete Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessing;

