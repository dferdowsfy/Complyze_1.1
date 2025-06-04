#!/bin/bash

# Complyze Latest Downloads Build Script
# This script builds and packages the latest versions of both the Chrome extension and desktop app

set -e  # Exit on any error

echo "🚀 Building Latest Complyze Downloads..."
echo "========================================="

# Get current timestamp for versioning
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BUILD_LOG="build-${TIMESTAMP}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1" | tee -a "$BUILD_LOG"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$BUILD_LOG"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$BUILD_LOG"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$BUILD_LOG"
}

# Create downloads directory if it doesn't exist
mkdir -p complyze/public/downloads

log "Starting build process..."

# 1. BUILD CHROME EXTENSION
log "Building Chrome Extension..."
if [ -f "./package-extension.sh" ]; then
    ./package-extension.sh
    
    # Copy to downloads directory with versioned name
    if [ -f "complyze-extension-v2.0.1-production.zip" ]; then
        cp complyze-extension-v2.0.1-production.zip complyze/public/downloads/complyze-extension-latest.zip
        cp complyze-extension-v2.0.1-production.zip "complyze/public/downloads/complyze-extension-v2.0.1-${TIMESTAMP}.zip"
        success "Chrome Extension packaged successfully"
        
        # Get file size
        EXT_SIZE=$(du -h complyze/public/downloads/complyze-extension-latest.zip | cut -f1)
        log "Extension size: $EXT_SIZE"
    else
        error "Chrome Extension build failed"
        exit 1
    fi
else
    error "package-extension.sh script not found"
    exit 1
fi

# 2. BUILD DESKTOP APP
log "Building Desktop App..."
cd electron-app

# Check if we have the necessary dependencies
if [ ! -d "node_modules" ]; then
    log "Installing desktop app dependencies..."
    npm install
fi

# Build the desktop app
log "Compiling desktop app..."
npm run dist

if [ $? -eq 0 ]; then
    # Copy built files to downloads directory
    if [ -f "release/Complyze Desktop Agent-1.0.0-arm64.dmg" ]; then
        cp "release/Complyze Desktop Agent-1.0.0-arm64.dmg" ../complyze/public/downloads/
        cp "release/Complyze Desktop Agent-1.0.0-arm64.dmg" "../complyze/public/downloads/ComplyzeDesktop-macOS-Apple-${TIMESTAMP}.dmg"
        success "Desktop App (Apple Silicon) built successfully"
        
        # Get file size
        DESKTOP_SIZE=$(du -h "../complyze/public/downloads/Complyze Desktop Agent-1.0.0-arm64.dmg" | cut -f1)
        log "Desktop App size: $DESKTOP_SIZE"
    else
        error "Desktop App build failed - DMG not found"
    fi
else
    error "Desktop App build failed"
fi

cd ..

# 3. VERIFY DOWNLOAD STRUCTURE
log "Verifying download structure..."
echo ""
echo "📁 Downloads Directory Contents:"
echo "================================="
ls -la complyze/public/downloads/ | while read line; do
    echo "   $line"
done

# 4. UPDATE VERSION INFO
log "Updating version information..."

# Create a version manifest file
cat > complyze/public/downloads/version-info.json << EOF
{
  "lastUpdated": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "buildTimestamp": "$TIMESTAMP",
  "chromeExtension": {
    "version": "2.0.1",
    "filename": "complyze-extension-latest.zip",
    "size": "$EXT_SIZE"
  },
  "desktopApp": {
    "version": "1.0.0",
    "platform": "macOS-arm64",
    "filename": "Complyze Desktop Agent-1.0.0-arm64.dmg",
    "size": "$DESKTOP_SIZE"
  }
}
EOF

success "Version manifest created"

# 5. DEPLOYMENT READINESS CHECK
log "Performing deployment readiness check..."

# Check if files exist and are not empty
CHECKS_PASSED=0
TOTAL_CHECKS=3

if [ -f "complyze/public/downloads/complyze-extension-latest.zip" ] && [ -s "complyze/public/downloads/complyze-extension-latest.zip" ]; then
    success "Chrome Extension: Ready for deployment"
    ((CHECKS_PASSED++))
else
    error "Chrome Extension: Missing or empty"
fi

if [ -f "complyze/public/downloads/Complyze Desktop Agent-1.0.0-arm64.dmg" ] && [ -s "complyze/public/downloads/Complyze Desktop Agent-1.0.0-arm64.dmg" ]; then
    success "Desktop App: Ready for deployment"
    ((CHECKS_PASSED++))
else
    error "Desktop App: Missing or empty"
fi

if [ -f "complyze/public/downloads/version-info.json" ]; then
    success "Version Manifest: Ready"
    ((CHECKS_PASSED++))
else
    error "Version Manifest: Missing"
fi

echo ""
echo "📊 BUILD SUMMARY"
echo "=================="
log "Build completed at: $(date)"
log "Checks passed: $CHECKS_PASSED/$TOTAL_CHECKS"
log "Build log saved: $BUILD_LOG"

if [ $CHECKS_PASSED -eq $TOTAL_CHECKS ]; then
    success "🎉 All builds completed successfully!"
    echo ""
    echo "🚀 Next Steps:"
    echo "1. Deploy the website to update download links"
    echo "2. Test downloads from the live site"
    echo "3. Update Chrome Web Store if needed"
    echo ""
    echo "📁 Latest Files Ready:"
    echo "• Chrome Extension: complyze/public/downloads/complyze-extension-latest.zip"
    echo "• Desktop App: complyze/public/downloads/Complyze Desktop Agent-1.0.0-arm64.dmg"
    echo "• Version Info: complyze/public/downloads/version-info.json"
else
    error "⚠️  Some builds failed. Check the log for details."
    exit 1
fi 