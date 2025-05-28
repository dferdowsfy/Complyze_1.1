# Netlify Deployment Guide for Complyze

## Prerequisites
- Netlify account
- GitHub repository with your Complyze code
- Supabase project set up with the database schema

## Step 1: Connect Your Repository to Netlify

1. Log in to your [Netlify dashboard](https://app.netlify.com/)
2. Click "New site from Git"
3. Choose GitHub and authorize Netlify to access your repository
4. Select your Complyze repository
5. Configure build settings:
   - **Base directory**: `complyze`
   - **Build command**: `npm install && npm run build`
   - **Publish directory**: `complyze/.next`

## Step 2: Set Environment Variables

Go to your site's dashboard in Netlify, then navigate to **Site settings > Environment variables**.

Add the following environment variables:

### Required Variables

| Variable Name | Value | Notes |
|---------------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://likskioavtpnskrfxbqa.supabase.co` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Your Supabase anon key (see environment-variables.txt) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Your Supabase service role key (see environment-variables.txt) |
| `OPENROUTER_API_KEY` | `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` | Your OpenRouter API key |
| `NEXT_PUBLIC_SITE_URL` | `https://your-actual-domain.netlify.app` | Replace with your actual Netlify domain |
| `NODE_ENV` | `production` | Set environment to production |

### How to Add Each Variable

1. Click "Add variable"
2. Enter the variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
3. Enter the value
4. Click "Create variable"
5. Repeat for all variables

## Step 3: Deploy Your Site

1. After setting all environment variables, trigger a new deployment:
   - Go to **Deploys** tab
   - Click "Trigger deploy" > "Deploy site"

2. Monitor the build process in the deploy log

## Step 4: Update Your Domain

1. Once deployed, note your Netlify domain (e.g., `amazing-app-123456.netlify.app`)
2. Update the `NEXT_PUBLIC_SITE_URL` environment variable with your actual domain
3. Redeploy the site

## Step 5: Test Your Deployment

1. Visit your deployed site
2. Test the login/signup functionality
3. Verify the Chrome extension can connect to your deployed API
4. Check that all features work as expected

## Troubleshooting

### Build Fails
- Check the build log for specific errors
- Ensure all environment variables are set correctly
- Verify your `netlify.toml` configuration
- **Missing Dependencies**: If you see "Module not found" errors, ensure all required packages are in `package.json`:
  - `@supabase/supabase-js` for database connectivity
  - `framer-motion` for animations
  - Run `npm install` locally to verify all dependencies resolve

### Database Connection Issues
- Verify Supabase environment variables are correct
- Check that your Supabase database has the correct schema
- Ensure RLS policies are properly configured

### API Errors
- Check that `OPENROUTER_API_KEY` is valid
- Verify CORS settings in your Next.js configuration
- Check browser console for specific error messages

### Chrome Extension Issues
- Update the extension's manifest to include your production domain
- Ensure the extension is pointing to the correct API endpoints

## Security Considerations

1. **Rotate API Keys**: Consider rotating your OpenRouter API key for security
2. **Monitor Usage**: Keep an eye on your Supabase and OpenRouter usage
3. **Environment Variables**: Never commit sensitive keys to your repository
4. **HTTPS**: Ensure your site is served over HTTPS (Netlify does this automatically)

## Custom Domain (Optional)

To use a custom domain:
1. Go to **Site settings > Domain management**
2. Click "Add custom domain"
3. Follow the DNS configuration instructions
4. Update `NEXT_PUBLIC_SITE_URL` to your custom domain

## Continuous Deployment

Your site will automatically redeploy when you push changes to your main branch. To disable this:
1. Go to **Site settings > Build & deploy**
2. Under "Build settings", click "Edit settings"
3. Toggle "Auto publishing" off

---

## Quick Reference: Environment Variables

Copy these exact values to your Netlify environment variables (get the full values from `complyze/environment-variables.txt`):

```
NEXT_PUBLIC_SUPABASE_URL=https://likskioavtpnskrfxbqa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[full key from environment-variables.txt]
SUPABASE_SERVICE_ROLE_KEY=[full key from environment-variables.txt]
OPENROUTER_API_KEY=[full key from environment-variables.txt]
NEXT_PUBLIC_SITE_URL=https://your-domain.netlify.app
NODE_ENV=production
```

Replace `your-domain` with your actual Netlify subdomain. 