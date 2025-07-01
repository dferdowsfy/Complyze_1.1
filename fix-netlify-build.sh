#!/bin/bash

echo "🔧 Fixing Netlify Build Issue"
echo ""

echo "❌ Issue Found: Duplicate NEXT_PUBLIC_SITE_URL in netlify.toml"
echo "✅ Fixed: Removed duplicate environment variable"
echo ""

# Add the corrected netlify.toml
git add netlify.toml

# Commit the fix
git commit -m "fix: Remove duplicate NEXT_PUBLIC_SITE_URL causing build failure

🐛 Bug Fix:
• Removed duplicate NEXT_PUBLIC_SITE_URL environment variable
• This was causing Netlify builds to fail after recent commits
• Site should now deploy successfully to complyze.co

The duplicate line was:
- NEXT_PUBLIC_SITE_URL = \"https://complyze.co\"
- NEXT_PUBLIC_SITE_URL = \"https://complyze.co\"

Now fixed to single declaration."

# Push to trigger new deployment
git push origin main

echo ""
echo "🚀 Deploying fix to Netlify..."
echo ""
echo "⏳ This should resolve the build failure."
echo "📱 Check https://complyze.co in a few minutes!"
echo ""
echo "💡 If it still doesn't work, check Netlify deploy logs for errors." 