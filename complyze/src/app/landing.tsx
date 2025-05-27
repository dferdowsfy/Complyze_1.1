import React, { useState } from "react";

export default function Landing() {
  const [showModal, setShowModal] = useState<null | 'login' | 'signup'>(null);
  const [loginFields, setLoginFields] = useState({ email: '', password: '' });
  const [signupFields, setSignupFields] = useState({ name: '', email: '', password: '', confirm: '' });

  // Modal overlay and card styles
  const modalOverlay = {
    position: 'fixed' as const,
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(14,30,54,0.65)',
    zIndex: 50,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
  const modalCard = {
    background: '#fff', color: '#2D3748', borderRadius: 12, boxShadow: '0 4px 32px rgba(0,0,0,0.18)', padding: '2.5rem 2rem 2rem', minWidth: 340, maxWidth: 380, width: '100%', fontFamily: 'Inter, sans-serif', position: 'relative' as const,
  };
  const inputStyle = {
    border: '1px solid #ccc', borderRadius: 6, padding: '12px 14px', fontSize: 16, width: '100%', marginBottom: 16,
  };
  const labelStyle = { fontWeight: 600, fontSize: 15, marginBottom: 4, display: 'block' };
  const buttonStyle = {
    background: '#FF6F3C', color: '#fff', border: 'none', borderRadius: 6, padding: '13px 0', fontWeight: 700, fontSize: 17, width: '100%', marginTop: 8, cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  };
  const closeBtn = {
    position: 'absolute' as const, top: 18, right: 18, background: 'none', border: 'none', fontSize: 22, color: '#6B7280', cursor: 'pointer', fontWeight: 700,
  };
  const switchLink = { color: '#FF6F3C', fontWeight: 600, cursor: 'pointer', marginLeft: 4 };

  return (
    <div className="min-h-screen bg-[#0E1E36] font-sans text-white">
      {/* Top Navigation */}
      <nav className="flex justify-between items-center px-8 py-6">
        <div className="text-2xl font-extrabold tracking-widest uppercase">COMPLYZE</div>
        <div className="flex gap-8 text-base font-medium items-center">
          {/* <a href="#how-it-works" className="hover:underline">How it Works</a> */}
          <a href="#faqs" className="hover:underline">FAQs</a>
          <button
            className="ml-8 bg-[#FF6F3C] text-white px-5 py-2 rounded-md font-semibold text-base shadow hover:bg-[#ff8a5c] transition"
            onClick={() => setShowModal('login')}
            style={{ marginLeft: 32 }}
          >
            Login / Sign Up
          </button>
        </div>
      </nav>

      {/* Login/Signup Modal */}
      {showModal && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <button style={closeBtn} aria-label="Close" onClick={() => setShowModal(null)}>&times;</button>
            {showModal === 'login' ? (
              <>
                <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 18, color: '#0E1E36' }}>Login to Complyze</div>
                <form onSubmit={e => { e.preventDefault(); }}>
                  <label style={labelStyle} htmlFor="login-email">Email</label>
                  <input style={inputStyle} id="login-email" type="email" autoComplete="email" required value={loginFields.email} onChange={e => setLoginFields(f => ({ ...f, email: e.target.value }))} />
                  <label style={labelStyle} htmlFor="login-password">Password</label>
                  <input style={inputStyle} id="login-password" type="password" autoComplete="current-password" required value={loginFields.password} onChange={e => setLoginFields(f => ({ ...f, password: e.target.value }))} />
                  <button type="submit" style={buttonStyle}>Login</button>
                </form>
                <div style={{ marginTop: 18, fontSize: 15, color: '#6B7280', textAlign: 'center' }}>
                  Don&apos;t have an account?
                  <span style={switchLink} onClick={() => setShowModal('signup')}>Sign up</span>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 18, color: '#0E1E36' }}>Sign Up for Complyze</div>
                <form onSubmit={e => { e.preventDefault(); }}>
                  <label style={labelStyle} htmlFor="signup-name">Full Name</label>
                  <input style={inputStyle} id="signup-name" type="text" autoComplete="name" required value={signupFields.name} onChange={e => setSignupFields(f => ({ ...f, name: e.target.value }))} />
                  <label style={labelStyle} htmlFor="signup-email">Email</label>
                  <input style={inputStyle} id="signup-email" type="email" autoComplete="email" required value={signupFields.email} onChange={e => setSignupFields(f => ({ ...f, email: e.target.value }))} />
                  <label style={labelStyle} htmlFor="signup-password">Password</label>
                  <input style={inputStyle} id="signup-password" type="password" autoComplete="new-password" required value={signupFields.password} onChange={e => setSignupFields(f => ({ ...f, password: e.target.value }))} />
                  <label style={labelStyle} htmlFor="signup-confirm">Confirm Password</label>
                  <input style={inputStyle} id="signup-confirm" type="password" autoComplete="new-password" required value={signupFields.confirm} onChange={e => setSignupFields(f => ({ ...f, confirm: e.target.value }))} />
                  <button type="submit" style={buttonStyle}>Sign Up</button>
                </form>
                <div style={{ marginTop: 18, fontSize: 15, color: '#6B7280', textAlign: 'center' }}>
                  Already have an account?
                  <span style={switchLink} onClick={() => setShowModal('login')}>Login</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-20 px-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">LLM risk is invisible—until it's inevitable.</h1>
        <p className="text-lg md:text-2xl font-medium mb-10 max-w-2xl">Executives and regulators are asking: 'How are we using AI responsibly?' Complyze gives you an answer before you're scrambling for one.</p>
        {/* <a href="#how-it-works" className="bg-[#FF6F3C] text-white font-bold text-lg px-8 py-4 rounded-lg shadow-lg hover:bg-[#ff8a5c] transition">See how it works</a> */}
      </section>

      {/* Prompt Enhancement Tool Section */}
      <section className="bg-[#FAF9F6] text-[#0E1E36] py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">Your Prompts Aren't Working Hard Enough</h2>
          <p className="text-lg md:text-xl text-center mb-10">Most teams underutilize their LLMs. Complyze rewrites prompts using best practices learned from top models from OpenAI, Anthropic, Google,  and major academic institutions.</p>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-10">
            {/* Bullets */}
            <ul className="flex-1 space-y-4 text-lg">
              <li className="flex items-start gap-3"><span className="text-green-600 mt-1">✔</span>
                {/* Visual: Before/After */}
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full max-w-md">
                    <div className="mb-2 text-sm font-semibold text-[#FF6F3C]">Before</div>
                    <div className="bg-[#fff0e6] border border-[#FF6F3C] rounded-lg p-4 mb-4 text-[#0E1E36] text-base shadow-sm">
                      Summarize this contract for me and make sure you don't miss anything important. Also, can you check for compliance issues?
                    </div>
                    <div className="mb-2 text-sm font-semibold text-green-700">Enhanced</div>
                    <div className="bg-[#e6fff3] border border-green-500 rounded-lg p-4 text-[#0E1E36] text-base shadow-sm">
                      You are a legal analyst. Please provide a concise summary of the attached contract, highlighting all key terms and any potential compliance risks. Use bullet points for clarity.
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
} 