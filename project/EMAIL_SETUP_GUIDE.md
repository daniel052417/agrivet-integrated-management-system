# Email Setup Guide for Account Activation

## Current Status
❌ **The current email service is NOT sending real emails** - it's only simulating the process.

## Setup Real Email Sending with Gmail

### Step 1: Install Required Dependencies

```bash
npm install nodemailer @types/nodemailer
```

### Step 2: Enable 2-Factor Authentication on Gmail

1. Go to your Google Account settings
2. Navigate to Security → 2-Step Verification
3. Enable 2-Factor Authentication if not already enabled

### Step 3: Generate App Password

1. Go to Google Account → Security
2. Under "2-Step Verification", click "App passwords"
3. Select "Mail" and "Other (Custom name)"
4. Enter "AgriVet System" as the name
5. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Step 4: Create Environment Variables

Create a `.env` file in your project root:

```env
# Gmail SMTP Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password

# Frontend URL (for activation links)
FRONTEND_URL=http://localhost:3000
```

### Step 5: Update Email Service

Replace the import in your files:

```typescript
// Change this:
import { emailService } from '../../lib/emailService';

// To this:
import { realEmailService as emailService } from '../../lib/realEmailService';
```

### Step 6: Test Email Configuration

Add this test function to verify your setup:

```typescript
import { realEmailService } from './lib/realEmailService';

// Test email configuration
const testEmail = async () => {
  const result = await realEmailService.testEmailConfiguration();
  console.log('Email test result:', result);
};

testEmail();
```

## Alternative Email Services

### Option 1: SendGrid (Recommended for Production)

1. Sign up at sendgrid.com
2. Get API key from Settings → API Keys
3. Install: `npm install @sendgrid/mail`

```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const msg = {
  to: 'recipient@example.com',
  from: 'sender@yourdomain.com',
  subject: 'Test Email',
  html: '<p>Test email content</p>',
};

await sgMail.send(msg);
```

### Option 2: AWS SES

1. Set up AWS SES
2. Verify your domain/email
3. Install: `npm install aws-sdk`

### Option 3: Mailgun

1. Sign up at mailgun.com
2. Get API key and domain
3. Install: `npm install mailgun-js`

## Security Notes

- ✅ Use App Passwords, not regular Gmail passwords
- ✅ Store credentials in environment variables
- ✅ Never commit `.env` files to version control
- ✅ Use HTTPS for production activation links
- ✅ Consider rate limiting for email sending

## Testing

After setup, test the email flow:

1. Create an account request
2. Approve the request
3. Check if activation email is received
4. Test the activation link
5. Verify account activation works

## Troubleshooting

### Common Issues:

1. **"Invalid login"** → Check App Password is correct
2. **"Less secure app access"** → Use App Password, not regular password
3. **"Connection timeout"** → Check firewall/network settings
4. **"Authentication failed"** → Verify 2FA is enabled and App Password is generated

### Debug Mode:

Enable debug logging in nodemailer:

```typescript
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  },
  debug: true, // Enable debug logging
  logger: true // Log to console
});
```
