/**
 * Test Email Debug Script
 * Test the SendGrid Edge Function with debugging
 */

const SUPABASE_URL = 'https://prhxgpbqkpdnjpmxndyp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaHhncGJxa3BkbmptcG5keXAiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNDY0NzQ5MCwiZXhwIjoyMDUwMjIzNDkwfQ.8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8';

async function testEmailDebug() {
  try {
    console.log('🧪 Testing email debug...');
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: 'test@example.com',
        name: 'Test User',
        type: 'activation',
        token: 'test-token-123'
      })
    });

    const result = await response.text();
    console.log('📧 Response status:', response.status);
    console.log('📧 Response body:', result);

    if (response.ok) {
      console.log('✅ Email test successful!');
    } else {
      console.log('❌ Email test failed!');
    }
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testEmailDebug();
