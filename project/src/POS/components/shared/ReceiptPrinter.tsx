import React from 'react';
import { Printer, Download } from 'lucide-react';
import TouchButton from './TouchButton';

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface ReceiptData {
  receiptNumber: string;
  date: string;
  time: string;
  cashier: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  amountReceived: number;
  change: number;
  customer?: {
    name: string;
    phone: string;
  };
}

interface ReceiptPrinterProps {
  receiptData: ReceiptData;
  onPrint: () => void;
  onDownload: () => void;
  onClose: () => void;
}

const ReceiptPrinter: React.FC<ReceiptPrinterProps> = ({
  receiptData,
  onPrint,
  onDownload,
  onClose,
}) => {
  const formatCurrency = (amount: number) => {
    return `₱${amount.toFixed(2)}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
      {/* Receipt Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">TIONGSON AGRIVET</h2>
        <p className="text-sm text-gray-600">Point of Sale System</p>
        <div className="mt-4 space-y-1 text-sm">
          <p>Receipt #: {receiptData.receiptNumber}</p>
          <p>Date: {receiptData.date}</p>
          <p>Time: {receiptData.time}</p>
          <p>Cashier: {receiptData.cashier}</p>
        </div>
      </div>

      {/* Customer Info */}
      {receiptData.customer && (
        <div className="border-t border-b border-gray-200 py-3 mb-4">
          <h3 className="font-semibold text-gray-900 mb-2">Customer Information</h3>
          <p className="text-sm text-gray-600">Name: {receiptData.customer.name}</p>
          <p className="text-sm text-gray-600">Phone: {receiptData.customer.phone}</p>
        </div>
      )}

      {/* Items */}
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 mb-3">Items Purchased</h3>
        <div className="space-y-2">
          {receiptData.items.map((item, index) => (
            <div key={index} className="flex justify-between items-center py-1">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-500">
                  {item.quantity} x {formatCurrency(item.price)}
                </p>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrency(item.total)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="border-t border-gray-200 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal:</span>
          <span>{formatCurrency(receiptData.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>VAT (12%):</span>
          <span>{formatCurrency(receiptData.tax)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold text-green-600 border-t border-gray-200 pt-2">
          <span>Total:</span>
          <span>{formatCurrency(receiptData.total)}</span>
        </div>
      </div>

      {/* Payment Info */}
      <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Payment Method:</span>
          <span className="capitalize">{receiptData.paymentMethod}</span>
        </div>
        {receiptData.paymentMethod === 'cash' && (
          <>
            <div className="flex justify-between text-sm">
              <span>Amount Received:</span>
              <span>{formatCurrency(receiptData.amountReceived)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span>Change:</span>
              <span>{formatCurrency(receiptData.change)}</span>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-center mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-2">Thank you for your business!</p>
        <p className="text-xs text-gray-500">Please keep this receipt for your records</p>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 mt-6">
        <TouchButton
          onClick={onPrint}
          variant="primary"
          icon={Printer}
          className="flex-1"
        >
          Print Receipt
        </TouchButton>
        <TouchButton
          onClick={onDownload}
          variant="outline"
          icon={Download}
          className="flex-1"
        >
          Download PDF
        </TouchButton>
      </div>

      <div className="mt-4">
        <TouchButton
          onClick={onClose}
          variant="outline"
          className="w-full"
        >
          Close
        </TouchButton>
      </div>
    </div>
  );
};

export default ReceiptPrinter;


















