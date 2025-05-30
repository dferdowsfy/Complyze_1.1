# Complyze Web Dashboard

**Next.js-powered AI governance dashboard with mobile-responsive design**

The Complyze Web Dashboard is a modern, responsive web application that provides centralized management and analytics for your AI governance program. Built with Next.js 14, it offers real-time insights into AI usage, risk assessment, and compliance reporting.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3-cyan)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

## 📋 Table of Contents

- [🎯 Features](#features)
- [📱 Mobile Responsive Design](#mobile-responsive-design)
- [🏗️ Architecture](#architecture)
- [🛠️ Setup & Installation](#setup--installation)
- [⚙️ Configuration](#configuration)
- [📄 Pages & Components](#pages--components)
- [🔗 API Integration](#api-integration)
- [📊 Analytics Features](#analytics-features)
- [📋 Compliance Reporting](#compliance-reporting)
- [🎨 UI/UX Design](#uiux-design)
- [🚀 Deployment](#deployment)
- [🧪 Testing](#testing)
- [📚 Documentation](#documentation)

## 🎯 Features

### **Core Functionality**
- **Real-time Dashboard**: Live analytics and metrics
- **Cost Tracking**: Monitor LLM usage and spending
- **Risk Analytics**: Visualize prompt risk trends
- **Compliance Reports**: Generate framework-specific documentation
- **User Management**: Configure redaction policies
- **Mobile Responsive**: Optimized for all devices

### **Authentication & Security**
- **Secure Login**: Email/password authentication
- **Session Management**: JWT-based auth with Supabase
- **Role-based Access**: User permissions and access control
- **Data Protection**: Encrypted data transmission

### **Analytics & Intelligence**
- **Prompt Integrity Scoring**: ML-powered risk assessment
- **Risk Type Frequency**: Categorized threat analysis
- **Trend Analysis**: Historical data visualization
- **Cost Summary**: Budget tracking and optimization
- **Flagged Prompts**: Real-time security alerts

## 📱 Mobile Responsive Design

The dashboard is fully optimized for mobile devices with progressive enhancement:

### **Responsive Breakpoints**
- **Mobile**: `< 640px` (sm)
- **Tablet**: `640px - 1024px` (md/lg)
- **Desktop**: `> 1024px` (xl)

### **Mobile Optimizations**
- **Navigation**: Collapsible menu with touch-friendly targets
- **Cards**: Stacked layout on mobile, grid on desktop
- **Typography**: Scalable text sizes (`text-sm sm:text-base lg:text-lg`)
- **Spacing**: Responsive padding and margins
- **Tables**: Horizontal scroll for data tables
- **Forms**: Touch-optimized input fields

### **Key Mobile Features**
```tsx
// Example responsive classes
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
className="text-sm sm:text-base lg:text-lg"
className="px-4 sm:px-6 lg:px-8"
```

## 🏗️ Architecture

### **Technology Stack**
```json
{
  "framework": "Next.js 14",
  "runtime": "React 18",
  "language": "TypeScript",
  "styling": "Tailwind CSS",
  "database": "Supabase",
  "deployment": "Netlify/Vercel",
  "analytics": "Custom dashboard"
}
```

### **Project Structure**
```
src/
├── app/                     # Next.js App Router
│   ├── page.tsx            # Landing page
│   ├── dashboard/          # Dashboard pages
│   │   ├── page.tsx        # Main dashboard
│   │   ├── reports/        # Compliance reports
│   │   └── settings/       # Configuration
│   └── api/                # API routes
│       ├── analytics/      # Analytics endpoints
│       ├── auth/           # Authentication
│       ├── governance/     # Policy management
│       └── reports/        # Report generation
├── components/             # Reusable components
│   └── ui/                # UI component library
└── lib/                   # Utilities and config
    ├── supabaseClient.ts  # Database client
    └── utils.ts           # Helper functions
```

## 🛠️ Setup & Installation

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Git

### **Installation Steps**

1. **Clone and Install**
```bash
git clone <repository-url>
cd complyze
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env.local
```

3. **Configure Environment Variables**
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenRouter API (for LLM-powered reports)
OPENROUTER_API_KEY=your_openrouter_api_key

# Optional Analytics
NEXT_PUBLIC_GA_ID=your_google_analytics_id
```

4. **Database Setup**
```bash
# Run Supabase migrations (if applicable)
npx supabase db push
```

5. **Start Development Server**
```bash
npm run dev
```

## ⚙️ Configuration

### **Supabase Setup**

1. **Create Supabase Project**
   - Visit [supabase.com](https://supabase.com)
   - Create new project
   - Note your project URL and API keys

2. **Database Schema**
```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flagged prompts table
CREATE TABLE flagged_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    prompt_text TEXT NOT NULL,
    risk_level TEXT CHECK (risk_level IN ('High', 'Medium', 'Low')),
    frameworks TEXT[],
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Redaction settings table
CREATE TABLE redaction_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    category TEXT NOT NULL,
    item TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **OpenRouter Configuration**

For AI-powered compliance reports:

1. **Get API Key**
   - Visit [openrouter.ai](https://openrouter.ai)
   - Create account and generate API key
   - Add to environment variables

2. **Model Selection**
```typescript
const PREFERRED_MODELS = [
  'anthropic/claude-3-opus',
  'openai/gpt-4-turbo',
  'google/gemini-pro'
];
```

## 📄 Pages & Components

### **Main Dashboard** (`/dashboard`)
```tsx
// Key components:
- CostSummaryPanel: Budget tracking and top prompts
- PromptIntegrityScoreCard: Risk assessment visualization
- RiskTypeFrequencyCard: Threat categorization
- PromptRiskTrendsCard: Historical trend analysis
- FlaggedPromptsPanel: Real-time security alerts
```

### **Reports Page** (`/dashboard/reports`)
```tsx
// Features:
- Template-based report generation
- Framework-specific compliance docs
- Export to PDF, Word, JSON
- Date range filtering
- Real-time preview
```

### **Settings Page** (`/dashboard/settings`)
```tsx
// Configuration options:
- Redaction policy management
- Category-based toggles
- Custom term definitions
- Auto-save functionality
- Chrome extension sync
```

### **Responsive Navigation**
```tsx
// Mobile-optimized navigation
<nav className="flex flex-col sm:flex-row px-4 sm:px-8 py-3 sm:py-5">
  <div className="flex items-center justify-between sm:justify-start">
    <span className="text-xl sm:text-2xl">COMPLYZE</span>
  </div>
  <div className="flex gap-4 sm:gap-8 mt-3 sm:mt-0">
    <Link href="/dashboard">Dashboard</Link>
    <Link href="/dashboard/reports">Reports</Link>
    <Link href="/dashboard/settings">Settings</Link>
  </div>
</nav>
```

## 🔗 API Integration

### **Analytics Endpoints**
```typescript
// Cost summary data
GET /api/analytics/cost-summary?user_id=&budget=

// Prompt integrity metrics
GET /api/analytics/integrity

// Risk type frequency
GET /api/analytics/risk-types

// Trend analysis
GET /api/analytics/trends
```

### **Authentication API**
```typescript
// User registration
POST /api/auth/signup
{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe"
}

// User login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "securepassword"
}

// Session validation
GET /api/auth/check
```

### **Governance API**
```typescript
// Get redaction settings
GET /api/governance/redaction-settings?user_id=

// Update redaction settings
POST /api/governance/redaction-settings
{
  "user_id": "uuid",
  "settings": {
    "PII.Email": true,
    "Credentials.API Keys": false
  }
}
```

## 📊 Analytics Features

### **Cost Summary Panel**
- **Budget Tracker**: Visual progress with percentage
- **Top Prompts**: Most expensive prompts by cost
- **Most Used Model**: Primary LLM platform
- **Total Spend**: Monthly expenditure tracking

### **Risk Analytics**
- **Integrity Score**: 0-100 risk assessment
- **Risk Distribution**: High/Medium/Low categorization  
- **Trend Analysis**: 7-day historical data
- **Frequency Mapping**: Risk type occurrence

### **Real-time Updates**
```typescript
// Auto-refresh mechanism
useEffect(() => {
  const interval = setInterval(fetchAnalytics, 30000); // 30s
  return () => clearInterval(interval);
}, []);
```

## 📋 Compliance Reporting

### **Supported Frameworks**
- **NIST AI Risk Management Framework**
- **FedRAMP Continuous Monitoring**
- **SOC 2 Type II Evidence**
- **OWASP LLM Top 10**
- **ISO 27001 Controls**

### **Report Generation**
```typescript
// Generate compliance report
POST /api/reports/generate
{
  "template": "nist-ai-rmf-profile",
  "dateRange": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "project": "Complyze AI Compliance",
  "format": "sections"
}
```

### **Export Formats**
- **PDF**: Executive summaries with charts
- **Word**: Collaborative editing format
- **JSON**: Structured data for integration
- **Share Links**: Temporary access URLs

## 🎨 UI/UX Design

### **Design System**
```css
/* Color Palette */
:root {
  --bg-primary: #0E1E36;        /* Navy blue background */
  --accent: #FF6F3C;            /* Orange accent */
  --risk-high: #E53935;         /* Red for high risk */
  --risk-medium: #FBC02D;       /* Yellow for medium risk */
  --risk-low: #388E3C;          /* Green for low risk */
  --card-bg: #FFFFFF;           /* White cards */
  --text-primary: #0E1E36;      /* Dark text */
  --text-secondary: #6B7280;    /* Gray text */
}
```

### **Typography Scale**
```css
/* Responsive typography */
.text-responsive {
  @apply text-sm sm:text-base lg:text-lg;
}

.heading-responsive {
  @apply text-xl sm:text-2xl lg:text-3xl;
}
```

### **Component Library**
- **Cards**: Consistent shadow and border radius
- **Buttons**: Hover states and loading spinners  
- **Forms**: Validation and error states
- **Tables**: Responsive with horizontal scroll
- **Charts**: SVG-based visualizations

## 🚀 Deployment

### **Netlify Deployment**

1. **Build Configuration**
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

2. **Environment Variables**
Set in Netlify dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY`

### **Vercel Deployment**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### **Build Scripts**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

## 🧪 Testing

### **Development Testing**
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build validation
npm run build
```

### **Manual Testing Checklist**
- [ ] Authentication flow works
- [ ] Dashboard loads with data
- [ ] Mobile responsive on all pages
- [ ] Reports generate successfully
- [ ] Settings save correctly
- [ ] API endpoints respond
- [ ] Error handling displays

## 📚 Documentation

### **API Documentation**
- [Authentication API](./docs/auth-api.md)
- [Analytics API](./docs/analytics-api.md)
- [Governance API](./docs/governance-api.md)
- [Reports API](./docs/reports-api.md)

### **Component Documentation**
- [Dashboard Components](./docs/dashboard-components.md)
- [Form Components](./docs/form-components.md)
- [Chart Components](./docs/chart-components.md)

### **Deployment Guides**
- [Netlify Setup](../NETLIFY-DEPLOYMENT-GUIDE.md)
- [Vercel Setup](./docs/vercel-setup.md)
- [Environment Configuration](./docs/environment-setup.md)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/dashboard-improvement`)
3. Make changes with mobile responsiveness in mind
4. Test on multiple screen sizes
5. Commit changes (`git commit -m 'Improve mobile dashboard layout'`)
6. Push to branch (`git push origin feature/dashboard-improvement`)
7. Open Pull Request

## 📞 Support

- 📧 **Technical Support**: dev@complyze.ai
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/dferdowsfy/Complyze_1.1/issues)
- 📖 **Documentation**: [Wiki](https://github.com/dferdowsfy/Complyze_1.1/wiki)
- 💬 **Community**: [Discussions](https://github.com/dferdowsfy/Complyze_1.1/discussions)

---

**Built with Next.js 14 and ❤️ for enterprise AI governance**
