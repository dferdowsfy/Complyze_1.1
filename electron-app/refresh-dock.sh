#!/bin/bash

# Force refresh macOS dock to clear cached icons
echo "🔄 Refreshing macOS dock to clear cached icons..."

# Kill dock to force refresh
killall Dock

echo "✅ Dock refreshed! The new Complyze icon should now appear." 