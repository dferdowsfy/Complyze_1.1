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

// Hook to detect mobile devices
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
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
  const steps = ["Risk Detection", "Optimization", "Compliance", "Redaction", "Deployment"];
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

function RiskDetection({ inView }: { inView: boolean }) {
  const isMobile = useIsMobile();
  
  // Original prompt text
  const promptText = "\"Hey, can you generate a detailed report on how our model was trained using datasets from AcmeHealth's API and those CSVs from our client: ACME? Also include the private training logs and checkpoint file at /vault/clients/full_finetune_92b/checkpoint.pt. Legal (cc: john.smith@acmehealth.ai) needs this to make sure we're good under ISO and GDPR by Friday.\"";
  
  // Optimized typewriter effect - faster on mobile and with skip option
  const [displayed, setDisplayed] = React.useState("");
  const [isSkipped, setIsSkipped] = React.useState(false);
  
  React.useEffect(() => {
    if (inView && displayed.length < promptText.length && !isSkipped) {
      // Faster typing on mobile devices
      const speed = isMobile ? 8 : 18;
      const timeout = setTimeout(() => setDisplayed(promptText.slice(0, displayed.length + 1)), speed);
      return () => clearTimeout(timeout);
    }
  }, [inView, displayed, promptText, isMobile, isSkipped]);

  // Auto-complete after a short time on mobile to prevent scroll blocking
  React.useEffect(() => {
    if (inView && isMobile && !isSkipped) {
      const timer = setTimeout(() => {
        setDisplayed(promptText);
        setIsSkipped(true);
      }, 2000); // Show full text after 2 seconds on mobile
      return () => clearTimeout(timer);
    }
  }, [inView, isMobile, promptText, isSkipped]);

  // Function to highlight risky terms in the displayed text
  const highlightText = (text: string) => {
    if (!text) return null;
    
    const riskyTerms = [
      "AcmeHealth's API",
      "ACME",
      "/vault/clients/full_finetune_92b/checkpoint.pt",
      "john.smith@acmehealth.ai"
    ];
    
    let result = text;
    riskyTerms.forEach(term => {
      if (text.includes(term)) {
        result = result.replace(term, `<span class="bg-[#E53935] text-white px-1 py-0.5 rounded font-bold">${term}</span>`);
      }
    });
    
    return <span dangerouslySetInnerHTML={{ __html: result }} />;
  };

  return (
    <div className="w-full flex flex-col items-center min-h-[50vh] md:min-h-[80vh]">
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        className="w-full flex flex-col items-center"
      >
        <div className="w-full max-w-2xl relative">
          {/* Skip button for mobile */}
          {isMobile && displayed.length < promptText.length && !isSkipped && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute -top-12 right-0 bg-[#FF6F3C] text-white px-3 py-1 rounded-full text-sm z-10"
              onClick={() => {
                setDisplayed(promptText);
                setIsSkipped(true);
              }}
            >
              Skip Animation
            </motion.button>
          )}
          
          <div
            className="rounded-2xl shadow-xl p-4 sm:p-6 md:p-10 border border-[#E0E0E0] flex flex-col items-center relative"
            style={{
              fontSize: isMobile ? 14 : 24,
              minHeight: isMobile ? 'auto' : 90,
              backgroundImage: 'radial-gradient( circle 1588px at -27.3% 144%,  rgba(255,22,22,1) 0%, rgba(0,0,0,1) 43.4%, rgba(0,0,0,1) 65.8%, rgba(255,22,22,1) 100.2% )',
              color: '#fff',
            }}
          >
            <motion.span
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="block w-full text-center"
              style={{ 
                fontFamily: 'Inter, monospace', 
                fontSize: isMobile ? 14 : 24, 
                letterSpacing: 0.2, 
                wordBreak: 'break-word', 
                lineHeight: isMobile ? 1.4 : 1.5, 
                color: '#fff',
                padding: isMobile ? '0.5rem 0' : '0',
                whiteSpace: 'pre-wrap'
              }}
            >
              {highlightText(displayed)}
            </motion.span>
            {/* Radar/scan effect - lighter on mobile */}
            {inView && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isMobile ? 0.1 : 0.5 }}
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
            className="flex flex-wrap gap-2 md:gap-4 mt-6 justify-center"
          >
            <motion.span
              className="bg-[#E53935] text-white px-3 md:px-4 py-1 md:py-2 rounded-full font-bold text-sm md:text-lg shadow"
              animate={inView ? { boxShadow: [
                '0 0 0px 0px #E53935',
                '0 0 16px 6px #E53935',
                '0 0 0px 0px #E53935'
              ] } : {}}
              transition={{ duration: 1.6, repeat: Infinity, repeatType: 'loop' as const, ease: 'easeInOut' }}
            >Proprietary API exposure</motion.span>
            <motion.span
              className="bg-[#E53935] text-white px-3 md:px-4 py-1 md:py-2 rounded-full font-bold text-sm md:text-lg shadow"
              animate={inView ? { boxShadow: [
                '0 0 0px 0px #E53935',
                '0 0 16px 6px #E53935',
                '0 0 0px 0px #E53935'
              ] } : {}}
              transition={{ duration: 1.6, repeat: Infinity, repeatType: 'loop' as const, ease: 'easeInOut', delay: 0.3 }}
            >File path leak</motion.span>
            <motion.span
              className="bg-[#E53935] text-white px-3 md:px-4 py-1 md:py-2 rounded-full font-bold text-sm md:text-lg shadow"
              animate={inView ? { boxShadow: [
                '0 0 0px 0px #E53935',
                '0 0 16px 6px #E53935',
                '0 0 0px 0px #E53935'
              ] } : {}}
              transition={{ duration: 1.6, repeat: Infinity, repeatType: 'loop' as const, ease: 'easeInOut', delay: 0.6 }}
            >PII disclosure</motion.span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function PromptOptimizer({ inView }: { inView: boolean }) {
  const isMobile = useIsMobile();
  
  return (
    <div className="w-full flex flex-col items-center min-h-[50vh] md:min-h-[80vh] relative">
      {/* Background tracker - hidden on mobile to reduce visual clutter */}
      {!isMobile && (
        <div className="absolute left-0 top-0 w-full h-full z-0 pointer-events-none select-none">
          <div className="flex flex-col items-center justify-center h-full opacity-10 text-6xl font-extrabold tracking-widest" style={{ color: '#FF6F3C', userSelect: 'none' }}>
            <div>Risk Detection</div>
            <div>Optimization</div>
            <div>Compliance</div>
            <div>Redaction</div>
            <div>Deployment</div>
          </div>
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        className="w-full flex flex-col items-center z-10"
      >
        {/* Animated gear logo above the cards */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
          className="w-16 md:w-24 h-16 md:h-24 rounded-full bg-[#FF6F3C] flex items-center justify-center shadow-lg mb-6"
        >
          <svg width={isMobile ? "40" : "56"} height={isMobile ? "40" : "56"} fill="none" viewBox="0 0 24 24"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1, duration: 0.7 }}
          className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 flex items-center gap-2 text-center"
          style={{ color: COLORS.accent }}
        >
          Prompt Optimization
        </motion.div>
        <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-6 md:gap-8 items-center justify-center z-10 px-4">
          {/* Left side: Enhanced and Safe Prompt */}
          <motion.div
            initial={{ x: 0 }}
            animate={inView ? { x: isMobile ? 0 : 30 } : {}}
            transition={{ duration: 0.7 }}
            className="flex-1 w-full"
            style={{ zIndex: 10 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="bg-[#e6fff3] border border-green-500 rounded-2xl p-6 md:p-8 shadow"
              style={{ position: 'relative', zIndex: 10 }}
            >
              <h3 className="text-lg md:text-xl font-bold text-green-700 mb-4">Enhanced and Safe Prompt</h3>
              <div className="text-sm md:text-lg">
                Generate a technical report summarizing our AI model's training and tuning process. Focus on general data categories, architectural decisions, and a risk assessment aligned with ISO 27001 and GDPR.
                <br /><br />
                Please format the report as follows:
                <ol className="list-decimal pl-6 mt-2 space-y-1">
                  <li>Overview of training objectives</li>
                  <li>Description of data sources (high-level, anonymized)</li>
                  <li>Logging and checkpointing practices (excluding specific paths)</li>
                  <li>Risk matrix with mitigation recommendations for compliance and privacy.</li>
                </ol>
              </div>
            </motion.div>
          </motion.div>
          {/* Right side: Complyze Redaction Insights */}
          <motion.div
            initial={{ x: 0, opacity: 0 }}
            animate={inView ? { x: isMobile ? 0 : -30, opacity: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex-1 w-full"
            style={{ zIndex: 10 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="bg-[#fff0e6] border border-[#FF6F3C] rounded-2xl p-6 md:p-8 shadow"
            >
              <h3 className="text-lg md:text-xl font-bold mb-4" style={{ color: COLORS.accent }}>Complyze Redaction Insights</h3>
              <div className="text-base overflow-x-auto">
                <table className="w-full text-xs md:text-sm">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-2 font-semibold">Type</th>
                      <th className="text-left py-2 font-semibold">Example Removed</th>
                      <th className="text-left py-2 font-semibold">Compliance Relevance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-2">🔐 Proprietary Name</td>
                      <td className="py-2">"AcmeHealth's API", "ACME"</td>
                      <td className="py-2">Third-party & contractual confidentiality</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-2">📁 File Paths</td>
                      <td className="py-2">/vault/.../checkpoint.pt</td>
                      <td className="py-2">Internal IP / data leak risk (SC-28)</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-2">📧 PII</td>
                      <td className="py-2">john.smith@acmehealth.ai</td>
                      <td className="py-2">GDPR / ISO 27001 A.9.2.1 (PII exposure)</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-2">📓 Sensitive Logs</td>
                      <td className="py-2">"private training logs"</td>
                      <td className="py-2">High-risk AI audit artifacts</td>
                    </tr>
                    <tr>
                      <td className="py-2">⚠️ Unstructured Ask</td>
                      <td className="py-2">Vague "make sure we're good under ISO"</td>
                      <td className="py-2">Weak mapping → now aligned with controls</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function ComplianceMapping({ inView }: { inView: boolean }) {
  const isMobile = useIsMobile();
  
  return (
    <div className="w-full flex flex-col items-center min-h-[50vh] md:min-h-[80vh]">
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        className="w-full flex flex-col items-center px-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1, duration: 0.7 }}
          className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 flex items-center gap-2 text-center"
          style={{ color: COLORS.header }}
        >
          <span role="img" aria-label="compliance">📋</span>Compliance Mapping
        </motion.div>
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-6 md:p-10 border border-[#E0E0E0] flex flex-col items-center relative overflow-hidden">
          {/* Compliance Table ONLY */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="w-full overflow-x-auto"
          >
            <table className="w-full text-left border-collapse rounded-xl overflow-hidden shadow-md" style={{ fontFamily: 'Inter, sans-serif', fontSize: isMobile ? 14 : 18 }}>
              <thead>
                <tr>
                  <th className="px-2 md:px-4 py-3 bg-[#F5F6FA] text-[#0E1E36] font-bold"><Tooltip text="NIST AI Risk Management Framework"><span className="flex items-center"><NistLogo />NIST AI RMF</span></Tooltip></th>
                  <th className="px-2 md:px-4 py-3 bg-[#F5F6FA] text-[#0E1E36] font-bold"><Tooltip text="ISO 27001 - Information Security Management"><span className="flex items-center">ISO 27001</span></Tooltip></th>
                  <th className="px-2 md:px-4 py-3 bg-[#F5F6FA] text-[#0E1E36] font-bold"><Tooltip text="General Data Protection Regulation"><span className="flex items-center">GDPR</span></Tooltip></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-2 md:px-4 py-2 md:py-3" style={{ background: '#0E1E36', color: '#fff', fontWeight: 600 }}><span className="flex items-center"><NistLogo />AI RMF 1.2 - Data Quality</span></td>
                  <td className="px-2 md:px-4 py-2 md:py-3" style={{ background: '#FF6F3C', color: '#fff', fontWeight: 600 }}>A.8.2 - Information Classification</td>
                  <td className="px-2 md:px-4 py-2 md:py-3" style={{ background: '#388E3C', color: '#fff', fontWeight: 600 }}>Art. 5(1)(c) - Data Minimization</td>
                </tr>
                <tr>
                  <td className="px-2 md:px-4 py-2 md:py-3" style={{ background: '#0E1E36', color: '#fff', fontWeight: 600 }}>AI RMF 1.7 - Secure Development</td>
                  <td className="px-2 md:px-4 py-2 md:py-3" style={{ background: '#FF6F3C', color: '#fff', fontWeight: 600 }}>A.14.2 - Security in Development</td>
                  <td className="px-2 md:px-4 py-2 md:py-3" style={{ background: '#388E3C', color: '#fff', fontWeight: 600 }}>Art. 25 - Privacy by Design</td>
                </tr>
                <tr>
                  <td className="px-2 md:px-4 py-2 md:py-3" style={{ background: '#0E1E36', color: '#fff', fontWeight: 600 }}>AI RMF 3.3 - Risk Monitoring</td>
                  <td className="px-2 md:px-4 py-2 md:py-3" style={{ background: '#FF6F3C', color: '#fff', fontWeight: 600 }}>A.12.4 - Logging and Monitoring</td>
                  <td className="px-2 md:px-4 py-2 md:py-3" style={{ background: '#388E3C', color: '#fff', fontWeight: 600 }}>Art. 30 - Records of Processing</td>
                </tr>
                <tr>
                  <td className="px-2 md:px-4 py-2 md:py-3" style={{ background: '#0E1E36', color: '#fff', fontWeight: 600 }}>AI RMF 4.1 - Documentation</td>
                  <td className="px-2 md:px-4 py-2 md:py-3" style={{ background: '#FF6F3C', color: '#fff', fontWeight: 600 }}>A.18.1 - Compliance with Requirements</td>
                  <td className="px-2 md:px-4 py-2 md:py-3" style={{ background: '#388E3C', color: '#fff', fontWeight: 600 }}>Art. 35 - Data Protection Impact Assessment</td>
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
  const isMobile = useIsMobile();
  
  return (
    <div className="w-full flex flex-col items-center min-h-[50vh] md:min-h-[80vh]">
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        className="w-full flex flex-col items-center px-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1, duration: 0.7 }}
          className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 flex items-center gap-2 text-center"
          style={{ color: COLORS.header }}
        >
          <span role="img" aria-label="redact">🔒</span>Redaction & Audit Logging
        </motion.div>
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-6 md:p-10 border border-[#E0E0E0] flex flex-col items-center relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="text-lg md:text-2xl mb-6 text-[#2D3748] flex items-center gap-2"
          >
            <motion.span
              initial={{ x: -40, opacity: 0 }}
              animate={inView ? { x: 0, opacity: 1 } : {}}
              transition={{ duration: 0.7, type: 'spring', bounce: 0.4 }}
              className="inline-block"
            >
              <svg width={isMobile ? "20" : "28"} height={isMobile ? "20" : "28"} fill="none" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="#FF6F3C"/><rect x="7" y="9" width="10" height="2" rx="1" fill="#fff"/><rect x="7" y="13" width="6" height="2" rx="1" fill="#fff"/></svg>
            </motion.span>
            <span className="text-center">Generate a technical report summarizing our AI model training with anonymized data sources and compliance recommendations.</span>
          </motion.div>
          
          {/* Audit Log Entry */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="w-full bg-[#F5F6FA] rounded-xl p-4 md:p-6 mb-6 border border-gray-200 overflow-x-auto"
          >
            <h3 className="text-base md:text-lg font-bold mb-3 text-[#0E1E36]">Audit Log Entry</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
              <div>
                <p className="font-semibold">Timestamp:</p>
                <p className="text-gray-600 break-all">{new Date().toISOString()}</p>
              </div>
              <div>
                <p className="font-semibold">User:</p>
                <p className="text-gray-600 break-all">user@organization.com</p>
              </div>
              <div>
                <p className="font-semibold">Original Risk Score:</p>
                <p className="text-red-600 font-bold">87/100 (High)</p>
              </div>
              <div>
                <p className="font-semibold">Optimized Risk Score:</p>
                <p className="text-green-600 font-bold">12/100 (Low)</p>
              </div>
              <div>
                <p className="font-semibold">Redactions:</p>
                <p className="text-gray-600">5 items (2 PII, 3 sensitive)</p>
              </div>
              <div>
                <p className="font-semibold">Control Mappings:</p>
                <p className="text-gray-600">NIST AI RMF, ISO 27001, GDPR</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="flex flex-wrap gap-2 md:gap-4 mb-4 justify-center"
          >
            <span className="bg-[#0E1E36] text-white px-3 md:px-4 py-1 md:py-2 rounded-full text-sm md:text-lg font-bold">Audit Log</span>
            <span className="bg-[#FF6F3C] text-white px-3 md:px-4 py-1 md:py-2 rounded-full text-sm md:text-lg font-bold">POAM</span>
            <span className="bg-green-700 text-white px-3 md:px-4 py-1 md:py-2 rounded-full text-sm md:text-lg font-bold">Export</span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.7, duration: 0.7 }}
            className="w-full bg-[#fff0e6] rounded-xl p-4 md:p-5 border border-[#FF6F3C] mt-4"
            style={{ 
              boxShadow: isMobile ? '0 0 8px 1px #FF6F3C' : '0 0 16px 2px #FF6F3C, 0 0 8px 2px #fff0e6', 
              border: '2px solid #FF6F3C' 
            }}
          >
            <h3 className="text-base md:text-lg font-bold mb-2" style={{ color: COLORS.accent }}>Risk Mitigation Actions</h3>
            <ul className="list-disc pl-5 text-xs md:text-sm space-y-1">
              <li>Automatically redacted proprietary client names</li>
              <li>Removed all file paths and internal system references</li>
              <li>Anonymized PII (email addresses)</li>
              <li>Clarified vague compliance requirements</li>
              <li>Generated audit-ready documentation</li>
            </ul>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function FinalOutput({ inView }: { inView: boolean }) {
  const isMobile = useIsMobile();
  
  return (
    <div className="w-full flex flex-col items-center min-h-[50vh] md:min-h-[80vh]">
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        className="w-full flex flex-col items-center px-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1, duration: 0.7 }}
          className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 flex items-center gap-2 text-center"
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
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6 md:p-10 border border-[#E0E0E0] flex flex-col items-center relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="text-lg md:text-2xl mb-4 text-green-700 font-bold text-center"
          >
            Ready to deploy safely in your org
          </motion.div>
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 mt-4 w-full">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 }}
              whileHover={{ scale: 1.05, boxShadow: "0px 10px 25px rgba(255, 111, 60, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              className="px-6 md:px-10 py-3 md:py-4 rounded-lg font-bold text-lg md:text-xl shadow transition w-full"
              style={{ 
                background: COLORS.accent, 
                color: '#fff', 
                border: 'none', 
                borderRadius: 12, 
                fontFamily: 'Inter, sans-serif'
              }}
            >
              Insert New Prompt
            </motion.button>
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.3 }}
              whileHover={{ scale: 1.05, boxShadow: "0px 10px 25px rgba(0, 30, 54, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              className="px-6 md:px-10 py-3 md:py-4 rounded-lg font-bold text-lg md:text-xl shadow transition w-full"
              style={{ 
                background: COLORS.header, 
                color: '#fff', 
                border: 'none', 
                borderRadius: 12, 
                fontFamily: 'Inter, sans-serif'
              }}
            >
              View Audit Log
            </motion.button>
          </div>
          
          {/* Add animated particles effect - reduced on mobile */}
          {inView && (
            <motion.div 
              className="absolute inset-0 -z-10 overflow-hidden rounded-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              {Array.from({ length: isMobile ? 10 : 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-green-500"
                  initial={{ 
                    x: Math.random() * 100 - 50 + "%", 
                    y: Math.random() * 100 - 50 + "%",
                    opacity: 0 
                  }}
                  animate={{ 
                    x: [null, Math.random() * 100 - 50 + "%", Math.random() * 100 - 50 + "%"],
                    y: [null, Math.random() * 100 - 50 + "%", Math.random() * 100 - 50 + "%"],
                    opacity: [0, isMobile ? 0.4 : 0.7, 0]
                  }}
                  transition={{ 
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2
                  }}
                />
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function FAQSection({ faqRef }: { faqRef?: React.RefObject<HTMLDivElement | null> }) {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <section ref={faqRef as React.LegacyRef<HTMLElement>} className="max-w-3xl mx-auto my-24 px-4">
      <h2 className="text-4xl font-bold mb-12 text-center" style={{ color: COLORS.header }}>Frequently Asked Questions</h2>
      
      <div className="space-y-4">
        {FAQS.map((faq, index) => (
          <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
              onClick={() => toggleItem(index)}
            >
              <span className="font-semibold text-gray-900">{faq.q}</span>
              <span className="text-gray-500 ml-4 flex-shrink-0">
                {openItems.includes(index) ? '−' : '+'}
              </span>
            </button>
            <AnimatePresence>
              {openItems.includes(index) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 py-4 border-t border-gray-200 text-gray-700">
                    {faq.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
  const isMobile = useIsMobile();
  const ref1 = useRef<HTMLDivElement>(null);
  const ref2 = useRef<HTMLDivElement>(null);
  const ref3 = useRef<HTMLDivElement>(null);
  const ref4 = useRef<HTMLDivElement>(null);
  const ref5 = useRef<HTMLDivElement>(null);
  
  // Mobile-optimized useInView - lower threshold for mobile devices
  const viewThreshold = isMobile ? 0.2 : 0.4;
  const inView1 = useInView(ref1, { amount: viewThreshold });
  const inView2 = useInView(ref2, { amount: viewThreshold });
  const inView3 = useInView(ref3, { amount: viewThreshold });
  const inView4 = useInView(ref4, { amount: viewThreshold });
  const inView5 = useInView(ref5, { amount: viewThreshold });
  const faqInView = faqRef ? useInView(faqRef, { amount: 0.1 }) : false;

  // Parallax backgrounds (reduced effect on mobile)
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 800], [0, isMobile ? 60 : 120]);
  const fgY = useTransform(scrollY, [0, 800], [0, isMobile ? 30 : 60]);

  const [activeStep, setActiveStep] = useState(0);
  // Show sidebar only when in journey and FAQ is not in view (desktop only)
  const showSidebar = !isMobile && (inView1 || inView2 || inView3 || inView4 || inView5) && !faqInView;

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
  }, [inView1, inView2, inView3, inView4, inView5]);

  return (
    <div style={{ ...FONT, background: COLORS.bg, color: COLORS.text, width: "100%", padding: 0 }} className="w-full py-12 md:py-24 lg:py-32 relative overflow-x-hidden">
      {/* Parallax background shapes - reduced on mobile */}
      {!isMobile && (
        <>
          <motion.div style={{ y: bgY }} className="absolute left-0 top-0 w-full h-96 z-0" aria-hidden>
            <div className="w-2/3 h-80 bg-[#FF6F3C]/10 rounded-full absolute left-[-10%] top-10 blur-2xl" />
            <div className="w-1/2 h-60 bg-[#0E1E36]/10 rounded-full absolute right-[-10%] top-40 blur-2xl" />
          </motion.div>
          <motion.div style={{ y: fgY }} className="absolute right-0 bottom-0 w-1/2 h-80 z-0" aria-hidden>
            <div className="w-full h-80 bg-[#FF6F3C]/20 rounded-full absolute right-[-20%] bottom-0 blur-2xl" />
          </motion.div>
        </>
      )}
      <div className="relative z-10 max-w-6xl mx-auto flex flex-col gap-16 md:gap-24 lg:gap-32 px-4 md:px-0">
        <div ref={(el) => {
          if (journeyRef && el) {
            (journeyRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
          }
          if (ref1 && el) {
            (ref1 as React.MutableRefObject<HTMLDivElement | null>).current = el;
          }
        }}><RiskDetection inView={inView1} /></div>
        <div ref={ref2}><PromptOptimizer inView={inView2} /></div>
        <div ref={ref3}><ComplianceMapping inView={inView3} /></div>
        <div ref={ref4}><RedactionAudit inView={inView4} /></div>
        <div ref={ref5}><FinalOutput inView={inView5} /></div>
      </div>
      {showSidebar && <ProgressSidebar activeStep={activeStep} />}
      <FAQSection faqRef={faqRef} />
    </div>
  );
} 