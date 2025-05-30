# Complyze Desktop Agent - Core Functionality

## 🎯 **Focus: Real-time ChatGPT & Claude Desktop App Monitoring**

### ✅ **What's Implemented:**

1. **🔥 NEW: Real-time Input Monitoring**
   - **Monitors text as you type** in ChatGPT Desktop and Claude Desktop apps
   - Uses macOS accessibility APIs and AppleScript for text field monitoring
   - Detects prompt indicators in real-time: "explain", "generate", "help me", etc.
   - Shows enhanced prompts immediately when typing
   - **"🔄 Replace Text" button** can update text directly in the AI app
   - Requires accessibility permissions for full functionality

2. **Real-time Clipboard Monitoring**
   - Monitors clipboard every 1 second for responsiveness
   - Detects prompt indicators: "explain", "generate", "help me", etc.
   - Detects sensitive data: emails, SSNs, credit cards, phone numbers
   - Shows enhanced prompts for ALL detected prompts

3. **Enhanced Desktop App Detection**
   - Monitors for ChatGPT Desktop and Claude Desktop apps
   - Active window monitoring (with accessibility permissions)
   - Shows notification when you switch to AI apps
   - Provides workflow recommendations
   - Enhanced process matching with multiple patterns
   - Real-time status updates in UI

4. **Smart Notification System**
   - **Non-blocking notifications**: For simple prompts (top-right corner)
   - **Blocking notifications**: For sensitive data (center screen, requires action)
   - **"🔄 Replace Text" button**: Replaces text directly in AI apps (NEW!)
   - **Copy button works**: Copies enhanced prompt to clipboard
   - **Scrollable content**: All sections properly scrollable
   - **Analysis & insights**: Shows intent, quality scores, improvements

5. **Manual Prompt Testing**
   - Built-in prompt tester in the UI
   - Test prompts without typing in external apps
   - Example prompts for quick testing
   - Copies enhanced prompts to clipboard automatically

## 🚀 **How Real-time Input Monitoring Works:**

### Prerequisites:
1. **Accessibility Permissions Required**: System Preferences > Security & Privacy > Accessibility
2. **ChatGPT Desktop or Claude Desktop** must be installed and running
3. **Complyze Desktop Agent** must be running with monitoring enabled

### The Process:
1. **You start typing** in ChatGPT or Claude desktop app
2. **Complyze monitors the text field** every 2 seconds using AppleScript
3. **When prompt indicators are detected**, Complyze processes the text
4. **Notification appears** with enhanced prompt and analysis
5. **Click "🔄 Replace Text"** to update the text in the AI app automatically
6. **Or copy the enhanced prompt** manually if preferred

### Expected Behavior:
- ✅ **Real-time detection** as you type in AI apps
- ✅ **Enhanced prompts** with AI best practices
- ✅ **Sensitive data removal** (emails, SSNs, credit cards)
- ✅ **Direct text replacement** in the AI app
- ✅ **Quality and clarity improvements**
- ✅ **Intent detection and optimization**

## 🔧 **How to Enable:**

### Step 1: Grant Accessibility Permissions
```bash
# Open System Preferences
open "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"
```

### Step 2: Add Complyze to Accessibility List
1. Click the lock icon and enter your password
2. Click the "+" button to add an application
3. Navigate to and select "Complyze Desktop Agent"
4. Make sure the checkbox next to it is checked

### Step 3: Restart Complyze
- Quit and restart the Complyze Desktop Agent
- You should see "AI app input monitoring started" in the logs

## 🧪 **Testing the New Feature:**

### Method 1: Run Test Script
```bash
node test-input-monitoring.js
```

### Method 2: Manual Testing
1. **Open ChatGPT Desktop or Claude Desktop**
2. **Click in the text input field**
3. **Start typing**: "Please explain how machine learning works"
4. **Watch for notification popup** with enhanced prompt
5. **Click "🔄 Replace Text"** to see the text update in the AI app

### Method 3: Test with Sensitive Data
1. **Type**: "Help me with my email john@company.com and SSN 123-45-6789"
2. **Expected**: Blocking notification with sensitive data removed
3. **Test "🔄 Replace Text"** to see clean version in the AI app

## 🎯 **Key Features:**

### New Notification Buttons:
- **🔄 Replace Text**: Updates text directly in the AI app (NEW!)
- **📋 Copy button**: Copies enhanced prompt to clipboard
- **✨ Use Optimized**: Copies enhanced prompt and closes notification
- **📋 Keep Original**: Keeps original content unchanged

### Enhanced Monitoring:
- **Real-time text field monitoring** in AI apps
- **Prompt indicator detection** as you type
- **Sensitive data protection** in real-time
- **Direct text replacement** capability
- **Accessibility API integration**

## 🚨 **Important Notes:**

### Accessibility Permissions:
- **Required for input monitoring** - without them, only clipboard monitoring works
- **Secure and private** - only monitors text in AI apps, not system-wide
- **Can be revoked anytime** in System Preferences

### Supported Apps:
- ✅ **ChatGPT Desktop** (official OpenAI app)
- ✅ **Claude Desktop** (official Anthropic app)
- ✅ **Any app with "chatgpt", "claude", or "openai" in the name**

### Fallback Options:
- **Clipboard monitoring** still works without accessibility permissions
- **Manual prompt tester** always available in the UI
- **App detection** works without accessibility permissions

## 🎉 **Success Criteria:**

✅ Real-time input monitoring detects typing in AI apps
✅ Enhanced prompts appear as you type
✅ "Replace Text" button updates text in AI apps
✅ Sensitive data is removed automatically
✅ Copy button works for manual copying
✅ Notifications are informative and actionable
✅ System respects privacy and security
✅ Fallback options work without permissions

## 💡 **Recommended Workflow:**

### With Accessibility Permissions (NEW!):
1. **Open ChatGPT or Claude Desktop**
2. **Start typing your prompt** in the text field
3. **Complyze detects and enhances automatically**
4. **Click "🔄 Replace Text"** to use the enhanced version
5. **Submit the enhanced prompt**

### Without Accessibility Permissions (Fallback):
1. **Write your prompt** in any text editor or the built-in tester
2. **Copy to clipboard** (Ctrl/Cmd+C)
3. **Complyze processes automatically** and shows enhanced version
4. **Copy the enhanced prompt** from the notification
5. **Paste into AI app** and submit

This new feature makes Complyze much more powerful and user-friendly by eliminating the need for the clipboard workflow when accessibility permissions are granted!

## 🚀 **How to Test:**

### Method 1: Start the App
```bash
npm run electron
```

### Method 2: Test Real-time Input Monitoring (NEW!)
```bash
node test-input-monitoring.js
```

### Method 3: Test Clipboard Monitoring
```bash
node test-clipboard-simple.js
```

### Method 4: Manual Testing
1. Click "Show Prompt Tester" in the app
2. Enter any prompt in the text area
3. Click "✨ Enhance Prompt"
4. Watch the notification popup with enhanced version

### Method 5: App Switch Detection
1. Start Complyze Desktop Agent
2. Open ChatGPT Desktop or Claude Desktop
3. Switch to the AI app
4. Watch for workflow reminder notification

## 🔧 **Key Features:**

### Notification Popup Buttons:
- **📋 Copy button**: Copies enhanced prompt to clipboard (works properly)
- **✨ Use Optimized**: Copies enhanced prompt and closes notification
- **📋 Keep Original**: Keeps original content unchanged
- **Dismiss**: Closes non-blocking notifications
- **View Dashboard**: Opens Complyze dashboard

### Enhanced App Detection:
- Detects when ChatGPT Desktop or Claude Desktop is running
- **NEW**: Detects when you switch to AI apps (requires accessibility permissions)
- Shows workflow reminder notifications
- Updates "Active Apps" count in real-time
- Enhanced process matching for better detection

### Manual Prompt Tester:
- **NEW**: Built-in prompt testing interface
- Example prompts for quick testing
- Automatic clipboard copying
- Real-time enhancement demonstration

### Clipboard Enhancement:
- **All prompts trigger notifications** (not just sensitive ones)
- Enhanced prompts follow AI best practices
- Removes sensitive data completely (no [REDACTED] placeholders)
- Shows quality and clarity score improvements
- Provides intent detection and optimization reasoning

## 📋 **Expected Behavior:**

### For Simple Prompts:
- ✅ Non-blocking notification (top-right)
- ✅ Enhanced prompt with AI best practices
- ✅ Analysis & insights section
- ✅ Auto-closes after 15 seconds
- ✅ Copy button works

### For Sensitive Data:
- ✅ Blocking notification (center screen)
- ✅ Enhanced prompt with sensitive data removed
- ✅ Shows what sensitive data was detected
- ✅ Requires user action (doesn't auto-close)
- ✅ Copy button works

### For App Detection:
- ✅ Detects ChatGPT Desktop and Claude Desktop
- ✅ **NEW**: Shows notification when you switch to AI apps
- ✅ Provides workflow reminders
- ✅ Updates UI with active app count
- ✅ Enhanced process matching

### For Manual Testing:
- ✅ **NEW**: Built-in prompt tester interface
- ✅ Example prompts for quick testing
- ✅ Automatic enhancement and clipboard copying
- ✅ Real-time demonstration of capabilities

## 🎯 **Recommended Workflow:**

### For ChatGPT/Claude Desktop Users:
1. **Write your prompt** in any text editor or the built-in tester
2. **Copy to clipboard** (Ctrl/Cmd+C)
3. **Complyze processes automatically** and shows enhanced version
4. **Copy the enhanced prompt** from the notification
5. **Paste into ChatGPT/Claude** and submit

### Why This Works Better:
- ✅ **Full protection** from sensitive data leaks
- ✅ **Enhanced prompts** with AI best practices
- ✅ **Quality improvements** and insights
- ✅ **Works with any AI app** (not just desktop versions)
- ✅ **Respects privacy** (no keylogging or app injection)

## 🔍 **Monitoring Status:**

Check the UI for:
- **Input Monitoring**: Should show "Active" when accessibility permissions are granted
- **Clipboard Monitor**: Should show "Active"
- **Active Apps**: Shows count of detected AI apps
- **Recent Activity**: Shows processed prompts
- **Accessibility**: Grant permissions for enhanced app detection and input monitoring

## ⚡ **Performance:**

- Input monitoring runs every 2 seconds (responsive but not intrusive)
- Clipboard monitoring runs every 1 second (responsive)
- Only processes text changes in AI apps
- Lightweight notifications
- Active window monitoring (with permissions)
- Built-in prompt testing interface

## 🎉 **Final Success Criteria:**

✅ **Real-time input monitoring** detects typing in ChatGPT/Claude Desktop
✅ **"🔄 Replace Text" button** updates text directly in AI apps
✅ **Clipboard monitoring** detects all prompts
✅ **Enhanced prompts** are intelligent and useful
✅ **Copy button** works in notifications
✅ **App detection** works for ChatGPT/Claude Desktop
✅ **App switch detection** with workflow reminders
✅ **Manual prompt testing** interface works
✅ **Notifications** are informative and actionable
✅ **System** is responsive and lightweight
✅ **Privacy-respecting** accessibility API usage
✅ **Fallback options** work without permissions 