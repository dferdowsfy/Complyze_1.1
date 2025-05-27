'use client';

import React, { useState } from "react";
import Link from 'next/link';
import { usePathname } from "next/navigation";

export default function Settings() {
  const [language, setLanguage] = useState("English");
  const [darkMode, setDarkMode] = useState(false);
  const [autoReport, setAutoReport] = useState(false);
  const [frameworks, setFrameworks] = useState(["NIST AI RMF"]);
  const [email, setEmail] = useState("user@company.com");
  const [plan, setPlan] = useState("Pro");
  const pathname = usePathname();

  const allFrameworks = ["NIST AI RMF", "HIPAA", "PCI DSS"];

  const handleFrameworkChange = (fw: string) => {
    setFrameworks(fws =>
      fws.includes(fw) ? fws.filter(f => f !== fw) : [...fws, fw]
    );
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans">
      {/* Sticky Nav Tabs - Standardized */}
      <nav className="sticky top-0 z-40 flex gap-12 bg-[#0F172A] px-8 py-5 shadow-md justify-center items-center">
        <Link href="/dashboard" className="relative text-white font-semibold text-2xl px-4 py-2 transition focus:outline-none">
          Dashboard
          {pathname && pathname.startsWith('/dashboard') && !pathname.includes('reports') && !pathname.includes('settings') && (
            <span className="absolute left-1/2 -translate-x-1/2 bottom-[-8px] w-24 h-[8px] block">
              <svg width="100%" height="8" viewBox="0 0 80 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4C16 8 64 8 76 4" stroke="#FF6F3C" strokeWidth="4" strokeLinecap="round"/></svg>
            </span>
          )}
        </Link>
        <Link href="/dashboard/reports" className="relative text-white font-semibold text-2xl px-4 py-2 transition focus:outline-none">
          Reports
          {pathname && pathname.includes('reports') && (
            <span className="absolute left-1/2 -translate-x-1/2 bottom-[-8px] w-24 h-[8px] block">
              <svg width="100%" height="8" viewBox="0 0 80 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4C16 8 64 8 76 4" stroke="#FF6F3C" strokeWidth="4" strokeLinecap="round"/></svg>
            </span>
          )}
        </Link>
        <Link href="/dashboard/settings" className="relative text-white font-semibold text-2xl px-4 py-2 transition focus:outline-none">
          Settings
          {pathname && pathname.includes('settings') && (
            <span className="absolute left-1/2 -translate-x-1/2 bottom-[-8px] w-24 h-[8px] block">
              <svg width="100%" height="8" viewBox="0 0 80 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4C16 8 64 8 76 4" stroke="#FF6F3C" strokeWidth="4" strokeLinecap="round"/></svg>
            </span>
          )}
        </Link>
      </nav>
      <main className="max-w-4xl mx-auto py-12 px-4">
        {/* Page Title */}
        <h1 className="text-3xl font-bold text-[#1C2A3E] mb-2">Settings</h1>
        <p className="text-lg text-[#1C2A3E] mb-10">Manage your account, security, and compliance preferences.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* User Preferences */}
          <div className="bg-white rounded-xl shadow p-6 border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2 font-semibold text-[#1C2A3E]">🛠️ User Preferences</div>
            <div>
              <label className="block text-sm font-medium mb-1">Language</label>
              <select
                className="border border-slate-200 rounded-md p-2 w-full"
                value={language}
                onChange={e => setLanguage(e.target.value)}
              >
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
              </select>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" checked={darkMode} onChange={e => setDarkMode(e.target.checked)} id="darkmode" className="accent-[#FF6F3C] w-4 h-4 rounded" />
              <label htmlFor="darkmode" className="text-sm">Enable dark mode</label>
            </div>
          </div>
          {/* Account Management */}
          <div className="bg-white rounded-xl shadow p-6 border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2 font-semibold text-[#1C2A3E]">👤 Account Management</div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                className="border border-slate-200 rounded-md p-2 w-full"
                value={email}
                onChange={e => setEmail(e.target.value)}
                type="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                className="border border-slate-200 rounded-md p-2 w-full"
                value="********"
                type="password"
                readOnly
              />
              <button className="mt-2 bg-[#FF6F3C] text-white px-4 py-2 rounded-md font-semibold text-sm hover:bg-[#ff8a5c] transition">Change password</button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm">Plan:</span>
              <span className="font-semibold text-[#FF6F3C]">{plan}</span>
              <button className="ml-auto bg-slate-100 text-[#1C2A3E] px-3 py-1 rounded-md text-xs font-semibold hover:bg-slate-200 transition">View plans</button>
            </div>
          </div>
          {/* Compliance Configuration */}
          <div className="bg-white rounded-xl shadow p-6 border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2 font-semibold text-[#1C2A3E]">🛡️ Compliance Configuration</div>
            <div className="flex items-center gap-2 mb-2">
              <input type="checkbox" checked={autoReport} onChange={e => setAutoReport(e.target.checked)} id="autoreport" className="accent-[#FF6F3C] w-4 h-4 rounded" />
              <label htmlFor="autoreport" className="text-sm">Enable automatic report generation</label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Frameworks to monitor</label>
              <div className="flex flex-col gap-1">
                {allFrameworks.map(fw => (
                  <label key={fw} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={frameworks.includes(fw)}
                      onChange={() => handleFrameworkChange(fw)}
                      className="accent-[#FF6F3C] w-4 h-4 rounded"
                    />
                    {fw}
                  </label>
                ))}
              </div>
            </div>
          </div>
          {/* Data & Privacy */}
          <div className="bg-white rounded-xl shadow p-6 border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2 font-semibold text-[#1C2A3E]">🔒 Data & Privacy</div>
            <button className="bg-[#FF6F3C] text-white px-4 py-2 rounded-md font-semibold text-sm hover:bg-[#ff8a5c] transition">Request Data Export</button>
            <button className="bg-red-500 text-white px-4 py-2 rounded-md font-semibold text-sm hover:bg-red-600 transition">Delete Account</button>
          </div>
        </div>
      </main>
    </div>
  );
} 