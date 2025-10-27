/**
 * Email Test Script
 * 
 * Run this script to test your email configuration:
 * node test-email.js
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmailConfiguration() {
  console.log('🧪 Testing Email Configuration...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`GMAIL_USER: ${process.env.GMAIL_USER ? '✅ Set' : '❌ Missing'}`);
  console.log(`GMAIL_APP_PASSWORD: ${process.env.GMAIL_APP_PASSWORD ? '✅ Set' : '❌ Missing'}`);
  console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL || '❌ Missing (using default)'}\n`);

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log('❌ Email configuration incomplete!');
    console.log('📖 Please check EMAIL_SETUP_GUIDE.md for setup instructions');
    return;
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    // Test connection
    console.log('🔌 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    // Send test email
    console.log('📧 Sending test email...');
    const testEmail = {
      from: `"AgriVet Test" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER, // Send to yourself for testing
      subject: '🧪 Email Test - AgriVet System',
      html: `
        <h2>✅ Email Configuration Test Successful!</h2>
        <p>Your Gmail SMTP configuration is working correctly.</p>
        <p><strong>Test Details:</strong></p>
        <ul>
          <li>From: ${process.env.GMAIL_USER}</li>
          <li>To: ${process.env.GMAIL_USER}</li>
          <li>Time: ${new Date().toLocaleString()}</li>
        </ul>
        <p>You can now use the account activation system with real email sending!</p>
      `,
      text: `
        Email Configuration Test Successful!
        
        Your Gmail SMTP configuration is working correctly.
        
        Test Details:
        - From: ${process.env.GMAIL_USER}
        - To: ${process.env.GMAIL_USER}
        - Time: ${new Date().toLocaleString()}
        
        You can now use the account activation system with real email sending!
      `
    };

    const result = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log(`📧 Message ID: ${result.messageId}`);
    console.log(`📬 Check your inbox at ${process.env.GMAIL_USER}\n`);

    console.log('🎉 Email setup is complete! Your account activation system will now send real emails.');

  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('\n💡 Troubleshooting:');
      console.log('1. Make sure you\'re using an App Password, not your regular Gmail password');
      console.log('2. Verify 2-Factor Authentication is enabled on your Gmail account');
      console.log('3. Check that the App Password was generated correctly');
    } else if (error.message.includes('Less secure app access')) {
      console.log('\n💡 Troubleshooting:');
      console.log('1. Use App Passwords instead of enabling "Less secure app access"');
      console.log('2. Generate a new App Password from Google Account settings');
    } else {
      console.log('\n💡 Troubleshooting:');
      console.log('1. Check your internet connection');
      console.log('2. Verify Gmail credentials are correct');
      console.log('3. Check firewall settings');
    }
  }
}

// Run the test
testEmailConfiguration();
