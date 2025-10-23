import React, { useState } from 'react';
import { X, DollarSign, AlertCircle } from 'lucide-react';

interface OpeningCashModalProps {
  isOpen: boolean;
  cashierName: string;
  onSubmit: (amount: number) => Promise<void>;
  onClose?: () => void;
  isClosable?: boolean; // Whether the modal can be closed without submitting
}

export default function OpeningCashModal({
  isOpen,
  cashierName,
  onSubmit,
  onClose,
  isClosable = false
}: OpeningCashModalProps) {
  const [openingCash, setOpeningCash] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amount = parseFloat(openingCash);

    // Validation
    if (isNaN(amount)) {
      setError('Please enter a valid amount');
      return;
    }

    if (amount < 0) {
      setError('Opening cash cannot be negative');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(amount);
      // Reset form after successful submission
      setOpeningCash('');
    } catch (err: any) {
      setError(err.message || 'Failed to set opening cash');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isClosable && onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 relative overflow-hidden">
        {/* Decorative gradient background */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-100 to-emerald-200 opacity-30 rounded-full -translate-y-20 translate-x-20"></div>
        
        {/* Close button - only show if closable */}
        {isClosable && onClose && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        {/* Modal Content */}
        <div className="relative z-10 p-8">
          {/* Icon and Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 text-center">
              Welcome, {cashierName}!
            </h2>
            <p className="text-gray-600 text-center mt-2">
              Please enter your opening cash amount to start your shift
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="openingCash" className="text-sm font-medium text-gray-700 block">
                Opening Cash Amount (₱)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-lg">₱</span>
                </div>
                <input
                  id="openingCash"
                  type="number"
                  step="0.01"
                  min="0"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 bg-gray-50/50 hover:bg-white text-gray-700 text-lg font-semibold placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="0.00"
                  required
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This is the cash you have in your drawer at the start of your shift
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !openingCash}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:ring-offset-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Starting Shift...</span>
                </>
              ) : (
                <span>Start Shift</span>
              )}
            </button>
          </form>

          {/* Info Note */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800 text-center">
              <span className="font-semibold">Note:</span> You'll need to reconcile this amount at the end of your shift
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}