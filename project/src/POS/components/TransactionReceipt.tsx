import React, { useState, useEffect } from 'react';
import { Printer, Download, X } from 'lucide-react';
import TouchButton from './shared/TouchButton';
import { settingsService } from '../../lib/settingsService';

interface ReceiptItem {
  name: string;
  quantity: number;
  unit: string;
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
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  amountReceived: number;
  change: number;
  referenceNumber?: string;
  customer?: {
    name: string;
    phone: string;
    code: string;
  };
  branchName: string;
}

interface TransactionReceiptProps {
  receiptData: ReceiptData;
  onClose: () => void;
}

const TransactionReceipt: React.FC<TransactionReceiptProps> = ({
  receiptData,
  onClose
}) => {
  const [companyName, setCompanyName] = useState('AGRIVET SUPPLY CO.');
  const [receiptFooter, setReceiptFooter] = useState('Thank you for your purchase!');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await settingsService.getAllSettings();
        const general = settings.general || {};
        setCompanyName(general.companyName || settings.company_name || 'AGRIVET SUPPLY CO.');
        setReceiptFooter(general.receiptFooter || settings.receipt_footer || 'Thank you for your purchase!');
      } catch (error) {
        console.error('Error loading receipt settings:', error);
      }
    };
    loadSettings();
  }, []);

  const formatCurrency = (amount: number) => {
    return `₱${amount.toFixed(2)}`;
  };

  const generateReceiptHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${receiptData.receiptNumber}</title>
        <meta charset="UTF-8">
        <style>
          @media print {
            body { margin: 0; padding: 20px; }
            .no-print { display: none !important; }
            @page { margin: 0.5cm; }
          }
          body {
            font-family: 'Courier New', monospace;
            max-width: 300px;
            margin: 0 auto;
            padding: 20px;
            font-size: 12px;
            color: #000;
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .company-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .receipt-info {
            font-size: 10px;
            margin-top: 10px;
            line-height: 1.4;
          }
          .section {
            margin: 15px 0;
          }
          .items {
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 10px 0;
          }
          .item-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            font-size: 11px;
          }
          .item-name {
            flex: 1;
            margin-right: 10px;
          }
          .item-details {
            font-size: 10px;
            color: #666;
            margin-left: 0;
            margin-top: 2px;
          }
          .totals {
            margin-top: 10px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
            font-size: 12px;
          }
          .total-label {
            font-weight: bold;
          }
          .payment-info {
            border-top: 1px dashed #000;
            padding-top: 10px;
            margin-top: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 10px;
            border-top: 2px dashed #000;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">${companyName}</div>
          <div style="font-size: 10px;">${receiptData.branchName}</div>
          <div class="receipt-info">
            <div>Receipt #: ${receiptData.receiptNumber}</div>
            <div>Date: ${receiptData.date}</div>
            <div>Time: ${receiptData.time}</div>
            <div>Cashier: ${receiptData.cashier}</div>
          </div>
        </div>
        
        ${receiptData.customer ? `
        <div class="section">
          <div><strong>Customer:</strong> ${receiptData.customer.name}</div>
          <div>Code: ${receiptData.customer.code}</div>
          <div>Phone: ${receiptData.customer.phone}</div>
        </div>
        ` : ''}
        
        <div class="items">
          ${receiptData.items.map(item => `
            <div class="item-row">
              <div class="item-name">
                <div>${item.name}</div>
                <div class="item-details">${item.quantity} ${item.unit} × ${formatCurrency(item.price)}</div>
              </div>
              <div style="font-weight: bold;">${formatCurrency(item.total)}</div>
            </div>
          `).join('')}
        </div>
        
        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${formatCurrency(receiptData.subtotal)}</span>
          </div>
          ${receiptData.discount > 0 ? `
          <div class="total-row">
            <span>Discount:</span>
            <span>-${formatCurrency(receiptData.discount)}</span>
          </div>
          ` : ''}
          ${receiptData.tax > 0 ? `
          <div class="total-row">
            <span>Tax:</span>
            <span>${formatCurrency(receiptData.tax)}</span>
          </div>
          ` : ''}
          <div class="total-row" style="font-size: 14px; font-weight: bold; margin-top: 10px; border-top: 1px solid #000; padding-top: 5px;">
            <span>TOTAL:</span>
            <span>${formatCurrency(receiptData.total)}</span>
          </div>
        </div>
        
        <div class="payment-info">
          <div class="total-row">
            <span>Payment Method:</span>
            <span style="text-transform: uppercase;">${receiptData.paymentMethod}</span>
          </div>
          ${receiptData.paymentMethod === 'cash' ? `
          <div class="total-row">
            <span>Amount Received:</span>
            <span>${formatCurrency(receiptData.amountReceived)}</span>
          </div>
          <div class="total-row" style="font-weight: bold;">
            <span>Change:</span>
            <span>${formatCurrency(receiptData.change)}</span>
          </div>
          ` : ''}
          ${receiptData.referenceNumber ? `
          <div class="total-row">
            <span>Reference #:</span>
            <span>${receiptData.referenceNumber}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="footer">
          <div>${receiptFooter}</div>
          <div style="margin-top: 5px;">Please keep this receipt</div>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const receiptHTML = generateReceiptHTML();
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleDownload = () => {
    const receiptHTML = generateReceiptHTML();
    const blob = new Blob([receiptHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receiptData.receiptNumber}-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="receipt-container">
      <div className="bg-white rounded-lg p-6 max-w-md mx-auto" id="receipt-content">
        {/* Receipt Header */}
        <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{companyName}</h2>
          <p className="text-sm text-gray-600">{receiptData.branchName}</p>
          <div className="mt-4 space-y-1 text-xs text-gray-600">
            <p>Receipt #: {receiptData.receiptNumber}</p>
            <p>Date: {receiptData.date}</p>
            <p>Time: {receiptData.time}</p>
            <p>Cashier: {receiptData.cashier}</p>
          </div>
        </div>

        {/* Customer Info */}
        {receiptData.customer && (
          <div className="border-b border-gray-200 pb-3 mb-4">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Customer Information</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>Name:</strong> {receiptData.customer.name}</p>
              <p><strong>Code:</strong> {receiptData.customer.code}</p>
              <p><strong>Phone:</strong> {receiptData.customer.phone}</p>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">Items Purchased</h3>
          <div className="space-y-3 border-t border-b border-gray-200 py-3">
            {receiptData.items.map((item, index) => (
              <div key={index} className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.quantity} {item.unit} × {formatCurrency(item.price)}
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
        <div className="border-t border-gray-200 pt-4 space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>{formatCurrency(receiptData.subtotal)}</span>
          </div>
          {receiptData.discount > 0 && (
            <div className="flex justify-between text-sm text-red-600">
              <span>Discount:</span>
              <span>-{formatCurrency(receiptData.discount)}</span>
            </div>
          )}
          {receiptData.tax > 0 && (
            <div className="flex justify-between text-sm">
              <span>Tax:</span>
              <span>{formatCurrency(receiptData.tax)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold text-emerald-600 border-t border-gray-200 pt-2 mt-2">
            <span>TOTAL:</span>
            <span>{formatCurrency(receiptData.total)}</span>
          </div>
        </div>

        {/* Payment Info */}
        <div className="border-t border-gray-200 pt-4 space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span>Payment Method:</span>
            <span className="uppercase font-medium">{receiptData.paymentMethod}</span>
          </div>
          {receiptData.paymentMethod === 'cash' && (
            <>
              <div className="flex justify-between text-sm">
                <span>Amount Received:</span>
                <span>{formatCurrency(receiptData.amountReceived)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-emerald-600">
                <span>Change:</span>
                <span>{formatCurrency(receiptData.change)}</span>
              </div>
            </>
          )}
          {receiptData.referenceNumber && (
            <div className="flex justify-between text-sm">
              <span>Reference #:</span>
              <span className="font-mono">{receiptData.referenceNumber}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 pt-4 border-t-2 border-dashed border-gray-300">
          <p className="text-xs text-gray-500 mb-2">{receiptFooter}</p>
          <p className="text-xs text-gray-500">Please keep this receipt</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 mt-6 no-print">
        <TouchButton
          onClick={handlePrint}
          variant="primary"
          icon={Printer}
          className="flex-1"
        >
          Print Receipt
        </TouchButton>
        <TouchButton
          onClick={handleDownload}
          variant="outline"
          icon={Download}
          className="flex-1"
        >
          Download
        </TouchButton>
      </div>

      <div className="mt-4 no-print">
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

export default TransactionReceipt;

