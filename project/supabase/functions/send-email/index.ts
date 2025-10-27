/**
 * Supabase Edge Function for sending emails
 * 
 * This function handles email sending on the server side
 * Deploy this to Supabase Edge Functions
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string;
  name: string;
  activationToken?: string;
  companyName?: string;
  expiryHours?: number;
  type: 'activation' | 'confirmation';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, name, activationToken, companyName = 'AgriVet Management System', expiryHours = 24, type }: EmailRequest = await req.json()

    if (!to || !name) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SendGrid Configuration
    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@agrivet.com';
    const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173';
    
    let emailContent: any = {};
    
    if (type === 'activation' && activationToken) {
      const activationUrl = `${FRONTEND_URL}/activate?token=${activationToken}`;
      
      emailContent = {
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
    } else if (type === 'confirmation') {
      const loginUrl = `${FRONTEND_URL}/login`;
      
      emailContent = {
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
    }

    // Log the email (in production, you would send it via a real email service)
    console.log('📧 [EDGE FUNCTION] Email prepared:', {
      to: emailContent.to,
      subject: emailContent.subject,
      type
    });

    // Send email using SendGrid API
    try {
      // Check if SendGrid API key is configured
      if (!SENDGRID_API_KEY) {
        throw new Error('SENDGRID_API_KEY environment variable is not set');
      }

      console.log('📧 [SENDGRID] Sending email:', {
        to: emailContent.to,
        subject: emailContent.subject,
        type,
        from: FROM_EMAIL
      });

      // Check environment variables
      console.log('🔍 [SENDGRID] Environment check:', {
        hasSendGridKey: !!SENDGRID_API_KEY,
        hasFromEmail: !!FROM_EMAIL,
        hasFrontendUrl: !!FRONTEND_URL,
        sendGridKeyLength: SENDGRID_API_KEY?.length || 0
      });

      // Create plain text version from HTML
      const textContent = emailContent.html
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      console.log('📤 [SENDGRID] Attempting to send email via SendGrid API...');

      // Send email via SendGrid API
      let response;
      try {
        response = await fetch('https://api.sendgrid.com/v3/mail/send', {
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

        console.log('📡 [SENDGRID] Response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ [SENDGRID] API error response:', errorText);
          throw new Error(`SendGrid API error: ${response.status} - ${errorText}`);
        }
      } catch (fetchError) {
        console.error('❌ [SENDGRID] Fetch error:', fetchError);
        throw new Error(`Failed to send email: ${fetchError.message}`);
      }

      const responseData = await response.json();
      const messageId = response.headers.get('X-Message-Id') || `sg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log('✅ Email sent successfully via SendGrid:', {
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
          type
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } catch (error) {
      console.error('❌ SendGrid Error:', error);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `SendGrid Error: ${error.message}`,
          message: 'Failed to send email via SendGrid',
          to: emailContent.to,
          subject: emailContent.subject,
          type
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('Error in send-email function:', error)
    
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
