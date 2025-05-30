# Quick Test Guide - Fixed Issues

## 🔧 Fixes Applied

1. **Fixed AppleScript errors** - Simplified text extraction logic
2. **Reduced monitoring frequency** - App checking every 10s instead of 3s
3. **Improved input detection** - Better text extraction from ChatGPT/Claude
4. **Always show notifications** - Every detected prompt will show a notification
5. **Added test functions** - Manual testing capabilities

## 🚀 Quick Tests

### Test 1: Verify Notification System Works
1. **In the Complyze app**, click "Show Prompt Tester" 
2. **Click "Test Simple Notification"** button
3. **Expected**: A notification popup should appear immediately
   - Should show "Test System" as source
   - Should have enhanced prompt section
   - Should auto-close after 8 seconds

### Test 2: Test Input Detection Simulation
1. **In the Complyze app**, click "Show Prompt Tester"
2. **Click "Test Input Detection"** button  
3. **Expected**: A notification popup should appear for simulated ChatGPT input
   - Should show "ChatGPT (Test)" as source
   - Should detect email address
   - Should show enhanced version

### Test 3: Test Real ChatGPT Detection
1. **Open ChatGPT desktop app**
2. **Type a test prompt**: "My email is test@example.com, can you help me?"
3. **Expected**: 
   - Terminal should show: "*** PROCESSING INPUT FROM ChatGPT ***"
   - Notification should appear within 2-3 seconds
   - Should detect sensitive email data

### Test 4: Test Clipboard Detection
1. **Copy this text**: "My SSN is 123-45-6789"
2. **Expected**: Notification appears for clipboard content with sensitive data

## 📋 What to Look For

### ✅ Success Indicators:
- App checking logs reduced to every 10 seconds
- No more AppleScript syntax errors
- Notifications appear for all tests
- Terminal shows "*** PROCESSING INPUT ***" messages
- ChatGPT and Claude show as "Active" in monitoring section

### ❌ Problem Indicators:
- Continuous app checking every 3 seconds
- AppleScript syntax errors in terminal
- No notifications appearing for tests
- "ECONNREFUSED" errors (normal - dashboard not running locally)

## 🐛 Troubleshooting

If notifications still don't appear:
1. **Test the notification system first** with Test 1 above
2. **Check accessibility permissions** in System Preferences > Privacy & Security > Accessibility
3. **Restart the app** if needed
4. **Check terminal output** for debug messages

The key improvement is that **every detected prompt should now show a notification**, even if there are processing errors! 