# Complyze Setup Guide

## Database Setup

### 1. Supabase Configuration

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database-schema.sql` into the SQL editor
4. Run the SQL to create all necessary tables and policies

### 2. Environment Variables

The Supabase credentials are already configured in `src/lib/supabaseClient.ts`:
- **Supabase URL**: `https://likskioavtpnskrfxbqa.supabase.co`
- **Anon Key**: Already configured
- **Service Role Key**: Already configured

## API Endpoints

The following endpoints are now available:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration  
- `GET /api/auth/check` - Check authentication status

### Prompt Processing
- `POST /api/prompts/ingest` - Log prompts to database
- `POST /api/prompts/redact` - Redact PII from prompts
- `POST /api/prompts/optimize` - Optimize prompt quality
- `POST /api/analyze` - Comprehensive prompt analysis

## Chrome Extension Setup

### 1. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `complyze-extension-v2` folder
5. The extension should now appear in your extensions list

### 2. Test the Extension

1. Go to https://chatgpt.com or https://claude.ai
2. The extension icon should appear in your browser toolbar
3. Click the extension icon to open the popup
4. You'll see a login/signup interface

### 3. Create a Test Account

1. Click "Sign Up" in the extension popup
2. Enter your email, password, and optionally your name
3. Click "Sign Up" - this will create your account in Supabase
4. Switch to the "Login" tab and log in with your credentials

### 4. Test Prompt Analysis

1. After logging in, go to ChatGPT or Claude
2. Type a prompt that contains some PII (like "My email is test@example.com")
3. Submit the prompt
4. The extension should capture it and show analysis results

## Development Server

Make sure your Next.js development server is running on port 3007:

```bash
cd complyze
npm run dev
```

The server should be accessible at `http://localhost:3007`

## Database Schema

The database includes these main tables:

### `users`
- User profiles linked to Supabase Auth
- Stores plan information and metadata

### `projects` 
- Each user gets a default project
- Can be extended for multi-project support

### `prompt_logs`
- Stores all captured prompts
- Includes original, redacted, and optimized versions
- Risk scores and compliance mappings

### `governance_settings`
- Project-specific compliance settings
- Framework configurations (NIST, OWASP, etc.)

## Testing the Full Flow

1. **Setup Database**: Run the SQL schema in Supabase
2. **Start Server**: `npm run dev` in the complyze folder
3. **Load Extension**: Load unpacked extension in Chrome
4. **Create Account**: Sign up through the extension popup
5. **Test Capture**: Submit a prompt on ChatGPT/Claude
6. **View Results**: Check the extension popup for analysis
7. **Check Dashboard**: Visit `http://localhost:3007/dashboard` to see logged prompts

## Troubleshooting

### Extension Not Working
- Check that the development server is running on port 3007
- Verify the extension is loaded and enabled
- Check browser console for errors

### Authentication Issues
- Verify Supabase credentials are correct
- Check that the database schema was created successfully
- Ensure RLS policies are properly configured

### Database Connection Issues
- Verify Supabase project is active
- Check that the service role key has proper permissions
- Ensure the database URL is correct

## Next Steps

Once the basic setup is working, you can:

1. **Add More Platforms**: Extend the extension to work with additional LLM platforms
2. **Enhance Analysis**: Improve the prompt analysis algorithms
3. **Build Dashboard**: Create a comprehensive dashboard for viewing analytics
4. **Add Integrations**: Connect with compliance tools and frameworks
5. **Implement Teams**: Add multi-user and team functionality 