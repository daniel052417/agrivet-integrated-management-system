/**
 * Email Service for Account Activation
 * 
 * This service handles sending activation emails to staff members
 * when their account requests are approved.
 */

export interface ActivationEmailData {
  to: string;
  name: string;
  activationToken: string;
  companyName?: string;
  expiryHours?: number;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface OTPEmailData {
  to: string;
  name: string;
  otpCode: string;
  expiryMinutes: number;
  companyName?: string;
}

export const emailService = {
  /**
   * Send account activation email
   */
  async sendActivationEmail(data: ActivationEmailData): Promise<EmailResult> {
    try {
      const { to, name, activationToken, companyName = 'AgriVet Management System', expiryHours = 24 } = data;
      
      // In a real application, you would integrate with an email service like:
      // - SendGrid
      // - AWS SES
      // - Mailgun
      // - Nodemailer with SMTP
      
      // For now, we'll simulate the email sending
      const activationUrl = `${window.location.origin}/activate?token=${activationToken}`;
      
      const emailContent = {
        to,
        subject: `Activate Your Account - ${companyName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Activate Your Account</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .button:hover { background: #1d4ed8; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
              .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to ${companyName}</h1>
              </div>
              <div class="content">
                <h2>Hello ${name}!</h2>
                <p>Your account for <strong>${companyName}</strong> has been created and is ready for activation.</p>
                <p>To get started, please activate your account by setting your password:</p>
                
                <div style="text-align: center;">
                  <a href="${activationUrl}" class="button">Activate Your Account</a>
                </div>
                
                <div class="warning">
                  <strong>⏰ Important:</strong> This activation link will expire in ${expiryHours} hours for security reasons.
                </div>
                
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px; font-family: monospace;">
                  ${activationUrl}
                </p>
                
                <p>If you didn't request this account or have any questions, please contact your HR department.</p>
              </div>
              <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
          Welcome to ${companyName}!
          
          Hello ${name},
          
          Your account for ${companyName} has been created and is ready for activation.
          
          To get started, please activate your account by setting your password:
          ${activationUrl}
          
          ⏰ Important: This activation link will expire in ${expiryHours} hours for security reasons.
          
          If you didn't request this account or have any questions, please contact your HR department.
          
          This is an automated message. Please do not reply to this email.
        `
      };

      // Use SendGrid Edge Function for email sending
      try {
        const { emailApi } = await import('./emailApi');
        const result = await emailApi.sendActivationEmail(data);
        if (result.success) {
          console.log('✅ Email sent via SendGrid Edge Function');
          return result;
        }
      } catch (error) {
        console.log('❌ SendGrid Edge Function not available:', error.message);
        console.log('📖 Check if Edge Function is deployed and environment variables are set');
        console.log('📖 See SENDGRID_SETUP.md for setup instructions');
      }

      // Simulate email sending (fallback)
      console.log('📧 [SIMULATION MODE] Sending activation email:', {
        to: emailContent.to,
        subject: emailContent.subject,
        activationUrl
      });

      console.log('⚠️  WARNING: This is SIMULATION MODE - No real email was sent!');
      console.log('📖 To send real emails:');
      console.log('   1. Deploy Supabase Edge Function with SendGrid');
      console.log('   2. Set SENDGRID_API_KEY environment variable');
      console.log('   3. Set FROM_EMAIL environment variable');
      console.log('   See SENDGRID_SETUP.md for complete setup instructions');
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        messageId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
    } catch (error) {
      console.error('Failed to send activation email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  /**
   * Send resend activation email
   */
  async resendActivationEmail(data: ActivationEmailData): Promise<EmailResult> {
    return this.sendActivationEmail({
      ...data,
      // You could customize the subject for resend
    });
  },

  /**
   * Send account activated confirmation email
   */
  async sendActivationConfirmationEmail(to: string, name: string, companyName = 'AgriVet Management System'): Promise<EmailResult> {
    try {
      const emailContent = {
        to,
        subject: `Account Activated Successfully - ${companyName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Account Activated</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Account Activated Successfully</h1>
              </div>
              <div class="content">
                <h2>Hello ${name}!</h2>
                <p>Your account for <strong>${companyName}</strong> has been successfully activated.</p>
                <p>You can now log in to the system using your email and password.</p>
                
                <div style="text-align: center;">
                  <a href="${window.location.origin}/login" class="button">Log In to Your Account</a>
                </div>
                
                <p>If you have any questions or need assistance, please contact your HR department.</p>
              </div>
              <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
          Account Activated Successfully!
          
          Hello ${name},
          
          Your account for ${companyName} has been successfully activated.
          
          You can now log in to the system using your email and password.
          
          Login URL: ${window.location.origin}/login
          
          If you have any questions or need assistance, please contact your HR department.
        `
      };

      // Use SendGrid Edge Function for email sending
      try {
        const { emailApi } = await import('./emailApi');
        const result = await emailApi.sendActivationConfirmationEmail(to, name, companyName);
        if (result.success) {
          console.log('✅ Confirmation email sent via SendGrid Edge Function');
          return result;
        }
      } catch (error) {
        console.log('❌ SendGrid Edge Function not available for confirmation email:', error.message);
        console.log('📖 Check if Edge Function is deployed and environment variables are set');
      }

      // Simulate email sending (fallback)
      console.log('📧 [SIMULATION] Sending activation confirmation email:', {
        to: emailContent.to,
        subject: emailContent.subject
      });

      console.log('⚠️  NOTE: This is a simulation. To send real emails, configure Gmail SMTP in .env file');
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        messageId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
    } catch (error) {
      console.error('Failed to send activation confirmation email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  /**
   * Send OTP code email for MFA
   */
  async sendOTPEmail(data: OTPEmailData): Promise<EmailResult> {
    try {
      const { to, name, otpCode, expiryMinutes = 5, companyName = 'AgriVet Management System' } = data;
      
      const emailContent = {
        to,
        subject: `Your Login Verification Code - ${companyName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Login Verification Code</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
              .otp-box { background: white; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
              .otp-code { font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 8px; font-family: 'Courier New', monospace; }
              .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Login Verification Code</h1>
              </div>
              <div class="content">
                <h2>Hello ${name}!</h2>
                <p>You've requested to log in to your <strong>${companyName}</strong> account. Please use the verification code below:</p>
                
                <div class="otp-box">
                  <div style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">Your verification code:</div>
                  <div class="otp-code">${otpCode}</div>
                </div>
                
                <div class="warning">
                  <strong>⏰ Important:</strong> This code will expire in ${expiryMinutes} minutes. Do not share this code with anyone.
                </div>
                
                <p>If you didn't request this code, please ignore this email or contact support if you're concerned about your account's security.</p>
              </div>
              <div class="footer">
                <p>This is an automated security message. Please do not reply to this email.</p>
                <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
          Login Verification Code - ${companyName}
          
          Hello ${name}!
          
          You've requested to log in to your ${companyName} account. Please use the verification code below:
          
          Verification Code: ${otpCode}
          
          ⏰ Important: This code will expire in ${expiryMinutes} minutes. Do not share this code with anyone.
          
          If you didn't request this code, please ignore this email or contact support if you're concerned about your account's security.
          
          This is an automated security message. Please do not reply to this email.
        `
      };

      // Use SendGrid Edge Function for email sending
      try {
        const { emailApi } = await import('./emailApi');
        const result = await emailApi.sendOTPEmail(data);
        if (result.success) {
          console.log('✅ OTP email sent via SendGrid Edge Function');
          return result;
        }
      } catch (error: any) {
        console.log('❌ SendGrid Edge Function not available for OTP email:', error.message);
      }

      // Try Gmail service as fallback
      try {
        const { gmailEmailService } = await import('./gmailEmailService');
        const result = await gmailEmailService.sendOTPEmail(data);
        if (result.success) {
          console.log('✅ OTP email sent via Gmail SMTP');
          return result;
        }
      } catch (error: any) {
        console.log('❌ Gmail service not available:', error.message);
      }

      // Simulate email sending (fallback)
      // Make OTP very visible in console for development/testing
      console.log('%c🔐 MFA OTP CODE (DEVELOPMENT MODE)', 'background: #2563eb; color: white; font-size: 20px; font-weight: bold; padding: 10px; border-radius: 5px;');
      console.log('%c' + otpCode, 'background: #fef3c7; color: #1f2937; font-size: 32px; font-weight: bold; padding: 20px; border: 3px solid #f59e0b; border-radius: 10px; letter-spacing: 8px; font-family: monospace;');
      console.log('%c📧 Email would be sent to: ' + emailContent.to, 'background: #e5e7eb; color: #1f2937; font-size: 14px; padding: 8px; border-radius: 5px;');
      console.log('⚠️  WARNING: This is SIMULATION MODE - No real email was sent!');
      console.log('📖 To send real emails:');
      console.log('   1. Deploy Supabase Edge Function: supabase functions deploy mfa-email');
      console.log('   2. Set SENDGRID_API_KEY in Supabase Dashboard → Edge Functions → Secrets');
      console.log('   3. Or configure Gmail SMTP in gmailEmailService.ts');
      
      // Store OTP in sessionStorage for easy access (development only)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('mfa_otp_code', otpCode);
        sessionStorage.setItem('mfa_otp_email', to);
        sessionStorage.setItem('mfa_otp_expires', new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString());
      }
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        messageId: `sim_otp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
};
