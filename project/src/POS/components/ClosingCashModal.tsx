import React, { useState, useEffect } from 'react';
import { X, DollarSign, Clock, TrendingUp, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface SessionSummary {
  sessionNumber: string;
  cashierName: string;
  startTime: string;
  startingCash: number;
  totalSales: number;
  totalTransactions: number;
  duration: string;
  expectedCash: number;
}

interface ClosingCashModalProps {
  isOpen: boolean;
  sessionSummary: SessionSummary;
  onSubmit: (endingCash: number) => Promise<void>;
  onCancel?: () => void;
  isClosable?: boolean;
}

export default function ClosingCashModal({
  isOpen,
  sessionSummary,
  onSubmit,
  onCancel,
  isClosable = true
}: ClosingCashModalProps) {
  const [endingCash, setEndingCash] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [variance, setVariance] = useState<number>(0);
  const [showSummary, setShowSummary] = useState(false);

  // Calculate variance when ending cash changes
  useEffect(() => {
    const amount = parseFloat(endingCash);
    if (!isNaN(amount)) {
      const calculatedVariance = amount - sessionSummary.expectedCash;
      setVariance(calculatedVariance);
    } else {
      setVariance(0);
    }
  }, [endingCash, sessionSummary.expectedCash]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amount = parseFloat(endingCash);

    // Validation
    if (isNaN(amount)) {
      setError('Please enter a valid amount');
      return;
    }

    if (amount < 0) {
      setError('Ending cash cannot be negative');
      return;
    }

    // Show confirmation if there's a significant variance
    if (Math.abs(variance) > 100) {
      const confirmed = window.confirm(
        `There is a cash variance of ₱${Math.abs(variance).toFixed(2)} ${
          variance > 0 ? 'over' : 'short'
        }. Do you want to proceed with closing the session?`
      );
      if (!confirmed) return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(amount);
      setShowSummary(true);
    } catch (err: any) {
      setError(err.message || 'Failed to close session');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isClosable && onCancel && !isSubmitting) {
      onCancel();
    }
  };

  if (!isOpen) return null;

  // Success summary screen
  if (showSummary) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Session Closed Successfully
            </h2>
            <p className="text-gray-600 mb-6">
              Your shift has ended. Thank you for your work!
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-gray-600">Session:</span>
                <span className="font-semibold">{sessionSummary.sessionNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-semibold">{sessionSummary.duration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Sales:</span>
                <span className="font-semibold">₱{sessionSummary.totalSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transactions:</span>
                <span className="font-semibold">{sessionSummary.totalTransactions}</span>
              </div>
              {variance !== 0 && (
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-600">Cash Variance:</span>
                  <span className={`font-semibold ${
                    variance > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {variance > 0 ? '+' : ''}₱{variance.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header with Close Icon */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Close Session</h2>
                <p className="text-green-100 mt-1">Please count your cash drawer</p>
              </div>
            </div>
            {isClosable && (
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="text-white hover:bg-white/20 transition-all duration-200 rounded-lg p-2"
                title="Close without saving"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Session Info Cards */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Session Duration */}
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="bg-green-500 rounded-lg p-2">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-green-600 font-medium">Session Duration</p>
                  <p className="text-lg font-bold text-green-900">{sessionSummary.duration}</p>
                </div>
              </div>
            </div>

            {/* Total Sales */}
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
              <div className="flex items-center space-x-3">
                <div className="bg-emerald-500 rounded-lg p-2">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-emerald-600 font-medium">Total Sales</p>
                  <p className="text-lg font-bold text-emerald-900">₱{sessionSummary.totalSales.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Session Details */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-gray-800 mb-3">Session Details</h3>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Session Number</p>
                <p className="font-semibold text-gray-900">{sessionSummary.sessionNumber}</p>
              </div>
              <div>
                <p className="text-gray-500">Cashier</p>
                <p className="font-semibold text-gray-900">{sessionSummary.cashierName}</p>
              </div>
              <div>
                <p className="text-gray-500">Start Time</p>
                <p className="font-semibold text-gray-900">
                  {new Date(sessionSummary.startTime).toLocaleString('en-PH', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Transactions</p>
                <p className="font-semibold text-gray-900">{sessionSummary.totalTransactions}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200 grid grid-cols-2 gap-3">
              <div>
                <p className="text-gray-500 text-sm">Starting Cash</p>
                <p className="font-bold text-gray-900 text-lg">₱{sessionSummary.startingCash.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Expected Cash</p>
                <p className="font-bold text-green-600 text-lg">₱{sessionSummary.expectedCash.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {/* Ending Cash Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="endingCash" className="text-sm font-medium text-gray-700 block">
                Ending Cash Amount (₱) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-lg font-semibold">₱</span>
                </div>
                <input
                  id="endingCash"
                  type="number"
                  step="0.01"
                  min="0"
                  value={endingCash}
                  onChange={(e) => setEndingCash(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 bg-white text-gray-700 text-xl font-bold placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="0.00"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Variance Display */}
            {endingCash && !isNaN(parseFloat(endingCash)) && (
              <div className={`p-4 rounded-xl border-2 ${
                variance === 0
                  ? 'bg-green-50 border-green-300'
                  : Math.abs(variance) <= 10
                  ? 'bg-yellow-50 border-yellow-300'
                  : 'bg-red-50 border-red-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">Cash Variance:</span>
                  <span className={`text-xl font-bold ${
                    variance === 0
                      ? 'text-green-600'
                      : variance > 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {variance > 0 ? '+' : ''}₱{variance.toFixed(2)}
                  </span>
                </div>
                {variance !== 0 && (
                  <p className="text-xs text-gray-600 mt-2">
                    {variance > 0 ? 'Cash over expected amount' : 'Cash short of expected amount'}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              {isClosable && (
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || !endingCash}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:ring-offset-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Closing Session...</span>
                  </>
                ) : (
                  <span>Close Session & Logout</span>
                )}
              </button>
            </div>
          </form>

          {/* Help Text */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs text-green-800">
              <span className="font-semibold">💡 Tip:</span> Count all cash in your drawer including the starting cash. 
              The system will automatically calculate the variance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}