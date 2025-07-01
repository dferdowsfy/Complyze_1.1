#!/bin/bash

echo "🌐 Deploying Domain Configuration Fix for complyze.co"
echo ""

# Add the updated netlify.toml
git add netlify.toml

# Commit the domain configuration fix
git commit -m "fix: Configure complyze.co domain with proper HTTPS redirects

🌐 Domain Configuration Updates:
• Set NEXT_PUBLIC_SITE_URL to https://complyze.co
• Added HTTPS redirect from HTTP traffic
• Added www to non-www redirect
• Configured proper Netlify domain handling

This should resolve the issue where the site deploys successfully 
but doesn't appear on complyze.co domain."

# Push to GitHub (which triggers Netlify rebuild)
git push origin main

echo ""
echo "✅ Domain configuration fix deployed!"
echo ""
echo "🔄 Next steps:"
echo "1. Go to your Netlify dashboard"
echo "2. Navigate to Domain settings"
echo "3. Add 'complyze.co' as custom domain"
echo "4. Configure DNS to point to Netlify"
echo ""
echo "📱 Your site should be live at https://complyze.co once DNS propagates!" 