/**
 * Supabase Edge Function for sending MFA OTP emails
 * 
 * This function handles MFA OTP email sending on the server side
 * Deploy this to Supabase Edge Functions
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Supabase recommended CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface OTPEmailRequest {
  to: string;
  name: string;
  otpCode: string;
  expiryMinutes?: number;
  companyName?: string;
  type: 'otp';
}

serve(async (req) => {
  // Handle CORS preflight requests - MUST return 200 with CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, // 204 No Content is better for OPTIONS
      headers: {
        ...corsHeaders,
        'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
      }
    })
  }

  try {
    const { to, name, otpCode, expiryMinutes = 5, companyName = 'AgriVet Management System', type }: OTPEmailRequest = await req.json()

    if (!to || !name || !otpCode) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: to, name, otpCode' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Email Service Configuration
    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@agrivet.com';
    
    // Gmail SMTP Configuration (alternative to SendGrid)
    const GMAIL_USER = Deno.env.get('GMAIL_USER');
    const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD');
    
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
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
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

    // Log the email (for debugging)
    console.log('📧 [MFA-EMAIL] Email prepared:', {
      to: emailContent.to,
      subject: emailContent.subject,
      type
    });

    // Try to send email - first SendGrid, then Gmail SMTP, then fallback
    try {
      // Priority 1: Try SendGrid if configured
      if (SENDGRID_API_KEY) {
        return await sendViaSendGrid(emailContent, name, companyName, SENDGRID_API_KEY, FROM_EMAIL, corsHeaders);
      }
      
      // Priority 2: Try Gmail SMTP if configured
      if (GMAIL_USER && GMAIL_APP_PASSWORD) {
        return await sendViaGmailSMTP(emailContent, name, companyName, GMAIL_USER, GMAIL_APP_PASSWORD, corsHeaders);
      }
      
      // Priority 3: Development mode - return OTP in response
      console.warn('⚠️ [MFA-EMAIL] No email service configured (SendGrid or Gmail), returning OTP for development');
      return new Response(
        JSON.stringify({ 
          success: true, 
          messageId: `dev_${Date.now()}`,
          message: 'Email prepared (No email service configured - development mode)',
          to: emailContent.to,
          subject: emailContent.subject,
          otpCode: otpCode // Include OTP in dev mode for testing
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } catch (error) {
      console.error('❌ [MFA-EMAIL] Email sending error:', error);
      
      // Return success even if email fails - OTP is still valid
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Email Error: ${error.message}`,
          message: 'Failed to send email, but OTP is valid',
          to: emailContent.to,
          subject: emailContent.subject,
          otpCode: otpCode, // Include OTP as fallback
          type
        }),
        { 
          status: 200, // Return 200 so client can use fallback
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error('❌ [MFA-EMAIL] Error in mfa-email function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Helper function to send via SendGrid
async function sendViaSendGrid(
  emailContent: any,
  name: string,
  companyName: string,
  SENDGRID_API_KEY: string,
  FROM_EMAIL: string,
  corsHeaders: Record<string, string>
) {
  console.log('📧 [MFA-EMAIL] Sending email via SendGrid:', {
    to: emailContent.to,
    subject: emailContent.subject,
    from: FROM_EMAIL
  });

  // Create plain text version from HTML
  const textContent = emailContent.html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Send email via SendGrid API
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: emailContent.to, name: name }],
        subject: emailContent.subject
      }],
      from: { 
        email: FROM_EMAIL, 
        name: companyName 
      },
      content: [
        { 
          type: 'text/plain', 
          value: textContent 
        },
        { 
          type: 'text/html', 
          value: emailContent.html 
        }
      ]
    })
  });

  console.log('📡 [MFA-EMAIL] SendGrid response:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [MFA-EMAIL] SendGrid API error:', errorText);
    throw new Error(`SendGrid API error: ${response.status} - ${errorText}`);
  }

  const messageId = response.headers.get('X-Message-Id') || `sg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log('✅ [MFA-EMAIL] Email sent successfully via SendGrid:', {
    to: emailContent.to,
    subject: emailContent.subject,
    messageId
  });

  return new Response(
    JSON.stringify({ 
      success: true, 
      messageId,
      message: 'Email sent successfully via SendGrid',
      to: emailContent.to,
      subject: emailContent.subject,
      type: 'otp'
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

// Helper function to send via Gmail SMTP
async function sendViaGmailSMTP(
  emailContent: any,
  name: string,
  companyName: string,
  GMAIL_USER: string,
  GMAIL_APP_PASSWORD: string,
  corsHeaders: Record<string, string>
) {
  console.log('📧 [MFA-EMAIL] Sending email via Gmail SMTP:', {
    to: emailContent.to,
    subject: emailContent.subject,
    from: GMAIL_USER
  });

  // Gmail SMTP configuration
  const smtpHost = 'smtp.gmail.com';
  const smtpPort = 587;
  
  // Create plain text version from HTML
  const textContent = emailContent.html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Build email message in RFC 5322 format
  const message = [
    `From: "${companyName}" <${GMAIL_USER}>`,
    `To: "${name}" <${emailContent.to}>`,
    `Subject: ${emailContent.subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="boundary123"`,
    ``,
    `--boundary123`,
    `Content-Type: text/plain; charset=UTF-8`,
    ``,
    textContent,
    ``,
    `--boundary123`,
    `Content-Type: text/html; charset=UTF-8`,
    ``,
    emailContent.html,
    ``,
    `--boundary123--`
  ].join('\r\n');

  try {
    // Use Deno SMTP library for reliable email sending
    // Import the SMTP client library
    const { SmtpClient } = await import('https://deno.land/x/denomailer@1.6.0/mod.ts');
    
    const client = new SmtpClient();
    
    await client.connect({
      hostname: smtpHost,
      port: smtpPort,
      username: GMAIL_USER,
      password: GMAIL_APP_PASSWORD,
    });

    await client.send({
      from: `"${companyName}" <${GMAIL_USER}>`,
      to: `"${name}" <${emailContent.to}>`,
      subject: emailContent.subject,
      content: emailContent.html,
      html: emailContent.html,
      text: textContent,
    });

    await client.close();

    const messageId = `gmail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('✅ [MFA-EMAIL] Email sent successfully via Gmail SMTP:', {
      to: emailContent.to,
      subject: emailContent.subject,
      messageId
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId,
        message: 'Email sent successfully via Gmail SMTP',
        to: emailContent.to,
        subject: emailContent.subject,
        type: 'otp'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('❌ [MFA-EMAIL] Gmail SMTP error:', error);
    throw new Error(`Gmail SMTP error: ${error.message}`);
  }
}

