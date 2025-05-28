'use client';
import React, { useRef, useState, useEffect } from "react";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";

const COLORS = {
  bg: "#FAF9F6",
  header: "#0E1E36",
  accent: "#FF6F3C",
  card: "#FFFFFF",
  divider: "#E0E0E0",
  text: "#2D3748",
  textSecondary: "#6B7280",
  risk: "#E53935",
  safe: "#388E3C",
};

const FONT = {
  fontFamily: 'Inter, sans-serif',
};

// Inline SVGs for NIST and HIPAA (public domain or simple icons)
const NistLogo = () => (
  <svg width="24" height="16" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block align-middle grayscale opacity-70 mr-2">
    <rect width="24" height="16" rx="3" fill="#222" />
    <text x="3" y="13" fontFamily="Arial, Helvetica, sans-serif" fontWeight="bold" fontSize="10" fill="#fff">NIST</text>
  </svg>
);
const HipaaLogo = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="inline-block align-middle grayscale opacity-70 mr-2">
    <circle cx="10" cy="10" r="9" stroke="#222" strokeWidth="2" fill="#fff"/>
    <path d="M6 10l2 2 4-4" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Tooltip component
const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => (
  <span className="relative group cursor-pointer">
    {children}
    <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max px-3 py-1 rounded bg-black text-white text-xs opacity-0 group-hover:opacity-100 transition pointer-events-none z-50 whitespace-nowrap">
      {text}
    </span>
  </span>
);

// Sticky Progress Sidebar
function ProgressSidebar({ activeStep }: { activeStep: number }) {
  const steps = ["Input", "Risk", "Optimized", "Mapped", "Logged", "Deployed"];
  return (
    <div className="hidden lg:flex flex-col fixed left-8 top-1/4 z-30 gap-6 bg-white/80 rounded-xl shadow-lg px-4 py-6 border border-gray-200 overflow-y-auto max-h-[80vh]">
      {steps.map((step, idx) => (
        <div key={step} className="flex items-center gap-2">
          <span className={`w-4 h-4 rounded-full border-2 ${activeStep === idx ? 'bg-[#FF6F3C] border-[#FF6F3C]' : 'bg-gray-200 border-gray-300'} transition-all`}></span>
          <span className={`text-base font-semibold ${activeStep === idx ? 'text-[#FF6F3C]' : 'text-gray-500'}`}>{step}</span>
        </div>
      ))}
    </div>
  );
}

// FAQ data
const FAQS = [
  {
    q: "Why should I care about LLM prompt compliance right now?",
    a: `Because AI misuse doesn't look like misuse--until it's too late.\nEvery prompt your team sends to a large language model could leak sensitive data, violate privacy policies, or produce misleading outputs. Regulators and CISOs are already asking: "What controls do we have in place?"\nComplyze ensures you're not scrambling when they do.`
  },
  {
    q: "Isn't prompt misuse just a user training issue?",
    a: `No. Misuse is often unintentional.\nEven experienced professionals write prompts that are vague, contain PII, or trigger untrusted model behavior.\nComplyze adds a real-time safety net--scanning, optimizing, and redacting prompts before they leave your system or get logged by third-party AI tools.`
  },
  {
    q: "What's the risk if we don't use something like Complyze?",
    a: `• PII exposure through vague or careless inputs\n• Inconsistent LLM output due to unoptimized prompts\n• Regulatory violations tied to NIST, HIPAA, GDPR, FedRAMP\n• Zero auditability when internal AI usage is questioned\n\nThink of Complyze as a seatbelt for prompt engineering--you might not need it every time, but when you do, it's the only thing that matters.`
  },
  {
    q: "Can't we just teach our team to write better prompts?",
    a: `That's a good start--but not enough.\nEven strong prompts can contain unintentional risks. Complyze goes further by:\n• Rewriting prompts using LLM best practices from OpenAI, Anthropic, etc.\n• Flagging vague, dangerous, or sensitive inputs\n• Mapping each prompt to security frameworks you already follow\n\nYou get consistency, clarity, and control--automatically.`
  },
  {
    q: "What makes Complyze different from other LLM safety tools?",
    a: `Complyze focuses on the prompt layer--the most overlooked and vulnerable part of enterprise AI usage.\nIt's not just about filtering inputs. It:\n• Optimizes clarity + performance\n• Redacts and anonymizes PII\n• Links to compliance frameworks like NIST AI RMF, HIPAA, and FedRAMP\n• Generates reports (SSP, POAM, Audit Logs) on demand\n\nIt's AI governance in action.`
  },
  {
    q: "Who's using Complyze?",
    a: `Complyze is built for teams deploying LLMs inside:\n• Heavily regulated industries (finance, healthcare, government contracting)\n• Enterprises managing sensitive data\n• AI product teams building responsibly\n\nIf your internal AI tools touch data, policies, or people--Complyze belongs in your stack.`
  },
  {
    q: "Is Complyze hard to integrate?",
    a: `Not at all.\nYou can:\n• Use our Chrome extension, API, or chat interface\n• Drop into your prompt workflow in < 10 minutes\n• Export real-time compliance reports anytime\n\nNo need to rebuild anything--just govern what's already happening.`
  },
  {
    q: "Final Note:",
    a: `LLMs are here. So is risk.\nComplyze is the layer between accidental misuse and confident, compliant AI operations. Start using it before you wish you had.`
  }
];

// --- Subcomponents for each step ---

function UserInput({ inView }: { inView: boolean }) {
  const prompt = "“Hey, can you quickly summarize this policy document for me? It's about our new data retention guidelines. Also, ensure that John Smith's details are highlighted. His employee ID is 789456, and his email is john.smith@example.com. This is for our internal review, so keep it confidential.”";
  // Typewriter effect
  const [displayed, setDisplayed] = React.useState("");
  React.useEffect(() => {
    if (inView && displayed.length < prompt.length) {
      const timeout = setTimeout(() => setDisplayed(prompt.slice(0, displayed.length + 1)), 18);
      return () => clearTimeout(timeout);
    }
  }, [inView, displayed, prompt]);
  return (
    <div className="overflow-y-auto max-h-[80vh] w-full flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        className="w-full flex flex-col items-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="text-3xl md:text-4xl font-medium mb-8"
          style={{ color: COLORS.header }}
        >
          User Inputs Weak Prompt
        </motion.div>
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-10 border border-[#E0E0E0] flex flex-col items-center" style={{ fontSize: 24, minHeight: 90 }}>
          <span className="text-[#6B7280] text-lg mb-2 flex items-center gap-2"><span role="img" aria-label="user">��</span>User</span>
          <span style={{ fontFamily: 'Inter, monospace', fontSize: 28, letterSpacing: 0.2 }}>{displayed}</span>
        </div>
      </motion.div>
    </div>
  );
}

function RiskDetection({ inView }: { inView: boolean }) {
  // Prompt split into segments for highlighting
  const before1 = "Hey, can you quickly summarize this policy document for me? It's about our new data retention guidelines. Also, ensure that ";
  const risk1 = "John Smith's";
  const middle1 = " details are highlighted. His employee ID is ";
  const risk2 = "789456";
  const middle2 = ", and his email is ";
  const risk3 = "john.smith@example.com";
  const after3 = ". This is for our internal review, so keep it confidential.";

  // Animation variants for pulsing/glow
  const highlightVariant = {
    initial: { boxShadow: '0 0 0px 0px #E53935', backgroundColor: '#fffbe9', color: '#E53935' },
    animate: {
      boxShadow: [
        '0 0 0px 0px #E53935',
        '0 0 16px 6px #E53935',
        '0 0 0px 0px #E53935'
      ],
      backgroundColor: [
        '#fffbe9',
        '#ffeaea',
        '#fffbe9'
      ],
      color: [
        '#E53935',
        '#fff',
        '#E53935'
      ],
      transition: {
        duration: 1.6,
        repeat: Infinity,
        repeatType: 'loop' as const,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <div className="overflow-y-auto max-h-[80vh] w-full flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        className="w-full flex flex-col items-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1, duration: 0.7 }}
          className="text-3xl md:text-4xl font-bold mb-8"
          style={{ color: COLORS.risk }}
        >
          Risk Detection
        </motion.div>
        <div className="w-full max-w-2xl relative">
          <div
            className="rounded-2xl shadow-xl p-10 border border-[#E0E0E0] flex flex-col items-center"
            style={{
              fontSize: 24,
              minHeight: 90,
              position: 'relative',
              backgroundImage: 'radial-gradient( circle 1588px at -27.3% 144%,  rgba(255,22,22,1) 0%, rgba(0,0,0,1) 43.4%, rgba(0,0,0,1) 65.8%, rgba(255,22,22,1) 100.2% )',
              color: '#fff',
            }}
          >
            <span className="text-lg mb-2 flex items-center gap-2" style={{ color: '#fff' }}><span role="img" aria-label="user">👤</span>User</span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.2, duration: 0.8 }}
              style={{ fontFamily: 'Inter, monospace', fontSize: 28, letterSpacing: 0.2, wordBreak: 'break-word', lineHeight: 1.5, color: '#fff' }}
            >
              {before1}
              <motion.span
                variants={highlightVariant}
                initial="initial"
                animate={inView ? "animate" : "initial"}
                style={{ borderRadius: 8, padding: '0 6px', margin: '0 2px', fontWeight: 700, display: 'inline-block' }}
              >
                {risk1}
              </motion.span>
              {middle1}
              <motion.span
                variants={highlightVariant}
                initial="initial"
                animate={inView ? "animate" : "initial"}
                style={{ borderRadius: 8, padding: '0 6px', margin: '0 2px', fontWeight: 700, display: 'inline-block' }}
              >
                {risk2}
              </motion.span>
              {middle2}
              <motion.span
                variants={highlightVariant}
                initial="initial"
                animate={inView ? "animate" : "initial"}
                style={{ borderRadius: 8, padding: '0 6px', margin: '0 2px', fontWeight: 700, display: 'inline-block' }}
              >
                {risk3}
              </motion.span>
              {after3}
            </motion.span>
            {/* Radar/scan effect */}
            {inView && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ duration: 1.2 }}
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{ background: 'radial-gradient(circle, #E53935 0%, #fff0e6 80%)' }}
              />
            )}
          </div>
          {/* Risk badges */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="flex gap-4 mt-6 justify-center"
          >
            <motion.span
              className="bg-[#E53935] text-white px-4 py-2 rounded-full font-bold text-lg shadow"
              animate={inView ? { boxShadow: [
                '0 0 0px 0px #E53935',
                '0 0 16px 6px #E53935',
                '0 0 0px 0px #E53935'
              ] } : {}}
              transition={{ duration: 1.6, repeat: Infinity, repeatType: 'loop' as const, ease: 'easeInOut' }}
            >Unclear intent</motion.span>
            <motion.span
              className="bg-[#E53935] text-white px-4 py-2 rounded-full font-bold text-lg shadow"
              animate={inView ? { boxShadow: [
                '0 0 0px 0px #E53935',
                '0 0 16px 6px #E53935',
                '0 0 0px 0px #E53935'
              ] } : {}}
              transition={{ duration: 1.6, repeat: Infinity, repeatType: 'loop' as const, ease: 'easeInOut', delay: 0.5 }}
            >Potential PII</motion.span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function PromptOptimizer({ inView }: { inView: boolean }) {
  return (
    <div className="overflow-y-auto max-h-[80vh] w-full flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        className="w-full flex flex-col items-center"
      >
        {/* Animated gear logo above the cards */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
          className="w-24 h-24 rounded-full bg-[#FF6F3C] flex items-center justify-center shadow-lg mb-6"
        >
          <svg width="56" height="56" fill="none" viewBox="0 0 24 24"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1, duration: 0.7 }}
          className="text-3xl md:text-4xl font-bold mb-8 flex items-center gap-2"
          style={{ color: COLORS.accent }}
        >
          Prompt Optimization
        </motion.div>
        <div className="w-full max-w-4xl flex flex-col md:flex-row gap-8 items-center justify-center">
          {/* Animated transition: left prompt slides into engine, right prompt slides out */}
          <motion.div
            initial={{ x: 0 }}
            animate={inView ? { x: 80 } : {}}
            transition={{ duration: 0.7 }}
            className="flex-1"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="bg-[#fff0e6] border border-[#FF6F3C] rounded-2xl p-8 text-2xl shadow mb-4 md:mb-0"
            >
              Hey, can you quickly summarize this policy document for me? It's about our new data retention guidelines. Also, ensure that John Smith's details are highlighted. His employee ID is 789456, and his email is john.smith@example.com. This is for our internal review, so keep it confidential.
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ x: 0, opacity: 0 }}
            animate={inView ? { x: -80, opacity: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex-1"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="bg-[#e6fff3] border border-green-500 rounded-2xl p-8 text-2xl shadow"
            >
              As a compliance analyst, please summarize the key points of the attached data retention policy document, focusing on sections relevant to employee data handling. 
              Additionally, extract and list any references to specific employee identifiers or contact information, ensuring that all personally identifiable information (PII) is anonymized in the summary to maintain confidentiality.
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="text-lg mt-4 text-green-700 font-bold"
            >
              Enhanced Clarity + Lowered Risk
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function ComplianceMapping({ inView }: { inView: boolean }) {
  return (
    <div className="overflow-y-auto max-h-[80vh] w-full flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        className="w-full flex flex-col items-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1, duration: 0.7 }}
          className="text-3xl md:text-4xl font-bold mb-8 flex items-center gap-2"
          style={{ color: COLORS.header }}
        >
          <span role="img" aria-label="compliance">📋</span>Compliance Mapping
        </motion.div>
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-10 border border-[#E0E0E0] flex flex-col items-center relative">
          {/* Compliance Table ONLY */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="w-full overflow-x-auto"
          >
            <table className="w-full text-left border-collapse rounded-xl overflow-hidden shadow-md" style={{ fontFamily: 'Inter, sans-serif', fontSize: 18 }}>
              <thead>
                <tr>
                  <th className="px-4 py-3 bg-[#F5F6FA] text-[#0E1E36] font-bold"><Tooltip text="NIST AI RMF – Security Control Family SC"><span className="flex items-center"><NistLogo />NIST SP 800-53 Control</span></Tooltip></th>
                  <th className="px-4 py-3 bg-[#F5F6FA] text-[#0E1E36] font-bold"><Tooltip text="HIPAA – Health Insurance Portability and Accountability Act"><span className="flex items-center"><HipaaLogo />HIPAA Regulation</span></Tooltip></th>
                  <th className="px-4 py-3 bg-[#F5F6FA] text-[#0E1E36] font-bold">Role Specification</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-3" style={{ background: '#0E1E36', color: '#fff', fontWeight: 600 }}><span className="flex items-center"><NistLogo />AT-2, PM-13</span></td>
                  <td className="px-4 py-3" style={{ background: '#FF6F3C', color: '#fff', fontWeight: 600 }}><span className="flex items-center"><HipaaLogo />164.308(a)(5)(i)</span></td>
                  <td className="px-4 py-3" style={{ background: '#388E3C', color: '#fff', fontWeight: 600 }}>Data Retention Policy Focus</td>
                </tr>
                <tr>
                  <td className="px-4 py-3" style={{ background: '#0E1E36', color: '#fff', fontWeight: 600 }}>MP-6, SI-12</td>
                  <td className="px-4 py-3" style={{ background: '#FF6F3C', color: '#fff', fontWeight: 600 }}>164.310(d)(2)(i)</td>
                  <td className="px-4 py-3" style={{ background: '#388E3C', color: '#fff', fontWeight: 600 }}>Employee Data Handling</td>
                </tr>
                <tr>
                  <td className="px-4 py-3" style={{ background: '#0E1E36', color: '#fff', fontWeight: 600 }}>AC-6, PL-2</td>
                  <td className="px-4 py-3" style={{ background: '#FF6F3C', color: '#fff', fontWeight: 600 }}>164.308(a)(3)(i)</td>
                  <td className="px-4 py-3" style={{ background: '#388E3C', color: '#fff', fontWeight: 600 }}>PII Anonymization</td>
                </tr>
                <tr>
                  <td className="px-4 py-3" style={{ background: '#0E1E36', color: '#fff', fontWeight: 600 }}>SC-12, SC-28</td>
                  <td className="px-4 py-3" style={{ background: '#FF6F3C', color: '#fff', fontWeight: 600 }}>164.514(a)</td>
                  <td className="px-4 py-3" style={{ background: '#388E3C', color: '#fff', fontWeight: 600 }}>Role Specification</td>
                </tr>
              </tbody>
            </table>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function RedactionAudit({ inView }: { inView: boolean }) {
  return (
    <div className="overflow-y-auto max-h-[80vh] w-full flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        className="w-full flex flex-col items-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1, duration: 0.7 }}
          className="text-3xl md:text-4xl font-bold mb-8 flex items-center gap-2"
          style={{ color: COLORS.header }}
        >
          <span role="img" aria-label="redact">🔒</span>Redaction & Audit Logging
        </motion.div>
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-10 border border-[#E0E0E0] flex flex-col items-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="text-2xl mb-4 text-[#2D3748] flex items-center gap-2"
          >
            <motion.span
              initial={{ x: -40, opacity: 0 }}
              animate={inView ? { x: 0, opacity: 1 } : {}}
              transition={{ duration: 0.7, type: 'spring', bounce: 0.4 }}
              className="inline-block"
            >
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="#FF6F3C"/><rect x="7" y="9" width="10" height="2" rx="1" fill="#fff"/><rect x="7" y="13" width="6" height="2" rx="1" fill="#fff"/></svg>
            </motion.span>
            <span>You are a policy analyst. Please summarize the attached policy in 3 bullet points and flag <span className="bg-[#E53935] text-white px-2 rounded">regulatory gaps</span>.</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="flex gap-4 mb-4"
          >
            <span className="bg-[#0E1E36] text-white px-4 py-2 rounded-full text-lg font-bold">Audit Log</span>
            <span className="bg-[#FF6F3C] text-white px-4 py-2 rounded-full text-lg font-bold">POAM</span>
            <span className="bg-green-700 text-white px-4 py-2 rounded-full text-lg font-bold">Export</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.7, duration: 0.7 }}
            className="text-lg text-[#6B7280] font-semibold mb-2"
          >
            <span className="bg-[#F5F6FA] px-3 py-2 rounded">Prompt logged for compliance & audit</span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function FinalOutput({ inView }: { inView: boolean }) {
  return (
    <div className="overflow-y-auto max-h-[80vh] w-full flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        className="w-full flex flex-col items-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1, duration: 0.7 }}
          className="text-3xl md:text-4xl font-bold mb-8 flex items-center gap-2"
          style={{ color: COLORS.safe }}
        >
          <motion.span
            initial={{ scale: 1.2, y: -20 }}
            animate={inView ? { scale: 1, y: 0 } : {}}
            transition={{ duration: 0.7, type: 'spring', bounce: 0.5 }}
            className="inline-block"
          >
            <span role="img" aria-label="safe">✅</span>
          </motion.span>
          Safe + Compliant
        </motion.div>
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-10 border border-[#E0E0E0] flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="text-2xl mb-4 text-green-700 font-bold"
          >
            Ready to deploy safely in your org
          </motion.div>
          <div className="flex gap-4 mt-4">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="px-10 py-4 rounded-lg font-bold text-2xl shadow transition hover:bg-[#e65d2d]"
              style={{ background: COLORS.accent, color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'Inter, sans-serif', minWidth: 180 }}
            >
              Deploy Prompt
            </motion.button>
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="px-6 py-4 rounded-lg font-bold text-xl border border-[#FF6F3C] text-[#FF6F3C] bg-white hover:bg-[#fff5f0] transition shadow"
              style={{ fontFamily: 'Inter, sans-serif', minWidth: 160 }}
            >
              View Audit Log
            </motion.button>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mt-12 text-center"
        >
          {/* Optionally add a CTA or summary here if needed */}
        </motion.div>
      </motion.div>
    </div>
  );
}

function FAQSection({ faqRef }: { faqRef?: React.RefObject<HTMLDivElement | null> }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <section ref={faqRef} className="max-w-3xl mx-auto my-24 px-4">
      <motion.h2
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="text-4xl md:text-5xl font-bold mb-12 text-center tracking-tight"
        style={{ color: '#0E1E36', letterSpacing: '-0.02em' }}
      >
        Frequently Asked Questions
      </motion.h2>
      <div className="flex flex-col gap-6">
        {FAQS.map((faq, idx) => (
          <motion.div
            key={faq.q}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.08 }}
            className="rounded-2xl shadow-lg border border-[#0E1E36] overflow-hidden"
            style={{ background: '#0E1E36', color: '#fff', backdropFilter: 'blur(2px)' }}
          >
            <button
              className="w-full flex items-center justify-between px-6 py-6 text-left focus:outline-none group"
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              aria-expanded={openIdx === idx}
              style={{ color: '#fff' }}
            >
              <span className="flex items-center gap-3 text-xl md:text-2xl font-semibold" style={{ color: '#fff' }}>
                {/* Removed icon */}
                {faq.q}
              </span>
              <motion.span
                initial={false}
                animate={{ rotate: openIdx === idx ? 90 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="ml-2 text-2xl text-[#FF6F3C]"
              >
                ▶
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {openIdx === idx && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  className="px-8 pb-8 text-lg whitespace-pre-line"
                  style={{ color: '#fff' }}
                >
                  {faq.a}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// --- Main PromptJourney with parallax and scroll logic ---

interface PromptJourneyProps {
  journeyRef?: React.RefObject<HTMLDivElement | null>;
  faqRef?: React.RefObject<HTMLDivElement | null>;
}

export default function PromptJourney({ journeyRef, faqRef }: PromptJourneyProps) {
  const ref1 = useRef<HTMLDivElement>(null);
  const ref2 = useRef<HTMLDivElement>(null);
  const ref3 = useRef<HTMLDivElement>(null);
  const ref4 = useRef<HTMLDivElement>(null);
  const ref5 = useRef<HTMLDivElement>(null);
  const ref6 = useRef<HTMLDivElement>(null);
  // Use amount 0.5 for journey steps
  const inView1 = useInView(ref1, { amount: 0.5 });
  const inView2 = useInView(ref2, { amount: 0.5 });
  const inView3 = useInView(ref3, { amount: 0.5 });
  const inView4 = useInView(ref4, { amount: 0.5 });
  const inView5 = useInView(ref5, { amount: 0.5 });
  const inView6 = useInView(ref6, { amount: 0.5 });
  const faqInView = faqRef ? useInView(faqRef, { amount: 0.2 }) : false;

  // Parallax backgrounds (simple effect)
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 800], [0, 120]);
  const fgY = useTransform(scrollY, [0, 800], [0, 60]);

  const [activeStep, setActiveStep] = useState(0);
  // Show sidebar only when in journey (from UserInput to FinalOutput) and FAQ is not in view
  const showSidebar = (inView1 || inView2 || inView3 || inView4 || inView5 || inView6) && !faqInView;

  useEffect(() => {
    // Always scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (inView1) setActiveStep(0);
    if (inView2) setActiveStep(1);
    if (inView3) setActiveStep(2);
    if (inView4) setActiveStep(3);
    if (inView5) setActiveStep(4);
    if (inView6) setActiveStep(5);
  }, [inView1, inView2, inView3, inView4, inView5, inView6]);

  return (
    <div style={{ ...FONT, background: COLORS.bg, color: COLORS.text, width: "100%", padding: 0 }} className="w-full py-24 md:py-32 relative overflow-x-hidden">
      {/* Parallax background shapes */}
      <motion.div style={{ y: bgY }} className="absolute left-0 top-0 w-full h-96 z-0" aria-hidden>
        <div className="w-2/3 h-80 bg-[#FF6F3C]/10 rounded-full absolute left-[-10%] top-10 blur-2xl" />
        <div className="w-1/2 h-60 bg-[#0E1E36]/10 rounded-full absolute right-[-10%] top-40 blur-2xl" />
      </motion.div>
      <motion.div style={{ y: fgY }} className="absolute right-0 bottom-0 w-1/2 h-80 z-0" aria-hidden>
        <div className="w-full h-80 bg-[#FF6F3C]/20 rounded-full absolute right-[-20%] bottom-0 blur-2xl" />
      </motion.div>
      <div className="relative z-10 max-w-6xl mx-auto flex flex-col gap-32 px-4 md:px-0">
        <div ref={el => {
          if (journeyRef) journeyRef.current = el;
          if (ref1) (ref1 as any).current = el;
        }}><UserInput inView={inView1} /></div>
        <div ref={ref2}><RiskDetection inView={inView2} /></div>
        <div ref={ref3}><PromptOptimizer inView={inView3} /></div>
        <div ref={ref4}><ComplianceMapping inView={inView4} /></div>
        <div ref={ref5}><RedactionAudit inView={inView5} /></div>
        <div ref={ref6}><FinalOutput inView={inView6} /></div>
      </div>
      {showSidebar && <ProgressSidebar activeStep={activeStep} />}
      <FAQSection faqRef={faqRef} />
    </div>
  );
} 