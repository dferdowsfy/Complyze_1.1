# Real-Time Prompt Sync Implementation

This document outlines the complete implementation of real-time prompt syncing from the Chrome extension to the Supabase backend and dashboard.

## Overview

The system captures prompts from LLM platforms (ChatGPT, Claude, Gemini), analyzes them for sensitive data, generates optimized versions, and syncs everything to the dashboard in real-time.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌──────────────┐
│ Chrome Extension│────▶│ Background Script│────▶│ API Endpoint    │────▶│  Supabase    │
│ (Content Script)│     │ (Analysis + AI)  │     │ /prompt_events  │     │  Database    │
└─────────────────┘     └──────────────────┘     └─────────────────┘     └──────┬───────┘
                                                                                    │
                                                                                    ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Dashboard UI  │◀────│ PromptEventsPanel│◀────│ Real-time Sub   │◀────│  Supabase    │
│   (Live Feed)   │     │   Component      │     │   (WebSocket)   │     │  Real-time   │
└─────────────────┘     └──────────────────┘     └─────────────────┘     └──────────────┘
```

## Key Components

### 1. Chrome Extension - Content Script (`complyze-extension-v2/content.js`)

**Responsibilities:**
- Monitors input fields on LLM platforms
- Detects prompt submission events
- Captures current LLM model being used
- Sends prompt data to background script

**Key Features:**
```javascript
// Model detection for accurate cost calculation
detectCurrentModel() {
  // Detects GPT-4, Claude Sonnet/Opus, Gemini Pro, etc.
}

// Prompt submission handling
handlePromptSubmission(selectors) {
  // Captures prompt text
  // Detects model
  // Sends to background for analysis
}
```

### 2. Background Script (`complyze-extension-v2/background.js`)

**Responsibilities:**
- Authenticates user
- Performs local sensitive data analysis
- Calls AI (Google Gemini 2.5 Pro) for optimization
- Syncs events to Supabase

**Key Features:**
```javascript
// Enhanced prompt analysis with AI
async handlePromptAnalysis(promptData, tabId) {
  // 1. Check authentication
  // 2. Analyze for sensitive data
  // 3. Calculate risk level
  // 4. Generate optimized prompt via AI
  // 5. Sync to Supabase
  // 6. Show UI feedback
}

// Supabase sync with proper user ID handling
async syncPromptEventToSupabase(event) {
  // Posts to production API endpoint
  // Includes all metadata and cost calculations
}
```

### 3. API Endpoint (`complyze/src/app/api/prompt_events/route.ts`)

**Responsibilities:**
- Validates incoming prompt events
- Calculates token counts and costs
- Stores in Supabase database
- Returns success metrics

**Cost Calculation:**
```typescript
// Accurate pricing per model
const costPerThousand = {
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'claude-3-opus': { input: 0.015, output: 0.075 },
  // ... more models
};
```

### 4. Dashboard Component (`complyze/src/components/PromptEventsPanel.tsx`)

**Responsibilities:**
- Fetches initial prompt events
- Subscribes to real-time updates
- Displays prompts with risk indicators
- Shows cost savings metrics

**Real-time Subscription:**
```typescript
// Supabase real-time subscription
const channel = supabaseClient
  .channel(`prompt_events:user_id=eq.${userId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'prompt_events',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    // Add new event to UI
    // Show notification for high-risk
  });
```

## Database Schema

The `prompt_events` table includes:

```sql
CREATE TABLE prompt_events (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  original_prompt TEXT NOT NULL,
  optimized_prompt TEXT,
  timestamp TIMESTAMPTZ,
  risk_level VARCHAR(20),
  llm_used VARCHAR(50),
  platform VARCHAR(50),
  flagged BOOLEAN,
  -- Cost tracking
  original_tokens INTEGER,
  optimized_tokens INTEGER,
  tokens_saved INTEGER,
  original_cost DECIMAL(10, 6),
  optimized_cost DECIMAL(10, 6),
  cost_saved DECIMAL(10, 6),
  -- Arrays for detailed tracking
  pii_detected TEXT[],
  compliance_frameworks TEXT[],
  improvements JSONB,
  -- ... more fields
);
```

## Security Features

1. **User Authentication**: All events are tied to authenticated users
2. **Row Level Security**: Users can only see their own prompt events
3. **PII Detection**: Automatic detection and redaction of sensitive data
4. **Compliance Mapping**: Maps to NIST, HIPAA, PCI, etc. frameworks

## Real-time Flow

1. **User submits prompt** on ChatGPT/Claude/Gemini
2. **Extension captures** prompt and model info
3. **Background script**:
   - Analyzes for sensitive data
   - Generates optimized version via AI
   - Calculates costs
4. **API endpoint** stores event in Supabase
5. **Dashboard receives** real-time update via WebSocket
6. **UI updates** instantly with new prompt event

## Cost Analysis

The system automatically:
- Estimates token count (≈4 chars per token)
- Calculates cost based on model pricing
- Tracks tokens/cost saved through optimization
- Aggregates metrics for budget tracking

## Testing

### Manual Testing:
1. Install the Chrome extension
2. Navigate to any supported LLM platform
3. Submit a prompt containing sensitive data (email, SSN, etc.)
4. Check dashboard for real-time update

### Automated Testing:
```bash
# Run the test script
node complyze/test-prompt-sync.js
```

## Configuration

### Extension Configuration:
- API endpoint: `https://complyze.co/api/prompt_events`
- AI Model: Google Gemini 2.5 Pro via OpenRouter

### Dashboard Configuration:
- Real-time subscriptions enabled
- Polling fallback every 30 seconds
- Maximum 50 events displayed

## Troubleshooting

### Common Issues:

1. **No events appearing in dashboard**
   - Check user authentication in extension
   - Verify user ID matches between extension and dashboard
   - Check browser console for errors

2. **Real-time updates not working**
   - Ensure Supabase real-time is enabled for the table
   - Check WebSocket connection in browser network tab
   - Verify RLS policies allow user access

3. **Cost calculations incorrect**
   - Verify model detection is working
   - Check token estimation accuracy
   - Update pricing table if needed

## Future Enhancements

1. **Batch Processing**: Queue multiple prompts for efficient syncing
2. **Offline Support**: Store prompts locally when offline
3. **Analytics Dashboard**: Advanced visualizations and trends
4. **Export Features**: Download prompt history as CSV/PDF
5. **Team Features**: Share prompt insights across teams