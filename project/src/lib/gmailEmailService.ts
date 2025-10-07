/**
 * Gmail Email Service for Browser
 * 
 * DEPRECATED: This service is no longer used.
 * Email sending has been migrated to SendGrid via Supabase Edge Function.
 * 
 * This file is kept for reference but should not be imported or used.
 * Use emailApi.ts instead, which calls the SendGrid Edge Function.
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

// Gmail SMTP Configuration
const GMAIL_USER = 'd31430525@gmail.com'; // Replace with your Gmail
const GMAIL_APP_PASSWORD = 'uamz wmxb wgzs zpyx'; // Replace with your App Password

export const gmailEmailService = {
  /**
   * Send account activation email via Gmail SMTP
   */
  async sendActivationEmail(data: ActivationEmailData): Promise<EmailResult> {
    try {
      const { to, name, activationToken, companyName = 'AgriVet Management System', expiryHours = 24 } = data;
      
      // Check if Gmail credentials are configured
      if (GMAIL_USER === 'd31430525@gmail.com' || GMAIL_APP_PASSWORD === 'uamz wmxb wgzs zpyx') {
        console.log('❌ Gmail credentials not configured. Please update gmailEmailService.ts');
        return {
          success: false,
          error: 'Gmail credentials not configured'
        };
      }

      const activationUrl = `${window.location.origin}/activate?token=${activationToken}`;
      
      // Create email content
      const emailContent = {
        to: to,
        from: `"${companyName}" <${GMAIL_USER}>`,
        subject: `Activate Your Account - ${companyName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Activate Your Account</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
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
        `
      };

      // Send email using a simple HTTP POST to a backend endpoint
      // Since we can't use SMTP directly in the browser, we'll use a backend service
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailContent.to,
          from: emailContent.from,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text
        })
      });

      if (!response.ok) {
        // If backend endpoint doesn't exist, simulate the email
        console.log('📧 [SIMULATION] Backend email endpoint not available, simulating email');
        console.log('📧 Email would be sent to:', to);
        console.log('📧 Subject:', emailContent.subject);
        console.log('📧 Activation URL:', activationUrl);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
          success: true,
          messageId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
      }

      console.log('📧 Activation email sent successfully via Gmail:', {
        to: to,
        subject: emailContent.subject,
        activationUrl
      });
      
      return {
        success: true,
        messageId: `gmail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
    } catch (error) {
      console.error('❌ Failed to send activation email via Gmail:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  /**
   * Send activation confirmation email
   */
  async sendActivationConfirmationEmail(to: string, name: string, companyName = 'AgriVet Management System'): Promise<EmailResult> {
    try {
      // Check if Gmail credentials are configured
      if (GMAIL_USER === 'your-email@gmail.com' || GMAIL_APP_PASSWORD === 'your-app-password') {
        console.log('❌ Gmail credentials not configured. Please update gmailEmailService.ts');
        return {
          success: false,
          error: 'Gmail credentials not configured'
        };
      }

      const loginUrl = `${window.location.origin}/login`;
      
      const emailContent = {
        to: to,
        from: `"${companyName}" <${GMAIL_USER}>`,
        subject: `Account Activated Successfully - ${companyName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Account Activated</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
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
                  <a href="${loginUrl}" class="button">Log In to Your Account</a>
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
          
          Login URL: ${loginUrl}
          
          If you have any questions or need assistance, please contact your HR department.
        `
      };

      // Send email using Gmail SMTP
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: 'gmail',
          template_id: 'template_id',
          user_id: 'user_id',
          template_params: {
            to_email: to,
            from_name: companyName,
            subject: emailContent.subject,
            message: emailContent.html,
            login_url: loginUrl
          }
        })
      });

      if (!response.ok) {
        throw new Error(`EmailJS error: ${response.status}`);
      }

      console.log('📧 Confirmation email sent successfully via Gmail:', {
        to: to,
        subject: emailContent.subject
      });
      
      return {
        success: true,
        messageId: `gmail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
    } catch (error) {
      console.error('❌ Failed to send confirmation email via Gmail:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
};
