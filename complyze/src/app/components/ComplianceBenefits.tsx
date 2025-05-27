import React from "react";

const COLORS = {
  bg: "#FAF9F6",
  header: "#0E1E36",
  accent: "#FF6F3C",
  card: "#FFFFFF",
  divider: "#E0E0E0",
  text: "#2D3748",
  textSecondary: "#6B7280",
  cardLight: "#F5F6FA",
};

const FONT = {
  fontFamily: 'Inter, sans-serif',
};

export default function ComplianceBenefits() {
  return (
    <div
      style={{
        ...FONT,
        background: COLORS.bg,
        color: COLORS.text,
        width: '100%',
        padding: '0',
      }}
      className="w-full"
    >
      {/* Trust & Security Section */}
      <section
        className="max-w-3xl mx-auto px-4 md:px-0 py-12 md:py-16"
        style={{
          background: COLORS.cardLight,
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(14,30,54,0.06)',
          marginBottom: 48,
          border: `1px solid ${COLORS.divider}`,
        }}
      >
        <h2
          className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2"
          style={{ color: COLORS.header, fontFamily: 'Inter, sans-serif' }}
        >
          🛡️ Built for trust. Designed for compliance.
        </h2>
        <ul className="space-y-4 text-base md:text-lg" style={{ color: COLORS.text, fontSize: 16, fontWeight: 500 }}>
          <li className="flex items-start gap-2"><span className="text-[#FF6F3C] mt-1">•</span> Redact sensitive data before it leaves your system</li>
          <li className="flex items-start gap-2"><span className="text-[#FF6F3C] mt-1">•</span> Monitor and log every prompt in real time</li>
          <li className="flex items-start gap-2"><span className="text-[#FF6F3C] mt-1">•</span> Generate audit-ready reports with full framework coverage</li>
        </ul>
      </section>

      {/* Divider */}
      <div className="w-full" style={{ borderTop: `1.5px solid ${COLORS.divider}`, margin: '0 auto', maxWidth: 700, marginBottom: 48 }} />

      {/* Prompt Optimization Section */}
      <section className="max-w-3xl mx-auto px-4 md:px-0 py-12 md:py-16">
        <h2
          className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2"
          style={{ color: COLORS.header, fontFamily: 'Inter, sans-serif' }}
        >
          ⚙️ Your AI is only as smart as your prompts.
        </h2>
        <p className="mb-8 text-base md:text-lg" style={{ color: COLORS.textSecondary, fontSize: 16, maxWidth: 600 }}>
          Complyze rewrites vague, risky, or inefficient prompts into clear, secure, high-impact instructions—so your teams get better answers, faster, without guessing.
        </p>
        {/* Visual Example Split */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-stretch">
          <div
            className="flex-1 bg-[#fff0e6] border border-[#FF6F3C] rounded-lg p-5 text-base shadow-sm mb-4 md:mb-0"
            style={{ minWidth: 0 }}
          >
            <div className="mb-2 text-sm font-semibold text-[#FF6F3C]">Original Prompt</div>
            <div style={{ color: COLORS.text }}>
              Summarize this contract for me and make sure you don't miss anything important. Also, can you check for compliance issues?
            </div>
          </div>
          <div
            className="flex-1 bg-[#e6fff3] border border-green-500 rounded-lg p-5 text-base shadow-sm"
            style={{ minWidth: 0 }}
          >
            <div className="mb-2 text-sm font-semibold text-green-700">Optimized</div>
            <div style={{ color: COLORS.text }}>
              You are a legal analyst. Please provide a concise summary of the attached contract, highlighting all key terms and any potential compliance risks. Use bullet points for clarity.
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full" style={{ borderTop: `1.5px solid ${COLORS.divider}`, margin: '0 auto', maxWidth: 700, marginBottom: 48 }} />

      {/* Closing Call to Action */}
      <section className="max-w-2xl mx-auto px-4 md:px-0 py-12 md:py-16">
        <div
          className="rounded-xl text-center px-6 py-10 md:py-12 mb-8"
          style={{
            background: COLORS.accent,
            color: '#fff',
            fontSize: 18,
            fontWeight: 500,
            boxShadow: '0 2px 12px rgba(255,111,60,0.08)',
            borderRadius: 16,
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1.6 }}>
            AI isn't going away. Neither are the risks.<br />
            Complyze makes sure your team stays ahead—compliant, efficient, and fully empowered to use LLMs to their greatest potential.
          </span>
        </div>
        <button
          className="w-full md:w-auto px-8 py-3 rounded-lg font-bold text-lg shadow transition hover:bg-[#e65d2d]"
          style={{ background: COLORS.accent, color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'Inter, sans-serif', minWidth: 220 }}
        >
          Get Started Securely
        </button>
      </section>
    </div>
  );
} 