"use client";
import React, { useState, useRef, useEffect } from "react";
import PromptJourney from "./components/PromptJourney";

export default function Landing() {
  const [showModal, setShowModal] = useState<null | 'login' | 'signup' | 'pricing'>(null);
  const [loginFields, setLoginFields] = useState({ email: '', password: '' });
  const [signupFields, setSignupFields] = useState({ name: '', email: '', password: '', confirm: '' });
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Refs for journey and FAQ
  const journeyRef = useRef<HTMLDivElement | null>(null);
  const faqRef = useRef<HTMLDivElement | null>(null);

  // Close mobile menu on scroll or resize
  useEffect(() => {
    const handleScroll = () => {
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 768 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [mobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Authentication functions
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      console.log('Complyze UI: Attempting login with:', { email: loginFields.email });
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginFields.email,
          password: loginFields.password,
        }),
      });

      console.log('Complyze UI: Login response status:', response.status);
      const data = await response.json();
      console.log('Complyze UI: Login response data:', data);

      if (response.ok && data.success) {
        console.log('Complyze UI: Login successful, storing tokens and redirecting');
        // Store auth data in localStorage for the dashboard
        localStorage.setItem('complyze_token', data.access_token);
        localStorage.setItem('complyze_user', JSON.stringify(data.user));
        
        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        console.error('Complyze UI: Login failed:', data);
        setError(data.error || data.details || 'Login failed');
      }
    } catch (error) {
      console.error('Complyze UI: Login error:', error);
      setError('Login failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate passwords match
    if (signupFields.password !== signupFields.confirm) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      console.log('Complyze: Attempting signup with:', {
        email: signupFields.email,
        full_name: signupFields.name
      });

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: signupFields.email,
          password: signupFields.password,
          full_name: signupFields.name,
        }),
      });

      console.log('Complyze: Signup response status:', response.status);
      console.log('Complyze: Signup response ok:', response.ok);

      const data = await response.json();
      console.log('Complyze: Signup response data:', data);

      if (response.ok && data.success) {
        if (data.auto_login && data.access_token) {
          console.log('Complyze: Auto-login successful, storing tokens and redirecting');
          // Store auth data and redirect to dashboard
          localStorage.setItem('complyze_token', data.access_token);
          localStorage.setItem('complyze_user', JSON.stringify(data.user));
          window.location.href = '/dashboard';
        } else {
          console.log('Complyze: No auto-login, showing success message');
          // Show success message and switch to login
          setSuccess(data.message || 'Account created successfully! Please login.');
          setTimeout(() => {
            setShowModal('login');
            setLoginFields({ email: signupFields.email, password: '' });
          }, 2000);
        }
      } else {
        console.error('Complyze: Signup failed:', data);
        setError(data.error || 'Signup failed');
      }
    } catch (error) {
      console.error('Complyze: Signup error:', error);
      setError('Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Scroll handlers
  const handleJourneyClick = () => {
    if (journeyRef.current) {
      journeyRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false); // Close mobile menu after navigation
  };
  const handleFaqClick = () => {
    if (faqRef.current) {
      faqRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    setMobileMenuOpen(false); // Close mobile menu after navigation
  };

  const handlePricingClick = () => {
    setShowModal('pricing');
    setMobileMenuOpen(false); // Close mobile menu after navigation
  };

  const handleSignupClick = () => {
    setShowModal('signup');
    setMobileMenuOpen(false); // Close mobile menu after navigation
  };

  const handleLoginClick = () => {
    setShowModal('login');
    setMobileMenuOpen(false); // Close mobile menu after navigation
  };

  // Modal overlay and card styles
  const modalOverlay = {
    position: 'fixed' as const,
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(14,30,54,0.65)',
    zIndex: 50,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '1rem', // Add padding for mobile
  };
  const modalCard = {
    background: '#fff', 
    color: '#2D3748', 
    borderRadius: 12, 
    boxShadow: '0 4px 32px rgba(0,0,0,0.18)', 
    padding: '2.5rem 2rem 2rem', 
    minWidth: 320, // Reduced for mobile
    maxWidth: 380, 
    width: '100%', 
    fontFamily: 'Inter, sans-serif', 
    position: 'relative' as const,
    maxHeight: '90vh', // Prevent modal from being too tall on mobile
    overflowY: 'auto' as const, // Allow scrolling if needed
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
      <nav className="flex justify-between items-center px-4 sm:px-8 py-6 relative">
        <div className="text-xl sm:text-2xl font-light tracking-widest uppercase">COMPLYZE</div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-8 text-base font-normal items-center">
          <a 
            href="#process" 
            className="hover:underline cursor-pointer"
            onClick={(e) => { e.preventDefault(); handleJourneyClick(); }}
          >
            Process
          </a>
          <a 
            href="#faqs" 
            className="hover:underline cursor-pointer"
            onClick={(e) => { e.preventDefault(); handleFaqClick(); }}
          >
            FAQs
          </a>
          <a 
            href="#pricing" 
            className="hover:underline cursor-pointer"
            onClick={(e) => { e.preventDefault(); setShowModal('pricing'); }}
          >
            Pricing
          </a>
          <button
            className="ml-6 bg-white text-[#FF6F3C] border border-[#FF6F3C] px-5 py-2 rounded-md font-semibold text-base shadow hover:bg-orange-100 transition"
            onClick={() => setShowModal('signup')}
          >
            Sign Up
          </button>
          <button
            className="ml-2 bg-[#FF6F3C] text-white px-5 py-2 rounded-md font-semibold text-base shadow hover:bg-[#ff8a5c] transition"
            onClick={() => setShowModal('login')}
          >
            Login
          </button>
        </div>

        {/* Mobile Hamburger Menu Button */}
        <button
          className="md:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1.5 z-50"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </button>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-[#0E1E36] bg-opacity-95 z-40 flex flex-col justify-center items-center">
            <div className="flex flex-col space-y-8 text-center">
              <a 
                href="#process" 
                className="text-2xl font-normal hover:text-[#FF6F3C] transition-colors cursor-pointer"
                onClick={(e) => { e.preventDefault(); handleJourneyClick(); }}
              >
                Process
              </a>
              <a 
                href="#faqs" 
                className="text-2xl font-normal hover:text-[#FF6F3C] transition-colors cursor-pointer"
                onClick={(e) => { e.preventDefault(); handleFaqClick(); }}
              >
                FAQs
              </a>
              <a 
                href="#pricing" 
                className="text-2xl font-normal hover:text-[#FF6F3C] transition-colors cursor-pointer"
                onClick={(e) => { e.preventDefault(); handlePricingClick(); }}
              >
                Pricing
              </a>
              <button
                className="bg-white text-[#FF6F3C] border border-[#FF6F3C] px-8 py-3 rounded-md font-semibold text-lg shadow hover:bg-orange-100 transition"
                onClick={handleSignupClick}
              >
                Sign Up
              </button>
              <button
                className="bg-[#FF6F3C] text-white px-8 py-3 rounded-md font-semibold text-lg shadow hover:bg-[#ff8a5c] transition"
                onClick={handleLoginClick}
              >
                Login
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Login/Signup Modal */}
      {showModal === 'login' && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <button style={closeBtn} aria-label="Close" onClick={() => setShowModal(null)}>&times;</button>
            <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 18, color: '#0E1E36' }}>Login to Complyze</div>
            {error && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>
                {error}
              </div>
            )}
            <form onSubmit={handleLogin}>
              <label style={labelStyle} htmlFor="login-email">Email</label>
              <input style={inputStyle} id="login-email" type="email" autoComplete="email" required value={loginFields.email} onChange={e => setLoginFields(f => ({ ...f, email: e.target.value }))} />
              <label style={labelStyle} htmlFor="login-password">Password</label>
              <input style={inputStyle} id="login-password" type="password" autoComplete="current-password" required value={loginFields.password} onChange={e => setLoginFields(f => ({ ...f, password: e.target.value }))} />
              <button type="submit" style={{...buttonStyle, opacity: loading ? 0.6 : 1}} disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
            <div style={{ marginTop: 18, fontSize: 15, color: '#6B7280', textAlign: 'center' }}>
              Don&apos;t have an account?
              <span style={switchLink} onClick={() => {
                setShowModal('signup');
                setError('');
                setSuccess('');
              }}>Sign up</span>
            </div>
          </div>
        </div>
      )}
      {showModal === 'signup' && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <button style={closeBtn} aria-label="Close" onClick={() => setShowModal(null)}>&times;</button>
            <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 18, color: '#0E1E36' }}>Sign Up for Complyze</div>
            {error && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ background: '#dcfce7', color: '#16a34a', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>
                {success}
              </div>
            )}
            <form onSubmit={handleSignup}>
              <label style={labelStyle} htmlFor="signup-name">Full Name</label>
              <input style={inputStyle} id="signup-name" type="text" autoComplete="name" required value={signupFields.name} onChange={e => setSignupFields(f => ({ ...f, name: e.target.value }))} />
              <label style={labelStyle} htmlFor="signup-email">Email</label>
              <input style={inputStyle} id="signup-email" type="email" autoComplete="email" required value={signupFields.email} onChange={e => setSignupFields(f => ({ ...f, email: e.target.value }))} />
              <label style={labelStyle} htmlFor="signup-password">Password</label>
              <input style={inputStyle} id="signup-password" type="password" autoComplete="new-password" required value={signupFields.password} onChange={e => setSignupFields(f => ({ ...f, password: e.target.value }))} />
              <label style={labelStyle} htmlFor="signup-confirm">Confirm Password</label>
              <input style={inputStyle} id="signup-confirm" type="password" autoComplete="new-password" required value={signupFields.confirm} onChange={e => setSignupFields(f => ({ ...f, confirm: e.target.value }))} />
              <button type="submit" style={{...buttonStyle, opacity: loading ? 0.6 : 1}} disabled={loading}>
                {loading ? 'Signing up...' : 'Sign Up'}
              </button>
            </form>
            <div style={{ marginTop: 18, fontSize: 15, color: '#6B7280', textAlign: 'center' }}>
              Already have an account?
              <span style={switchLink} onClick={() => {
                setShowModal('login');
                setError('');
                setSuccess('');
              }}>Login</span>
            </div>
          </div>
        </div>
      )}
      {showModal === 'pricing' && (
        <div style={modalOverlay}>
          <div style={{ ...modalCard, maxWidth: 900, minWidth: 320, width: '95%', padding: '1.5rem 1rem 1rem' }}>
            <button style={closeBtn} aria-label="Close" onClick={() => setShowModal(null)}>&times;</button>
            <div className="mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-[#0E1E36] mb-2 sm:mb-3 text-center">Serious prompt-security starts free.</h2>
              <div className="flex justify-center items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <span className={`font-semibold text-sm sm:text-base ${!isAnnual ? 'text-[#FF6F3C]' : 'text-[#0E1E36]'}`}>Monthly</span>
                <label className="inline-flex relative items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={isAnnual}
                    onChange={(e) => setIsAnnual(e.target.checked)}
                  />
                  <div className="relative w-10 sm:w-12 h-5 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-400 rounded-full peer dark:bg-gray-700 peer-checked:bg-[#FF6F3C] transition-colors">
                    <div className={`absolute top-0.5 left-0.5 bg-white border border-gray-300 rounded-full h-4 w-4 sm:h-5 sm:w-5 transition-transform ${isAnnual ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0'}`}></div>
                  </div>
                  <span className={`ml-2 font-semibold text-sm sm:text-base ${isAnnual ? 'text-[#FF6F3C]' : 'text-[#0E1E36]'}`}>Annual <span className="text-xs text-orange-500">(save 20%)</span></span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
              {/* Starter */}
              <div className={`bg-white rounded-lg shadow p-3 sm:p-4 flex flex-col border border-slate-200 transition-opacity ${isAnnual ? 'opacity-50' : 'opacity-100'}`}>
                <div className="text-sm sm:text-base font-bold text-[#0E1E36] mb-2">Starter <span className="ml-1 sm:ml-2 bg-gray-200 text-[#0E1E36] px-1 sm:px-2 py-1 rounded-full text-xs">Free Trial</span></div>
                <div className="text-xl sm:text-2xl font-extrabold text-[#0E1E36] mb-1">$0</div>
                <div className="text-xs text-[#6B7280] mb-2 sm:mb-3">14-day trial • no credit card</div>
                <ul className="text-xs sm:text-sm text-[#0E1E36] mb-3 sm:mb-4 space-y-1 flex-1">
                  <li>✓ 500 prompt analyses / mo</li>
                  <li>✓ Basic redaction patterns</li>
                  <li>✓ Low/Med risk scoring</li>
                  <li>✓ View daily spend</li>
                  <li>✓ 1 report template</li>
                  <li>✓ 1 seat</li>
                  <li>✓ Chrome extension</li>
                  <li>✓ Community Slack support</li>
                </ul>
                <button className={`bg-white text-[#0E1E36] border border-[#0E1E36] rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm font-bold hover:bg-gray-100 transition ${isAnnual ? 'cursor-not-allowed' : 'cursor-pointer'}`}>Start free trial</button>
              </div>
              {/* Pro (Most Popular) */}
              <div className="bg-white rounded-lg shadow p-3 sm:p-4 flex flex-col border-2 border-orange-400 relative">
                <div className="absolute -top-2 sm:-top-3 left-1/2 -translate-x-1/2 bg-[#FF6F3C] text-white px-2 py-1 rounded-full text-xs font-bold shadow">Most Popular</div>
                <div className="text-sm sm:text-base font-bold text-[#0E1E36] mb-2">Pro</div>
                <div className="text-xl sm:text-2xl font-extrabold text-[#FF6F3C] mb-1">${isAnnual ? '470' : '49'} <span className="text-xs sm:text-sm text-[#0E1E36]">/ user / {isAnnual ? 'year' : 'mo'}</span></div>
                <div className="text-xs text-[#6B7280] mb-2 sm:mb-3">Most popular</div>
                <ul className="text-xs sm:text-sm text-[#0E1E36] mb-3 sm:mb-4 space-y-1 flex-1">
                  <li>✓ 10,000 prompt analyses / mo</li>
                  <li>✓ AI-contextual + custom regex redaction</li>
                  <li>✓ Low/Med/High risk + trend alerts</li>
                  <li>✓ Monthly projection + alerts</li>
                  <li>✓ 5 report templates (FedRAMP, NIST, AI RMF)</li>
                  <li>✓ 5 seats</li>
                  <li>✓ REST API, Slack alerts</li>
                  <li>✓ Priority email support (48h)</li>
                </ul>
                <button className="bg-[#FF6F3C] text-white rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm font-bold shadow hover:bg-[#ff8a5c] transition">Upgrade now</button>
              </div>
              {/* Team/Enterprise */}
              <div className="bg-white rounded-lg shadow p-3 sm:p-4 flex flex-col border border-slate-200">
                <div className="text-sm sm:text-base font-bold text-[#0E1E36] mb-2">Team / Enterprise</div>
                <div className="text-xl sm:text-2xl font-extrabold text-[#0E1E36] mb-1">${isAnnual ? '4,790' : '499'}<span className="text-xs sm:text-sm">/ {isAnnual ? 'year' : 'mo'}</span></div>
                <div className="text-xs text-[#6B7280] mb-2 sm:mb-3">volume & SSO included</div>
                <ul className="text-xs sm:text-sm text-[#0E1E36] mb-3 sm:mb-4 space-y-1 flex-1">
                  <li>✓ 100,000+ prompt analyses / mo</li>
                  <li>✓ everything + on-prem redactor</li>
                  <li>✓ Advanced risk + SLA triggers</li>
                  <li>✓ Multi-project roll-ups</li>
                  <li>✓ All templates (SOC 2, ISO 27001, OWASP)</li>
                  <li>✓ 20+ seats, SAML/SCIM</li>
                  <li>✓ SIEM, Splunk, custom webhooks</li>
                  <li>✓ 99.9% SLA, dedicated CSM</li>
                </ul>
                <button className="border border-[#0E1E36] text-[#0E1E36] rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm font-bold hover:bg-[#0E1E36] hover:text-white transition">Talk to sales</button>
              </div>
            </div>
            <div className="text-xs text-[#6B7280] mt-3 sm:mt-4 text-center">All prices in USD. Usage above plan allowance billed at $3 / 1k flagged prompts.</div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-12 sm:py-20 px-4">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-extralight mb-4 sm:mb-6 leading-tight max-w-4xl">LLM risk is invisible—until it's inevitable.</h1>
        <p className="text-base sm:text-lg md:text-2xl font-normal mb-8 sm:mb-10 max-w-2xl px-4">Executives and regulators are asking: 'How are we using AI responsibly?' Complyze gives you an answer before you're scrambling for one.</p>
        {/* <a href="#how-it-works" className="bg-[#FF6F3C] text-white font-bold text-lg px-8 py-4 rounded-lg shadow-lg hover:bg-[#ff8a5c] transition">See how it works</a> */}
      </section>

      {/* Desktop App Download Section */}
      <section className="bg-gradient-to-r from-[#0E1E36] to-[#1a2b4a] py-16 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-white">
              Complyze Desktop
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto">
              Real-time AI prompt monitoring that lives in your menu bar. Never miss a risky prompt again.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
            {/* Features */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-[#FF6F3C] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">⚡</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Real-Time Monitoring</h3>
                  <p className="text-gray-300">Automatically detects and analyzes AI prompts across ChatGPT, Claude, Gemini, and more.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-[#FF6F3C] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🛡️</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Menu Bar Integration</h3>
                  <p className="text-gray-300">Lives quietly in your macOS menu bar with instant access to your dashboard and settings.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-[#FF6F3C] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">📊</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Seamless Sync</h3>
                  <p className="text-gray-300">All detections automatically sync with your Complyze dashboard for comprehensive reporting.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-[#FF6F3C] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🔒</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Privacy First</h3>
                  <p className="text-gray-300">Your prompts are analyzed locally with optional cloud sync. You control your data.</p>
                </div>
              </div>
            </div>
            
            {/* Download Section */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">Download for macOS</h3>
                <p className="text-gray-300 mb-6">Compatible with macOS 10.15 or later</p>
                
                <div className="space-y-4">
                  {/* Apple Silicon Download */}
                  <a 
                    href="/downloads/ComplyzeDesktop-macOS-Apple.dmg"
                    download
                    className="block w-full bg-[#FF6F3C] hover:bg-[#ff8a5c] text-white font-bold py-4 px-6 rounded-lg transition-colors shadow-lg"
                  >
                    <div className="flex items-center justify-center space-x-3">
                      <span className="text-xl">🍎</span>
                      <div className="text-left">
                        <div className="text-lg">Download for Mac</div>
                        <div className="text-sm opacity-90">Apple Silicon (M1, M2, M3)</div>
                      </div>
                    </div>
                  </a>
                  
                  {/* Intel Download */}
                  <a 
                    href="/downloads/ComplyzeDesktop-macOS-Intel.dmg"
                    download
                    className="block w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-center space-x-3">
                      <span className="text-xl">💻</span>
                      <div className="text-left">
                        <div className="text-lg">Download for Mac</div>
                        <div className="text-sm opacity-90">Intel Processor</div>
                      </div>
                    </div>
                  </a>
                </div>
                
                <div className="mt-6 text-sm text-gray-400">
                  <p className="mb-2">
                    <strong>Version 1.0.0</strong> • Free with Complyze account
                  </p>
                  <p>
                    Not sure which version? Most newer Macs use Apple Silicon.
                  </p>
                </div>
              </div>
              
              {/* Installation Steps */}
              <div className="border-t border-white/20 pt-6">
                <h4 className="text-lg font-semibold text-white mb-4">Quick Install:</h4>
                <ol className="text-sm text-gray-300 space-y-2">
                  <li className="flex items-start space-x-2">
                    <span className="text-[#FF6F3C] font-bold">1.</span>
                    <span>Download and open the DMG file</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-[#FF6F3C] font-bold">2.</span>
                    <span>Drag Complyze Desktop to Applications</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-[#FF6F3C] font-bold">3.</span>
                    <span>Launch and login with your Complyze account</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-[#FF6F3C] font-bold">4.</span>
                    <span>Look for the Complyze icon in your menu bar</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chrome Extension Section */}
      <section className="bg-gradient-to-r from-[#1a2b4a] to-[#0E1E36] py-16 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-white">
              Complyze Chrome Extension
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto">
              Browser-based AI prompt security that works wherever you work. Protect your prompts across any web-based AI tool.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
            {/* Download Section */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">Install for Chrome</h3>
                <p className="text-gray-300 mb-6">Works with Chrome, Edge, Brave, and other Chromium browsers</p>
                
                <div className="space-y-4">
                  {/* Chrome Web Store */}
                  <a 
                    href="https://chromewebstore.google.com/detail/complyze-ai-prompt-securi/your-extension-id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-[#FF6F3C] hover:bg-[#ff8a5c] text-white font-bold py-4 px-6 rounded-lg transition-colors shadow-lg"
                  >
                    <div className="flex items-center justify-center space-x-3">
                      <span className="text-xl">🌐</span>
                      <div className="text-left">
                        <div className="text-lg">Add to Chrome</div>
                        <div className="text-sm opacity-90">Free from Chrome Web Store</div>
                      </div>
                    </div>
                  </a>
                  
                  {/* Manual Install */}
                  <a 
                    href="/downloads/complyze-extension-v2.zip"
                    download
                    className="block w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-center space-x-3">
                      <span className="text-xl">📦</span>
                      <div className="text-left">
                        <div className="text-lg">Manual Install</div>
                        <div className="text-sm opacity-90">For enterprise deployments</div>
                      </div>
                    </div>
                  </a>
                </div>
                
                <div className="mt-6 text-sm text-gray-400">
                  <p className="mb-2">
                    <strong>Version 2.0</strong> • Free with Complyze account
                  </p>
                  <p>
                    Compatible with all Chromium-based browsers
                  </p>
                </div>
              </div>
              
              {/* Installation Steps */}
              <div className="border-t border-white/20 pt-6">
                <h4 className="text-lg font-semibold text-white mb-4">Quick Install:</h4>
                <ol className="text-sm text-gray-300 space-y-2">
                  <li className="flex items-start space-x-2">
                    <span className="text-[#FF6F3C] font-bold">1.</span>
                    <span>Click "Add to Chrome" above</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-[#FF6F3C] font-bold">2.</span>
                    <span>Click "Add Extension" in the popup</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-[#FF6F3C] font-bold">3.</span>
                    <span>Pin the extension to your toolbar</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-[#FF6F3C] font-bold">4.</span>
                    <span>Login with your Complyze account</span>
                  </li>
                </ol>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-[#FF6F3C] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🔍</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Universal Detection</h3>
                  <p className="text-gray-300">Works on ChatGPT, Claude, Gemini, Perplexity, and any web-based AI tool automatically.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-[#FF6F3C] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">⚠️</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Instant Alerts</h3>
                  <p className="text-gray-300">Get immediate warnings when sensitive data is detected in your prompts before you hit send.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-[#FF6F3C] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">✨</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Smart Redaction</h3>
                  <p className="text-gray-300">Automatically replace sensitive information with safe placeholders while preserving context.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-[#FF6F3C] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🔗</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Seamless Integration</h3>
                  <p className="text-gray-300">Works invisibly in the background, syncing all activity to your Complyze dashboard.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-[#FF6F3C] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">⚙️</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Customizable Rules</h3>
                  <p className="text-gray-300">Configure detection patterns and redaction rules to match your organization's security policies.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prompt Enhancement Tool Section */}
      <section className="bg-[#FAF9F6] text-[#0E1E36] py-12 sm:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-center">Your Prompts Aren't Working Hard Enough</h2>
          <p className="text-base sm:text-lg md:text-xl text-center mb-8 sm:mb-10 max-w-4xl mx-auto">Most teams underutilize their LLMs. Complyze rewrites prompts using best practices learned from top models from OpenAI, Anthropic, Google, and major academic institutions.</p>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 sm:gap-10">
            {/* Bullets */}
            
            {/* Visual: Before/After */}
            <div className="flex-1 flex flex-col items-center">
              <div className="w-full max-w-md">
                <div className="mb-2 text-sm font-semibold text-[#FF6F3C]">Before</div>
                <div className="bg-[#fff0e6] border border-[#FF6F3C] rounded-lg p-3 sm:p-4 mb-4 text-[#0E1E36] text-sm sm:text-base shadow-sm">
                  Summarize this contract for me and make sure you don't miss anything important. Also, can you check for compliance issues?
                </div>
                <div className="mb-2 text-sm font-semibold text-green-700">Enhanced</div>
                <div className="bg-[#e6fff3] border border-green-500 rounded-lg p-3 sm:p-4 text-[#0E1E36] text-sm sm:text-base shadow-sm">
                  You are a legal analyst. Please provide a concise summary of the attached contract, highlighting all key terms and any potential compliance risks. Use bullet points for clarity.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Insert PromptJourney below the prompt enhancement section */}
      <PromptJourney journeyRef={journeyRef} faqRef={faqRef} />
    </div>
  );
} 