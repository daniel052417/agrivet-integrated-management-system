#!/bin/bash

# Database Trigger Setup Script
# This script helps you apply the customer creation trigger to your Supabase database

echo "🚀 Setting up Customer Creation Trigger for Supabase"
echo "=================================================="

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "Please install it first:"
    echo "npm install -g supabase"
    echo ""
    echo "Or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "✅ Supabase CLI found"

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory."
    echo "Please run this script from your project root where supabase/config.toml exists"
    exit 1
fi

echo "✅ Supabase project detected"

# Apply the migration
echo "📝 Applying customer creation trigger migration..."
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
    echo ""
    echo "🎉 Customer Creation Trigger is now active!"
    echo ""
    echo "What this means:"
    echo "- Every time a user signs up (regular or OAuth), a customer record will be automatically created"
    echo "- No more manual customer creation in your application code"
    echo "- More reliable and consistent customer record creation"
    echo ""
    echo "Next steps:"
    echo "1. Test user registration to verify the trigger works"
    echo "2. Test Google OAuth login to verify customer creation"
    echo "3. Check your customers table to see the new records"
else
    echo "❌ Migration failed!"
    echo "Please check your Supabase connection and try again."
    echo ""
    echo "Manual setup:"
    echo "1. Go to your Supabase dashboard"
    echo "2. Navigate to SQL Editor"
    echo "3. Copy and paste the contents of supabase/migrations/20241220_create_customer_trigger.sql"
    echo "4. Run the SQL script"
fi

