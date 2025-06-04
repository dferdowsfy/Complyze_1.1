#!/bin/bash

# Complyze Chrome Extension Packaging Script
# This creates a production-ready ZIP file for Chrome Web Store submission

echo "🚀 Packaging Complyze Chrome Extension for Production..."

# Create a temporary directory for the production build
TEMP_DIR="complyze-extension-production"
ZIP_NAME="complyze-extension-v2.0.1-production.zip"

# Remove any existing temp directory
rm -rf "$TEMP_DIR"
rm -f "$ZIP_NAME"

# Create temp directory
mkdir "$TEMP_DIR"

echo "📦 Copying extension files..."

# Copy core files
cp complyze-extension-v2/manifest.json "$TEMP_DIR/"
cp complyze-extension-v2/background.js "$TEMP_DIR/"
cp complyze-extension-v2/content.js "$TEMP_DIR/"
cp complyze-extension-v2/popup.html "$TEMP_DIR/"
cp complyze-extension-v2/popup.js "$TEMP_DIR/"
# popup.css not needed - styles are inline in popup.html
cp complyze-extension-v2/injectUI.js "$TEMP_DIR/"
cp complyze-extension-v2/prompt-interceptor.js "$TEMP_DIR/"

# Copy icons directory
cp -r complyze-extension-v2/icons "$TEMP_DIR/"

echo "📋 Updating manifest version to 2.0.1..."

# Update version in manifest.json
sed -i '' 's/"version": "2.0.0"/"version": "2.0.1"/' "$TEMP_DIR/manifest.json"

echo "🔍 Verifying production configuration..."

# Check that extension is configured for production
if grep -q "https://complyze.co/api" "$TEMP_DIR/background.js"; then
    echo "✅ Extension configured for production URLs"
else
    echo "⚠️  WARNING: Extension may not be configured for production"
fi

# Check for correct user ID
if grep -q "derdows@gmail.com" "$TEMP_DIR/background.js"; then
    echo "✅ Extension configured with correct user ID"
else
    echo "⚠️  WARNING: Extension may not have correct user ID"
fi

echo "📦 Creating ZIP package..."

# Create the ZIP file
cd "$TEMP_DIR"
zip -r "../$ZIP_NAME" . -x "*.DS_Store" "*/.*"
cd ..

# Clean up temp directory
rm -rf "$TEMP_DIR"

echo "✅ Package created successfully!"
echo "📁 File: $ZIP_NAME"
echo "📊 Size: $(ls -lh $ZIP_NAME | awk '{print $5}')"
echo ""
echo "🚀 Ready for Chrome Web Store submission!"
echo "📋 Changes in v2.0.1:"
echo "   • Fixed user ID synchronization with dashboard"
echo "   • Corrected fallback user authentication"
echo "   • Improved extension-dashboard data flow"
echo ""
echo "🌐 Next steps:"
echo "1. Upload to Chrome Web Store Developer Console"
echo "2. Update store listing if needed"
echo "3. Submit for review"

# Display file info
FILE_SIZE=$(du -h "$ZIP_NAME" | cut -f1)
echo "📊 Package size: $FILE_SIZE" 