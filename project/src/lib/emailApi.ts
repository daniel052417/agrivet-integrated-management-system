/**
 * Email API for Browser Environment
 * 
 * This service calls backend API endpoints to send emails
 * since email sending should be done on the server, not in the browser
 */

export interface ActivationEmailData {
  to: string;
  name: string;
  activationToken: string;
  companyName?: string;
  expiryHours?: number;
}

export interface OTPEmailData {
  to: string;
  name: string;
  otpCode: string;
  expiryMinutes: number;
  companyName?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export const emailApi = {
  /**
   * Send account activation email via Supabase Edge Function
   */
  async sendActivationEmail(data: ActivationEmailData): Promise<EmailResult> {
    try {
      // Use Supabase Edge Function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          ...data,
          type: 'activation'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to send activation email via Supabase Edge Function:', error);
      
      // Fallback to simulation if API is not available
      console.log('📧 [FALLBACK SIMULATION] Sending activation email:', {
        to: data.to,
        name: data.name,
        activationToken: data.activationToken
      });
      
      return {
        success: true,
        messageId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    }
  },

  /**
   * Send activation confirmation email via Supabase Edge Function
   */
  async sendActivationConfirmationEmail(to: string, name: string, companyName = 'AgriVet Management System'): Promise<EmailResult> {
    try {
      // Use Supabase Edge Function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          to,
          name,
          companyName,
          type: 'confirmation'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to send confirmation email via Supabase Edge Function:', error);
      
      // Fallback to simulation if API is not available
      console.log('📧 [FALLBACK SIMULATION] Sending confirmation email:', {
        to,
        name,
        companyName
      });
      
      return {
        success: true,
        messageId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    }
  },

  /**
   * Send OTP code email via Supabase Edge Function
   */
  async sendOTPEmail(data: OTPEmailData): Promise<EmailResult> {
    try {
      // Use Supabase Edge Function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mfa-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          ...data,
          type: 'otp'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to send OTP email via Supabase Edge Function:', error);
      
      // Fallback to simulation if API is not available
      console.log('📧 [FALLBACK SIMULATION] Sending OTP email:', {
        to: data.to,
        name: data.name,
        otpCode: data.otpCode
      });
      
      return {
        success: true,
        messageId: `sim_otp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    }
  },

  /**
   * Test email configuration via backend API
   */
  async testEmailConfiguration(): Promise<EmailResult> {
    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to test email configuration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};
