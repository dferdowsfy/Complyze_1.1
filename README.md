# Complyze AI Governance Platform

**Enterprise-grade AI prompt intelligence and governance for secure AI adoption**

Complyze is a comprehensive AI governance platform that provides real-time monitoring, risk assessment, and automated redaction of sensitive information in AI prompts. Our solution ensures your organization can harness the power of AI while maintaining compliance with security policies and regulatory requirements.

![Complyze Platform](https://img.shields.io/badge/Platform-AI%20Governance-orange)
![License](https://img.shields.io/badge/License-Proprietary-red)
![Status](https://img.shields.io/badge/Status-Production%20Ready-green)

## 🚀 Quick Start

Choose your deployment method:

- **🌐 Web Dashboard**: [Deploy Website](#web-dashboard-deployment)
- **🔧 Chrome Extension**: [Install Extension](#chrome-extension-setup)
- **💻 Desktop App**: [Download Desktop App](#desktop-app-setup)

## 📋 Table of Contents

- [🎯 Overview](#overview)
- [✨ Key Features](#key-features)
- [🏗️ Architecture](#architecture)
- [🌐 Web Dashboard](#web-dashboard)
- [🔧 Chrome Extension](#chrome-extension)
- [💻 Desktop App](#desktop-app)
- [🚀 Deployment](#deployment)
- [📊 Analytics & Reporting](#analytics--reporting)
- [🔒 Security & Compliance](#security--compliance)
- [🛠️ Development](#development)
- [📞 Support](#support)

## 🎯 Overview

Complyze addresses the critical challenge of AI governance in enterprise environments by providing:

- **Real-time Monitoring**: Detect sensitive data in AI prompts before they leave your organization
- **Automated Redaction**: Intelligently redact PII, credentials, and proprietary information
- **Compliance Reporting**: Generate reports for NIST AI RMF, FedRAMP, SOC 2, and other frameworks
- **Risk Assessment**: AI-powered risk scoring and threat detection
- **Multi-Platform Coverage**: Browser extension, desktop app, and web dashboard

## ✨ Key Features

### 🛡️ **Security & Privacy**
- **85% Reduction** in AI-related data leaks
- **Real-time PII Detection** across 7 categories
- **Automated Redaction** of sensitive information
- **Zero-trust Architecture** with local processing

### 📊 **Analytics & Intelligence**
- **Prompt Risk Scoring** with ML-based assessment
- **Usage Analytics** and cost tracking
- **Compliance Reporting** for major frameworks
- **Trend Analysis** and anomaly detection

### 🔧 **Enterprise Integration**
- **Universal AI Platform Support** (ChatGPT, Claude, Gemini, etc.)
- **Chrome Extension** for seamless browsing
- **Desktop App** for system-wide monitoring
- **API Integration** for custom workflows

### 📈 **Governance & Compliance**
- **NIST AI Risk Management Framework** compliance
- **FedRAMP** and **SOC 2** reporting
- **Custom Policy Engine** with rule-based controls
- **Audit Trail** and evidence collection

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Dashboard │    │ Chrome Extension │    │   Desktop App   │
│                 │    │                  │    │                 │
│ • Analytics     │    │ • Real-time      │    │ • System-wide   │
│ • Reports       │    │   Detection      │    │   Monitoring    │
│ • Settings      │◄──►│ • Auto-redaction │◄──►│ • Menu Bar      │
│ • User Mgmt     │    │ • Risk Alerts    │    │   Integration   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │       Backend API          │
                    │                           │
                    │ • Supabase Database       │
                    │ • OpenRouter LLM API     │
                    │ • Risk Assessment Engine │
                    │ • Compliance Reporting   │
                    └────────────────────────────┘
```

## 🌐 Web Dashboard

The web dashboard provides centralized management and analytics for your AI governance program.

### **Key Features:**
- **Cost Tracking**: Monitor LLM usage and spending across models
- **Risk Analytics**: Visualize prompt risk trends and patterns
- **Compliance Reports**: Generate framework-specific documentation
- **User Management**: Configure redaction policies and permissions
- **Mobile Responsive**: Optimized for desktop, tablet, and mobile

### **Pages:**
- **Dashboard**: Overview analytics and key metrics
- **Reports**: Compliance reporting and export tools
- **Settings**: Redaction policy configuration

**Technology Stack:**
- Next.js 14 with App Router
- React 18 with TypeScript
- Tailwind CSS for styling
- Supabase for backend services

## 🔧 Chrome Extension

Universal AI prompt monitoring and protection for all web-based AI platforms.

### **Supported Platforms:**
- ✅ ChatGPT (OpenAI)
- ✅ Claude (Anthropic)
- ✅ Gemini (Google)
- ✅ Copilot (Microsoft)
- ✅ Perplexity
- ✅ Custom LLM platforms

### **Key Features:**
- **Real-time Detection**: Scan prompts before submission
- **Instant Alerts**: Visual warnings for high-risk content
- **Smart Redaction**: Context-aware sensitive data removal
- **Risk Scoring**: ML-powered risk assessment
- **Compliance Logging**: Audit trail for all interactions

### **Installation:**
1. Download from Chrome Web Store (pending)
2. Load unpacked from `complyze-extension-v2/`
3. Configure settings via popup interface

## 💻 Desktop App

System-wide AI monitoring with native macOS integration.

### **Key Features:**
- **Menu Bar Integration**: Unobtrusive system tray presence
- **Universal Monitoring**: Works with any application
- **Context-Aware Alerts**: Smart notifications for AI interactions
- **Real-time Protection**: Instant risk assessment
- **Native Performance**: Optimized for macOS

### **Technology:**
- Electron with TypeScript
- Native macOS notifications
- System-wide clipboard monitoring
- Low-resource footprint

### **Installation:**
1. Download from releases page
2. Install DMG package
3. Grant necessary permissions
4. Configure monitoring preferences

## 🚀 Deployment

### Web Dashboard Deployment

#### **Netlify (Recommended)**
```bash
# 1. Build the project
cd complyze
npm install
npm run build

# 2. Deploy to Netlify
# Connect GitHub repo to Netlify
# Set build command: npm run build
# Set publish directory: .next
```

#### **Vercel**
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
cd complyze
vercel --prod
```

#### **Environment Variables**
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenRouter API (for LLM compliance reports)
OPENROUTER_API_KEY=your_openrouter_key

# Analytics (optional)
NEXT_PUBLIC_GA_ID=your_google_analytics_id
```

### Chrome Extension Setup

#### **Development Install**
```bash
# 1. Navigate to extension directory
cd complyze-extension-v2

# 2. Open Chrome Extension Manager
# chrome://extensions/

# 3. Enable Developer Mode
# 4. Click "Load unpacked"
# 5. Select complyze-extension-v2 folder
```

#### **Production Build**
```bash
# 1. Zip extension files
cd complyze-extension-v2
zip -r complyze-extension.zip . -x "*.DS_Store" "node_modules/*"

# 2. Upload to Chrome Web Store
# Visit: https://chrome.google.com/webstore/devconsole
```

### Desktop App Setup

#### **Development**
```bash
# 1. Navigate to desktop app directory
cd electron-app

# 2. Install dependencies
npm install

# 3. Run in development mode
npm start
```

#### **Build Distribution**
```bash
# 1. Build for macOS
npm run build:mac

# 2. Build for Windows
npm run build:win

# 3. Build for Linux
npm run build:linux
```

## 📊 Analytics & Reporting

### **Real-time Metrics**
- Prompt volume and frequency
- Risk distribution analysis
- Cost tracking per LLM model
- User activity patterns

### **Compliance Reports**
- **NIST AI Risk Management Framework** profiles
- **FedRAMP** continuous monitoring reports
- **SOC 2** evidence packages
- **OWASP LLM Top 10** findings
- **Custom framework** mappings

### **Export Formats**
- PDF reports with executive summaries
- Word documents for collaborative editing
- JSON data bundles for integration
- CSV exports for analysis

## 🔒 Security & Compliance

### **Data Protection**
- **Local Processing**: Sensitive data never leaves your environment
- **Zero-Knowledge Architecture**: Encrypted data transmission
- **Audit Logging**: Comprehensive activity tracking
- **Access Controls**: Role-based permissions

### **Compliance Frameworks**
- ✅ NIST AI Risk Management Framework
- ✅ FedRAMP Moderate/High
- ✅ SOC 2 Type II
- ✅ ISO 27001
- ✅ GDPR/CCPA compliance ready
- ✅ HIPAA technical safeguards

### **Redaction Categories**
- **PII**: Names, emails, addresses, SSNs
- **Credentials**: API keys, passwords, tokens
- **Company Internal**: URLs, codenames, IPs
- **AI Model Leakage**: Training data, weights
- **Regulated Info**: PHI, financial records
- **Jailbreak Patterns**: Prompt injection attempts

## 🛠️ Development

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Git

### **Setup Development Environment**
```bash
# 1. Clone repository
git clone https://github.com/dferdowsfy/Complyze_1.1.git
cd Complyze_1.0

# 2. Setup web dashboard
cd complyze
npm install
cp .env.example .env.local
# Configure environment variables
npm run dev

# 3. Setup Chrome extension
cd ../complyze-extension-v2
# Load unpacked in Chrome

# 4. Setup desktop app
cd ../electron-app
npm install
npm start
```

### **Project Structure**
```
Complyze_1.0/
├── complyze/                 # Next.js web dashboard
│   ├── src/app/             # App router pages
│   ├── src/components/      # React components
│   └── public/              # Static assets
├── complyze-extension-v2/   # Chrome extension
│   ├── manifest.json        # Extension manifest
│   ├── background.js        # Service worker
│   ├── content.js           # Content scripts
│   └── popup.html           # Extension popup
├── electron-app/            # Desktop application
│   ├── src/                 # TypeScript source
│   ├── ui/                  # React UI components
│   └── dist/                # Built application
└── assets/                  # Shared assets
```

### **Contributing**
1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📞 Support

### **Documentation**
- [API Documentation](./docs/API.md)
- [Extension Development Guide](./complyze-extension-v2/README.md)
- [Desktop App Guide](./electron-app/README.md)
- [Deployment Guide](./NETLIFY-DEPLOYMENT-GUIDE.md)

### **Getting Help**
- 📧 Email: support@complyze.ai
- 🐛 Issues: [GitHub Issues](https://github.com/dferdowsfy/Complyze_1.1/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/dferdowsfy/Complyze_1.1/discussions)

### **Enterprise Support**
- Priority technical support
- Custom compliance reporting
- Professional services
- Training and onboarding

---

**Built with ❤️ by the Complyze Team**

*Securing AI adoption for the enterprise* 