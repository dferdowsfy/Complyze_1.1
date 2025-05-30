# Complyze Desktop Agent - Testing Guide

## 🚀 New Features Implemented

### 1. Enhanced Prompt Monitoring System
- **All prompts now trigger notifications**: Both simple prompts and those with sensitive data
- **Non-blocking notifications**: For prompts without sensitive data (shows enhanced version)
- **Blocking notifications**: For prompts with sensitive data (requires user action)
- **Real-time clipboard monitoring**: Detects and processes prompts copied to clipboard

### 2. Test Notification Button
- Added "Test Notification" button in the main UI
- Triggers a sample notification with enhanced prompt and insights
- Shows the full notification system functionality

### 3. Interactive Prompt Tester
- Added "Show Prompt Tester" section in the UI
- Allows manual input of prompts for testing
- Includes example prompts (simple, with sensitive data, creative tasks)
- Copies prompts to clipboard to trigger monitoring system

### 4. Enhanced Notification Popups
- **Scrollable content**: All sections are properly scrollable
- **Optimized prompt section**: Shows enhanced version with copy button
- **Analysis & insights**: Displays intent detection, quality scores, improvements
- **Sensitive data details**: Shows what was detected and removed

## 🧪 How to Test

### Method 1: Using the Test Notification Button
1. Start the Complyze Desktop Agent: `npm start`
2. Click "Test Notification" button in the main UI
3. A blocking notification should appear with:
   - Enhanced prompt version
   - Analysis & insights section
   - Sensitive data removal details
   - Action buttons (Use Optimized, Keep Original)

### Method 2: Using the Prompt Tester
1. Click "Show Prompt Tester" in the main UI
2. Either:
   - Type your own prompt in the textarea
   - Click one of the example buttons to load a sample prompt
3. Click "Test Enhancement" - this will:
   - Copy the prompt to clipboard
   - Trigger the monitoring system
   - Show appropriate notification (blocking or non-blocking)

### Method 3: Manual Clipboard Testing
1. Copy any of these test prompts to your clipboard:

**Simple prompt (non-blocking notification):**
```
Please explain how machine learning works
```

**Prompt with sensitive data (blocking notification):**
```
Can you help me write an email to john.doe@company.com about my SSN 123-45-6789?
```

**Creative task (non-blocking notification):**
```
Generate a comprehensive blog post about artificial intelligence and its impact on society
```

### Method 4: Using the Test Script
Run the automated clipboard test:
```bash
node test-clipboard-monitoring.js
```

This will automatically copy different types of prompts to your clipboard and trigger notifications.

## 📋 Expected Behavior

### For Simple Prompts (no sensitive data):
- **Non-blocking notification** appears (top-right corner)
- Shows enhanced/optimized version of the prompt
- Displays analysis & insights
- Auto-closes after 15 seconds
- Has "Dismiss" and "View Dashboard" buttons

### For Prompts with Sensitive Data:
- **Blocking notification** appears (center screen)
- Shows enhanced version with sensitive data removed
- Displays what sensitive data was detected
- Requires user action (doesn't auto-close)
- Has "Use Optimized" and "Keep Original" buttons

### Notification Content:
All notifications include:
1. **Optimized Prompt**: Enhanced version following AI best practices
2. **Analysis & Insights**:
   - Intent detection (creation, analysis, explanation, etc.)
   - Optimization reason
   - Quality score improvement
   - Clarity score improvement
   - List of improvements made
3. **Sensitive Data Details**: What was detected and removed (if any)

## 🔧 Monitoring Features

### Clipboard Monitoring:
- Monitors clipboard every 2 seconds
- Detects prompt indicators: "explain", "generate", "help me", etc.
- Detects sensitive data: emails, SSNs, credit cards, phone numbers
- Shows notifications for all detected prompts

### App Detection:
- Monitors for AI apps: ChatGPT Desktop, Claude Desktop, etc.
- Shows awareness notifications when apps are detected
- Updates live monitoring status in the UI

### Web Monitoring:
- Requires Chrome extension for full web blocking
- Provides guidance for browser-based AI tools

## 🎯 Key Improvements Made

1. **Fixed monitoring trigger**: Now shows enhanced prompts for ALL detected prompts, not just sensitive ones
2. **Added test functionality**: Multiple ways to test the system
3. **Enhanced UI**: Interactive prompt tester with examples
4. **Better notifications**: Scrollable, informative, with proper insights
5. **Comprehensive testing**: Multiple test methods and scripts

## 🚨 Troubleshooting

### If notifications don't appear:
1. Check that monitoring is enabled (ON button in UI)
2. Ensure the app has clipboard access permissions
3. Try the "Test Notification" button first
4. Check console logs for debug information

### If enhanced prompts seem incorrect:
1. The system removes sensitive data completely (no [REDACTED] placeholders)
2. Enhanced prompts follow AI best practices and may be significantly different
3. Check the "Analysis & Insights" section for explanation of changes

### Performance:
- Monitoring runs every 2 seconds
- Only processes clipboard changes (not constant processing)
- Notifications are lightweight and non-intrusive

## 📊 Testing Checklist

- [ ] Test Notification button works
- [ ] Prompt Tester section appears/hides correctly
- [ ] Example buttons load prompts correctly
- [ ] Manual prompt input triggers notifications
- [ ] Clipboard monitoring detects simple prompts
- [ ] Clipboard monitoring detects sensitive data
- [ ] Blocking notifications require user action
- [ ] Non-blocking notifications auto-close
- [ ] Enhanced prompts are generated correctly
- [ ] Analysis & insights are displayed
- [ ] Copy button works in notifications
- [ ] Monitoring status updates in real-time

## 🎉 Success Criteria

The system is working correctly if:
1. **All prompts trigger notifications** (not just sensitive ones)
2. **Enhanced prompts are intelligent** and follow AI best practices
3. **Notifications are informative** with insights and analysis
4. **User can test easily** using multiple methods
5. **Monitoring is real-time** and responsive 