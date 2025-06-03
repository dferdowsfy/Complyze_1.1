"use client";
import React from "react";
import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0E1E36] via-[#1a2f4a] to-[#2d4a6b]">
      {/* Header */}
      <header className="border-b border-white/20 bg-black/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#FF6F3C] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="text-white text-xl font-bold">COMPLYZE</span>
          </Link>
          <Link 
            href="/dashboard" 
            className="bg-[#FF6F3C] text-white px-4 py-2 rounded-lg hover:bg-[#E55A2B] transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
          <h1 className="text-4xl font-bold text-[#0E1E36] mb-8 text-center">
            Privacy Policy
          </h1>
          
          <div className="text-sm text-gray-600 mb-8 text-center">
            <p>Last updated: January 2, 2025</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#0E1E36] mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Complyze ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our AI prompt security and optimization service, including our Chrome extension and web dashboard.
              </p>
              <p className="text-gray-700 leading-relaxed">
                By using Complyze, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#0E1E36] mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-[#0E1E36] mb-3">2.1 Personal Information</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Email address (for account creation and authentication)</li>
                <li>Name (optional, for personalization)</li>
                <li>Authentication tokens (for secure access)</li>
              </ul>

              <h3 className="text-xl font-medium text-[#0E1E36] mb-3">2.2 Prompt Data</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>AI prompts you submit for analysis and optimization</li>
                <li>Detected sensitive information (temporarily processed for security)</li>
                <li>Platform information (ChatGPT, Claude, Gemini, etc.)</li>
                <li>Timestamps and usage metadata</li>
              </ul>

              <h3 className="text-xl font-medium text-[#0E1E36] mb-3">2.3 Usage Analytics</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Extension usage patterns and feature interactions</li>
                <li>Error logs and performance metrics</li>
                <li>Compliance framework triggers and risk assessments</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#0E1E36] mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Security Analysis:</strong> To detect and protect against sensitive data exposure in AI prompts</li>
                <li><strong>Optimization:</strong> To improve prompt quality and effectiveness</li>
                <li><strong>Compliance Monitoring:</strong> To ensure adherence to HIPAA, GDPR, SOX, and other frameworks</li>
                <li><strong>Service Improvement:</strong> To enhance our features and user experience</li>
                <li><strong>Support:</strong> To provide customer assistance and technical support</li>
                <li><strong>Analytics:</strong> To generate usage reports and insights (aggregated and anonymized)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#0E1E36] mb-4">4. Data Processing and Security</h2>
              
              <h3 className="text-xl font-medium text-[#0E1E36] mb-3">4.1 Sensitive Data Handling</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Sensitive information is detected and redacted in real-time</li>
                <li>Original sensitive data is not permanently stored</li>
                <li>Only redacted/sanitized versions are retained for analysis</li>
                <li>All data is encrypted in transit and at rest</li>
              </ul>

              <h3 className="text-xl font-medium text-[#0E1E36] mb-3">4.2 Security Measures</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Industry-standard encryption (AES-256)</li>
                <li>Secure authentication protocols</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and monitoring</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#0E1E36] mb-4">5. Data Sharing and Disclosure</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Service Providers:</strong> Trusted third-party services that help us operate our platform (e.g., hosting, analytics)</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
                <li><strong>Business Protection:</strong> To protect our rights, property, or safety, or that of our users</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#0E1E36] mb-4">6. Chrome Extension Permissions</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our Chrome extension requires the following permissions to function:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>activeTab:</strong> To monitor AI platform interactions and detect sensitive content</li>
                <li><strong>scripting:</strong> To inject security monitoring and prompt optimization features</li>
                <li><strong>storage:</strong> To store user preferences, authentication tokens, and settings</li>
                <li><strong>cookies:</strong> For authentication with the Complyze dashboard</li>
                <li><strong>contextMenus:</strong> To provide right-click security options</li>
                <li><strong>Host permissions:</strong> To access AI platforms (ChatGPT, Claude, etc.) for monitoring</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                These permissions are used solely for the stated security and optimization purposes and are not used to collect unnecessary data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#0E1E36] mb-4">7. Data Retention</h2>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Account information: Retained while your account is active</li>
                <li>Prompt analysis data: Retained for 90 days for analytics and improvement</li>
                <li>Usage analytics: Aggregated data may be retained longer for service improvement</li>
                <li>Deleted accounts: All associated data is permanently deleted within 30 days</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#0E1E36] mb-4">8. Your Rights and Choices</h2>
              <p className="text-gray-700 leading-relaxed mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Delete your account and associated data</li>
                <li>Export your data</li>
                <li>Opt-out of certain data processing activities</li>
                <li>Disable the extension at any time</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                To exercise these rights, please contact us at privacy@complyze.co.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#0E1E36] mb-4">9. Compliance Frameworks</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Complyze is designed to help users comply with various regulatory frameworks:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>HIPAA:</strong> Health Insurance Portability and Accountability Act</li>
                <li><strong>GDPR:</strong> General Data Protection Regulation</li>
                <li><strong>SOX:</strong> Sarbanes-Oxley Act</li>
                <li><strong>PCI DSS:</strong> Payment Card Industry Data Security Standard</li>
                <li><strong>CCPA:</strong> California Consumer Privacy Act</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#0E1E36] mb-4">10. International Users</h2>
              <p className="text-gray-700 leading-relaxed">
                Complyze is operated from the United States. If you are accessing our service from outside the US, please be aware that your information may be transferred to, stored, and processed in the United States where our servers are located and our central database is operated.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#0E1E36] mb-4">11. Updates to This Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#0E1E36] mb-4">12. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-2"><strong>Email:</strong> privacy@complyze.co</p>
                <p className="text-gray-700 mb-2"><strong>Website:</strong> https://complyze.co</p>
                <p className="text-gray-700"><strong>Address:</strong> Complyze Privacy Office, United States</p>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 text-center">
            <Link 
              href="/" 
              className="inline-flex items-center text-[#FF6F3C] hover:text-[#E55A2B] font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
} 