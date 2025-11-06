import React, { useState, useEffect, useRef } from 'react';
import { Shield, Mail, Loader2, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { mfaService } from '../../lib/mfaService';

interface MFAVerificationProps {
  userId: string;
  userEmail: string;
  userName: string;
  onVerify: (otp: string) => Promise<void>;
  onCancel?: () => void;
}

const MFAVerification: React.FC<MFAVerificationProps> = ({
  userId,
  userEmail,
  userName,
  onVerify,
  onCancel
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Send OTP on mount
  useEffect(() => {
    sendOTP();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const sendOTP = async () => {
    try {
      setIsResending(true);
      setError(null);
      
      const result = await mfaService.generateAndSendOTP(userId, userEmail, userName);
      
      if (result.success) {
        setOtpSent(true);
        setCountdown(60); // 60 second cooldown for resend
      } else {
        setError(result.error || 'Failed to send OTP code');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP code');
    } finally {
      setIsResending(false);
    }
  };

  const handleInputChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(null);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (newOtp.every(digit => digit !== '') && index === 5) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (/^\d{6}$/.test(pastedData)) {
      const pastedOtp = pastedData.split('');
      setOtp(pastedOtp);
      setError(null);
      
      // Focus last input
      inputRefs.current[5]?.focus();
      
      // Auto-submit
      setTimeout(() => handleVerify(pastedData), 100);
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const otpCodeToVerify = otpCode || otp.join('');
    
    if (otpCodeToVerify.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    try {
      setIsVerifying(true);
      setError(null);
      await onVerify(otpCodeToVerify);
    } catch (err: any) {
      setError(err.message || 'Invalid verification code. Please try again.');
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    await sendOTP();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h2>
            <p className="text-gray-600">
              Enter the 6-digit code sent to
            </p>
            <p className="text-gray-900 font-medium">{userEmail}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {otpSent && !error && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">
                Verification code sent! Please check your email.
              </p>
            </div>
          )}

          {/* OTP Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Enter Verification Code
            </label>
            <div className="flex justify-center space-x-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  disabled={isVerifying}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                  autoFocus={index === 0}
                />
              ))}
            </div>
          </div>

          {/* Verify Button */}
          <button
            onClick={() => handleVerify()}
            disabled={isVerifying || otp.some(d => d === '')}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <span>Verify Code</span>
            )}
          </button>

          {/* Resend OTP */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResend}
              disabled={isResending || countdown > 0}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mx-auto"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : countdown > 0 ? (
                <span>Resend code in {countdown}s</span>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Resend Code</span>
                </>
              )}
            </button>
          </div>

          {/* Cancel Button */}
          {onCancel && (
            <div className="mt-6 text-center">
              <button
                onClick={onCancel}
                disabled={isVerifying}
                className="text-sm text-gray-600 hover:text-gray-700 disabled:text-gray-400"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Help Text */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">Need help?</p>
                <p>
                  The code expires in 5 minutes. Make sure to check your spam folder if you don't see the email.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MFAVerification;




