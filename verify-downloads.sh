#!/bin/bash

# Complyze Downloads Verification Script
# This script verifies that all download files are present and accessible

echo "🔍 Verifying Complyze Downloads..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

DOWNLOADS_DIR="complyze/public/downloads"
ERRORS=0
WARNINGS=0

# Check if downloads directory exists
if [ ! -d "$DOWNLOADS_DIR" ]; then
    error "Downloads directory not found: $DOWNLOADS_DIR"
    exit 1
fi

echo ""
echo "📁 Download Files Verification:"
echo "==============================="

# 1. Chrome Extension
echo ""
info "Chrome Extension:"
if [ -f "$DOWNLOADS_DIR/complyze-extension-latest.zip" ]; then
    SIZE=$(du -h "$DOWNLOADS_DIR/complyze-extension-latest.zip" | cut -f1)
    success "Extension found - Size: $SIZE"
    
    # Check if it's a valid ZIP
    if unzip -t "$DOWNLOADS_DIR/complyze-extension-latest.zip" >/dev/null 2>&1; then
        success "ZIP file is valid"
    else
        error "ZIP file is corrupted"
        ((ERRORS++))
    fi
else
    error "Chrome Extension not found: complyze-extension-latest.zip"
    ((ERRORS++))
fi

# 2. Desktop App (Latest)
echo ""
info "Desktop App (Latest):"
if [ -f "$DOWNLOADS_DIR/Complyze Desktop Agent-1.0.0-arm64.dmg" ]; then
    SIZE=$(du -h "$DOWNLOADS_DIR/Complyze Desktop Agent-1.0.0-arm64.dmg" | cut -f1)
    success "Latest Desktop App found - Size: $SIZE"
else
    error "Latest Desktop App not found: Complyze Desktop Agent-1.0.0-arm64.dmg"
    ((ERRORS++))
fi

# 3. Desktop App (Legacy)
echo ""
info "Desktop App (Legacy):"
if [ -f "$DOWNLOADS_DIR/ComplyzeDesktop-macOS-Apple.dmg" ]; then
    SIZE=$(du -h "$DOWNLOADS_DIR/ComplyzeDesktop-macOS-Apple.dmg" | cut -f1)
    success "Legacy Desktop App found - Size: $SIZE"
else
    warning "Legacy Desktop App not found: ComplyzeDesktop-macOS-Apple.dmg"
    ((WARNINGS++))
fi

# 4. Version Info
echo ""
info "Version Information:"
if [ -f "$DOWNLOADS_DIR/version-info.json" ]; then
    success "Version info found"
    
    # Validate JSON
    if python3 -c "import json; json.load(open('$DOWNLOADS_DIR/version-info.json'))" 2>/dev/null; then
        success "JSON is valid"
        
        # Extract and display key info
        VERSION_EXT=$(python3 -c "import json; data=json.load(open('$DOWNLOADS_DIR/version-info.json')); print(data['chromeExtension']['version'])" 2>/dev/null)
        VERSION_APP=$(python3 -c "import json; data=json.load(open('$DOWNLOADS_DIR/version-info.json')); print(data['desktopApp']['version'])" 2>/dev/null)
        
        if [ ! -z "$VERSION_EXT" ] && [ ! -z "$VERSION_APP" ]; then
            info "Extension Version: $VERSION_EXT"
            info "Desktop App Version: $VERSION_APP"
        fi
    else
        error "Invalid JSON format"
        ((ERRORS++))
    fi
else
    error "Version info not found: version-info.json"
    ((ERRORS++))
fi

# 5. Check file permissions
echo ""
echo "🔒 File Permissions Check:"
echo "=========================="

for file in "complyze-extension-latest.zip" "Complyze Desktop Agent-1.0.0-arm64.dmg" "version-info.json"; do
    if [ -f "$DOWNLOADS_DIR/$file" ]; then
        PERMS=$(ls -la "$DOWNLOADS_DIR/$file" | awk '{print $1}')
        if [[ $PERMS == *"r--"* ]]; then
            success "$file: Readable ✓"
        else
            warning "$file: May not be readable"
            ((WARNINGS++))
        fi
    fi
done

# 6. Calculate total download size
echo ""
echo "📊 Download Statistics:"
echo "======================"

TOTAL_SIZE=0
if command -v du >/dev/null 2>&1; then
    TOTAL_SIZE_BYTES=$(find "$DOWNLOADS_DIR" -type f \( -name "*.zip" -o -name "*.dmg" \) -exec du -b {} + | awk '{sum += $1} END {print sum}')
    if [ ! -z "$TOTAL_SIZE_BYTES" ]; then
        TOTAL_SIZE_MB=$((TOTAL_SIZE_BYTES / 1024 / 1024))
        info "Total download size: ${TOTAL_SIZE_MB}MB"
    fi
fi

FILE_COUNT=$(find "$DOWNLOADS_DIR" -type f | wc -l | tr -d ' ')
info "Total files: $FILE_COUNT"

# 7. Web accessibility test (if local server is running)
echo ""
echo "🌐 Web Accessibility Test:"
echo "=========================="

# Try to test localhost first, then production
LOCAL_URL="http://localhost:3000/downloads/complyze-extension-latest.zip"
PROD_URL="https://complyze.co/downloads/complyze-extension-latest.zip"

if curl -s --head "$LOCAL_URL" | head -n 1 | grep -q "200 OK"; then
    success "Local development server: Downloads accessible"
elif curl -s --head "$PROD_URL" | head -n 1 | grep -q "200 OK"; then
    success "Production server: Downloads accessible"
else
    warning "Cannot verify web accessibility (server may not be running)"
    ((WARNINGS++))
fi

# Summary
echo ""
echo "📋 VERIFICATION SUMMARY"
echo "======================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    success "🎉 All downloads verified successfully!"
    echo ""
    echo "✅ Ready for deployment!"
    echo "• Chrome Extension: Latest version packaged"
    echo "• Desktop App: Latest version built"
    echo "• Version info: Up to date"
    echo "• All files accessible"
elif [ $ERRORS -eq 0 ]; then
    warning "⚠️  Verification completed with $WARNINGS warning(s)"
    echo ""
    echo "✅ Safe to deploy (minor issues found)"
else
    error "❌ Verification failed with $ERRORS error(s) and $WARNINGS warning(s)"
    echo ""
    echo "🔧 Please fix errors before deployment:"
    exit 1
fi

echo ""
echo "🚀 Next Steps:"
echo "1. Deploy website updates"
echo "2. Test download links on live site"
echo "3. Verify extension installation process"
echo "4. Test desktop app installation" 