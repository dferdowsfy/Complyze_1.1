# Redaction Settings Implementation

This document describes the implementation of the redaction settings feature for the Complyze dashboard.

## Overview

The redaction settings page allows users to configure which types of sensitive information should be automatically redacted from their prompts. Users can enable/disable redaction for specific categories and items, with disabled items being wrapped in asterisks (*) for visibility while maintaining some privacy.

## Features Implemented

### ✅ Core Features
- **Comprehensive Redaction Categories**: 7 main categories with 30+ specific items
- **Toggle Controls**: Individual toggle switches for each redaction item
- **Category-Level Controls**: Toggle entire categories on/off
- **Custom Terms**: Support for user-defined custom redaction terms
- **Database Integration**: Full CRUD operations with Supabase
- **Chrome Extension Sync**: Automatic sync with browser extension
- **Responsive Design**: Mobile-friendly interface
- **Real-time Feedback**: Loading states, error handling, and success notifications

### 🗂️ Redaction Categories

1. **PII (Personally Identifiable Information)**
   - Name, Email, Phone Number, Address, SSN, Passport Number, IP Address

2. **Credentials & Secrets**
   - API Keys, OAuth Tokens, SSH Keys, Vault Paths, Access Tokens

3. **Company Internal**
   - Internal URLs, Project Codenames, Internal Tools, System IP Ranges

4. **AI Model & Dataset Leakage**
   - Model Names, Training Data References, Fine-tuned Logic, Private Weights or Output

5. **Regulated Info**
   - PHI (HIPAA), Financial Records, Export-Controlled Terms (ITAR), Whistleblower IDs

6. **Jailbreak Patterns**
   - "Ignore previous instructions", "Simulate a developer mode", "Repeat after me..."

7. **Other**
   - Custom-defined terms (with manual entry)

## File Structure

```
complyze/
├── src/app/
│   ├── api/governance/redaction-settings/
│   │   └── route.ts                    # API endpoints for CRUD operations
│   └── dashboard/settings/
│       └── page.tsx                    # Main settings page component
├── src/lib/
│   └── supabaseClient.ts              # Updated with RedactionSettings interface
├── database-setup.sql                 # SQL script for Supabase setup
└── REDACTION-SETTINGS-README.md       # This documentation
```

## API Endpoints

### GET `/api/governance/redaction-settings`
Fetches user's redaction settings.

**Parameters:**
- `user_id` (query parameter): User identifier

**Response:**
```json
{
  "categories": {
    "PII": ["Name", "Email", ...],
    "Credentials & Secrets": [...]
  },
  "settings": {
    "PII.Name": true,
    "PII.Email": false,
    ...
  }
}
```

### POST `/api/governance/redaction-settings`
Updates user's redaction settings.

**Body:**
```json
{
  "user_id": "user_123",
  "settings": {
    "PII.Name": true,
    "PII.Email": false,
    ...
  }
}
```

## Database Schema

### RedactionSettings Table
```sql
CREATE TABLE RedactionSettings (
  user_id TEXT NOT NULL,
  item_key TEXT NOT NULL,         -- e.g., "PII.Name"
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, item_key)
);
```

## Setup Instructions

### 1. Database Setup
Run the SQL script in your Supabase SQL editor:
```bash
# Execute the contents of database-setup.sql in Supabase
```

### 2. Environment Variables
Ensure your Supabase credentials are configured in your environment:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Chrome Extension Integration
The settings page automatically sends updates to the Chrome extension:
```javascript
chrome.runtime.sendMessage({
  action: 'updateRedactionPolicy',
  user_id: currentUser,
  settings: { "PII.Name": false, "Credentials.API Keys": true, ... }
});
```

## UI Components

### ToggleSwitch
Reusable toggle switch component with proper accessibility and styling.

### CategorySection
Expandable category sections with:
- Category-level toggle (enables/disables all items in category)
- Individual item toggles
- Item count display
- Custom terms input for "Other" category

### Quick Actions Panel
Bulk operations:
- Expand/Collapse All Categories
- Enable/Disable All Redaction

## Redaction Logic

### Enabled Items
- Completely redacted: `[REDACTED]`
- Used for highly sensitive information

### Disabled Items
- Wrapped in asterisks: `*Name*`
- Provides visibility while maintaining some privacy
- Useful for debugging and context preservation

## Error Handling

- **Loading States**: Spinner and loading messages
- **Error Display**: User-friendly error messages with retry options
- **Success Feedback**: Confirmation messages with timestamps
- **Graceful Degradation**: Chrome extension sync failures are logged but don't break the UI

## Security Considerations

- **Row Level Security (RLS)**: Users can only access their own settings
- **Input Validation**: All inputs are validated on both client and server
- **SQL Injection Prevention**: Parameterized queries used throughout
- **CORS Protection**: API endpoints properly configured

## Testing

### Manual Testing Checklist
- [ ] Load settings page - should display all categories
- [ ] Toggle individual items - should update immediately
- [ ] Toggle entire categories - should enable/disable all items
- [ ] Save settings - should persist to database
- [ ] Reload page - should load saved settings
- [ ] Custom terms - should save and load properly
- [ ] Error scenarios - should display appropriate messages

### Test Data
Use the test user `user_123` with sample data inserted by the setup script.

## Future Enhancements

### Potential Improvements
1. **Import/Export Settings**: Allow users to backup and restore configurations
2. **Templates**: Pre-defined setting templates for different industries
3. **Advanced Patterns**: Regex-based custom redaction patterns
4. **Audit Trail**: Track when settings were changed
5. **Team Settings**: Organization-level default settings
6. **Real-time Preview**: Show how prompts would be redacted with current settings

### Performance Optimizations
1. **Caching**: Cache settings in localStorage for faster loading
2. **Debounced Saves**: Batch multiple changes into single API calls
3. **Lazy Loading**: Load categories on-demand for large configurations

## Troubleshooting

### Common Issues

**Settings not loading:**
- Check Supabase connection
- Verify user_id is correct
- Check browser console for errors

**Chrome extension not syncing:**
- Ensure extension is installed and active
- Check for Chrome runtime errors
- Verify message format matches extension expectations

**Database errors:**
- Run database setup script
- Check RLS policies
- Verify user permissions

### Debug Mode
Enable debug logging by adding to localStorage:
```javascript
localStorage.setItem('complyze_debug', 'true');
```

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify database setup and permissions
3. Test with the provided sample data
4. Review the API response format

---

**Last Updated:** January 2024
**Version:** 1.0.0 