import React, { useState, useEffect } from 'react';
import { Printer, Download, Mail, MessageSquare } from 'lucide-react';
import { CartItem, Customer, POSTransaction, Payment } from '../../types/pos';
import { settingsService } from '../../lib/settingsService';

interface ReceiptGeneratorProps {
  transaction: POSTransaction;
  items: CartItem[];
  customer?: Customer | null;
  payments: Payment[];
  onPrint?: () => void;
  onDownload?: () => void;
  onEmail?: () => void;
  onSMS?: () => void;
}

const ReceiptGenerator: React.FC<ReceiptGeneratorProps> = ({
  transaction,
  items,
  customer,
  payments,
  onPrint,
  onDownload,
  onEmail,
  onSMS
}) => {
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [showLogoOnReceipt, setShowLogoOnReceipt] = useState(true);
  const [receiptHeader, setReceiptHeader] = useState('Thank you for your purchase!');
  const [receiptFooter, setReceiptFooter] = useState('Visit us again soon!');
  const [companyName, setCompanyName] = useState('AGRIVET STORE');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await settingsService.getAllSettings();
        const general = settings.general || {};
        
        setCompanyLogo(general.companyLogo || settings.company_logo || null);
        setShowLogoOnReceipt(general.showLogoOnReceipt ?? settings.show_logo_on_receipt ?? true);
        setReceiptHeader(general.receiptHeader || settings.receipt_header || 'Thank you for your purchase!');
        setReceiptFooter(general.receiptFooter || settings.receipt_footer || 'Visit us again soon!');
        setCompanyName(general.companyName || settings.company_name || 'AGRIVET STORE');
      } catch (error) {
        console.error('Error loading receipt settings:', error);
      }
    };

    loadSettings();
  }, []);
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-PH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodDisplay = (payment: Payment) => {
    if (payment.payment_method === 'digital' && payment.payment_type) {
      return `${payment.payment_type.toUpperCase()}`;
    }
    return payment.payment_method.toUpperCase();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      {/* Receipt Header */}
      <div className="text-center border-b border-gray-200 pb-4 mb-4">
        {/* Company Logo */}
        {showLogoOnReceipt && companyLogo && (
          <div className="mb-3">
            <img 
              src={companyLogo} 
              alt="Company Logo" 
              className="h-16 mx-auto object-contain"
              onError={(e) => {
                // Hide logo if it fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
        
        <h2 className="text-xl font-bold text-gray-900">{companyName}</h2>
        <p className="text-sm text-gray-600">{receiptHeader}</p>
        <div className="mt-2 text-xs text-gray-500">
          <p>Transaction: {transaction.transaction_number}</p>
          <p>Date: {formatDate(transaction.transaction_date)}</p>
        </div>
      </div>

      {/* Customer Information */}
      {customer && (
        <div className="border-b border-gray-200 pb-4 mb-4">
          <h3 className="font-semibold text-gray-900 mb-2">Customer</h3>
          <div className="text-sm text-gray-700">
            <p>{customer.first_name} {customer.last_name}</p>
            <p>{customer.customer_type} • {customer.customer_code}</p>
            {customer.phone && <p>Phone: {customer.phone}</p>}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="font-semibold text-gray-900 mb-3">Items</h3>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between items-start text-sm">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.product.name}</p>
                <p className="text-gray-600 text-xs">
                  {item.product.sku}
                  {item.weight && ` • ${item.weight} ${item.product.unit_of_measure}`}
                  {!item.weight && ` • ${item.quantity} ${item.product.unit_of_measure}`}
                </p>
                {item.expiryDate && (
                  <p className="text-orange-600 text-xs">Exp: {new Date(item.expiryDate).toLocaleDateString()}</p>
                )}
                {item.batchNumber && (
                  <p className="text-blue-600 text-xs">Batch: {item.batchNumber}</p>
                )}
              </div>
              <div className="text-right ml-4">
                <p className="font-medium">{formatPrice(item.lineTotal)}</p>
                {item.discount > 0 && (
                  <p className="text-red-600 text-xs">-{formatPrice(item.discount)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatPrice(transaction.subtotal)}</span>
          </div>
          {transaction.discount_amount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Discount</span>
              <span>-{formatPrice(transaction.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Tax (12%)</span>
            <span>{formatPrice(transaction.tax_amount)}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg border-t border-gray-200 pt-2">
            <span>Total</span>
            <span>{formatPrice(transaction.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="font-semibold text-gray-900 mb-2">Payment</h3>
        {payments.map((payment, index) => (
          <div key={index} className="flex justify-between items-center text-sm">
            <span className="text-gray-600">{getPaymentMethodDisplay(payment)}</span>
            <span className="font-medium">{formatPrice(payment.amount)}</span>
          </div>
        ))}
        {payments.some(p => p.change_given > 0) && (
          <div className="flex justify-between items-center text-sm mt-2 text-green-600">
            <span>Change</span>
            <span className="font-medium">
              {formatPrice(payments.reduce((sum, p) => sum + p.change_given, 0))}
            </span>
          </div>
        )}
      </div>

      {/* Receipt Footer */}
      <div className="text-center text-xs text-gray-500">
        <p>{receiptFooter}</p>
        <p className="mt-2">Receipt ID: {transaction.id.slice(-8).toUpperCase()}</p>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          onClick={onPrint}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Printer className="w-4 h-4" />
          <span>Print</span>
        </button>
        <button
          onClick={onDownload}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          <Download className="w-4 h-4" />
          <span>Download</span>
        </button>
        {customer?.email && (
          <button
            onClick={onEmail}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Mail className="w-4 h-4" />
            <span>Email</span>
          </button>
        )}
        {customer?.phone && (
          <button
            onClick={onSMS}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <MessageSquare className="w-4 h-4" />
            <span>SMS</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ReceiptGenerator;

