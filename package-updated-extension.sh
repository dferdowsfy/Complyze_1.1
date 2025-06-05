#!/bin/bash

echo "📦 Packaging Updated Complyze Extension with Authentication & Dashboard Sync..."

# Create a staging directory
STAGING_DIR="complyze-extension-updated"
ZIP_NAME="complyze-extension-v2.3.2-auth-dashboard-sync.zip"

# Clean up any existing staging directory
rm -rf "$STAGING_DIR"
mkdir "$STAGING_DIR"

echo "📋 Copying essential extension files..."

# Copy all essential extension files
cd complyze-extension-v2

# Core files
cp manifest.json "../$STAGING_DIR/"
cp background.js "../$STAGING_DIR/"
cp content.js "../$STAGING_DIR/"
cp floating-ui.js "../$STAGING_DIR/"
cp popup.html "../$STAGING_DIR/"
cp popup.js "../$STAGING_DIR/"
cp injectUI.js "../$STAGING_DIR/"
cp prompt-interceptor.js "../$STAGING_DIR/"

# Debugging utilities
cp debug-reload.js "../$STAGING_DIR/"
cp force-floating-ui.js "../$STAGING_DIR/"
cp debug-auth.js "../$STAGING_DIR/"

# Icons directory
cp -r icons "../$STAGING_DIR/"

cd ..

# Copy test script
cp test-extension-flow.js "$STAGING_DIR/"

echo "🔧 Updating version in manifest..."
cd "$STAGING_DIR"

# Update version to 2.3.2
sed -i '' 's/"version": "2.3.1"/"version": "2.3.2"/' manifest.json

echo "📝 Creating README for this version..."
cat > README.md << 'EOF'
# Complyze Extension v2.3.2 - Authentication & Dashboard Sync

## 🚀 What's New in This Version

### ✅ Fixed Issues:
1. **Sidebar Authentication Flow**: Floating sidebar now properly appears when alerts are triggered
2. **Login Screen Integration**: Unauthenticated users see login form in the sidebar
3. **Dashboard Sync**: Authenticated users' prompts now sync to Supabase/Dashboard in real-time
4. **API Integration**: Fixed `/api/ingest` endpoint integration for prompt events
5. **Authentication Status**: Proper authentication checking throughout the flow

### 🔧 Installation Instructions:

1. **Load Extension in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select this folder

2. **Test the Extension:**
   - Go to ChatGPT, Claude, or Gemini
   - Look for the Complyze floating icon on the right side
   - Try entering a prompt with sensitive data like:
     ```
     My email is john.doe@example.com and my SSN is 123-45-6789
     ```

3. **Test Authentication Flow:**
   - If not logged in: Sidebar should open with login form
   - If logged in: Security alert should appear
   - All prompts should sync to dashboard at https://complyze.co/dashboard

### 🧪 Testing:

Run the test script in browser console:
```javascript
// Copy and paste the contents of test-extension-flow.js into the console
```

### 📊 Expected Behavior:

**For Unauthenticated Users:**
- Floating icon appears on supported AI platforms
- When sensitive data is detected, sidebar opens with login form
- Users can log in directly from the sidebar
- After login, security features become active

**For Authenticated Users:**
- Security alerts appear in floating sidebar
- Optimized prompts are provided
- All prompts sync to dashboard automatically
- Real-time cost and usage tracking

### 🔗 Dashboard Access:
https://complyze.co/dashboard

---

## 📞 Support
For issues or questions, contact the development team.
EOF

echo "📦 Creating ZIP package..."
cd ..
zip -r "$ZIP_NAME" "$STAGING_DIR/" -x "*.DS_Store" "*/.*" 

# Clean up staging directory
rm -rf "$STAGING_DIR"

echo "✅ Extension packaged successfully!"
echo "📦 Package: $ZIP_NAME"
echo "📏 Size: $(du -h "$ZIP_NAME" | cut -f1)"

echo ""
echo "🚀 Next Steps:"
echo "1. Load the extension in Chrome using 'Load unpacked'"
echo "2. Test on ChatGPT: https://chat.openai.com"
echo "3. Check console logs for debugging"
echo "4. Verify dashboard sync at: https://complyze.co/dashboard"
echo ""
echo "🔧 For testing, run the test script in browser console on any AI platform" 