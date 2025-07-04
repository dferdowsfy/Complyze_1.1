"use client";
import React, { useState, useRef, useEffect } from "react";
import PromptJourney from "./components/PromptJourney";
import PersonaCards from "./components/PersonaCards";

export default function Landing() {
  const [showModal, setShowModal] = useState<null | 'login' | 'signup' | 'pricing' | 'demo'>(null);
  const [loginFields, setLoginFields] = useState({ email: '', password: '' });
  const [signupFields, setSignupFields] = useState({ name: '', email: '', password: '', confirm: '' });
  const [demoFields, setDemoFields] = useState({ 
    name: '', 
    email: '', 
    company: '', 
    phone: '', 
    message: '', 
    use_case: '', 
    team_size: '' 
  });
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
        if (data.refresh_token) {
          localStorage.setItem('complyze_refresh_token', data.refresh_token);
        }
        
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
          if (data.refresh_token) {
            localStorage.setItem('complyze_refresh_token', data.refresh_token);
          }
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

  const handleDemoRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Complyze: Submitting demo request for:', demoFields.email);

      const response = await fetch('/api/demo/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(demoFields),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message || 'Demo request submitted successfully! Our team will contact you within 24 hours.');
        // Reset form
        setDemoFields({ 
          name: '', 
          email: '', 
          company: '', 
          phone: '', 
          message: '', 
          use_case: '', 
          team_size: '' 
        });
        // Close modal after 3 seconds
        setTimeout(() => {
          setShowModal(null);
          setSuccess('');
        }, 3000);
      } else {
        setError(data.error || 'Failed to submit demo request');
      }
    } catch (error) {
      console.error('Complyze: Demo request error:', error);
      setError('Failed to submit demo request. Please try again.');
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

  const handleDemoClick = () => {
    setShowModal('demo');
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

  // Count-up animation hook
  const useCountUp = (target: number, duration: number = 2000) => {
    const [count, setCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
          }
        },
        { threshold: 0.5 }
      );

      if (ref.current) {
        observer.observe(ref.current);
      }

      return () => observer.disconnect();
    }, [isVisible]);

    useEffect(() => {
      if (!isVisible) return;

      let startTime: number;
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        
        setCount(Math.floor(progress * target));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }, [isVisible, target, duration]);

    return { count, ref };
  };

  // CountUpSection component
  const CountUpSection = () => {
    const { count, ref } = useCountUp(85);
    
    return (
      <div ref={ref} className="flex items-center justify-center gap-8 md:gap-12">
        <div className="text-left max-w-4xl">
          <div className="flex items-baseline gap-2 mb-4 flex-wrap">
            <span className="text-2xl md:text-3xl text-red-600 font-bold whitespace-nowrap">Don't be part of the</span>
            <span 
              className="text-6xl md:text-8xl font-bold tabular-nums"
              style={{ color: '#FF6F3C' }}
            >
              {count}%
            </span>
            <span className="text-2xl md:text-3xl text-gray-800 font-bold">of organizations underutilizing their AI</span>
          </div>
          <p className="text-base md:text-lg text-gray-600 leading-relaxed">
            Most teams are leaving massive value on the table through poor prompts, security vulnerabilities, and missed optimization opportunities.
          </p>
        </div>
      </div>
    );
  };

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
            className="ml-6 bg-transparent text-white border border-white px-4 py-2 rounded-md font-semibold text-base hover:bg-white hover:text-[#0E1E36] transition"
            onClick={handleDemoClick}
          >
            Request Demo
          </button>
          <button
            className="ml-2 bg-white text-[#FF6F3C] border border-[#FF6F3C] px-5 py-2 rounded-md font-semibold text-base shadow hover:bg-orange-100 transition"
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
                className="bg-transparent text-white border border-white px-8 py-3 rounded-md font-semibold text-lg hover:bg-white hover:text-[#0E1E36] transition"
                onClick={handleDemoClick}
              >
                Request Demo
              </button>
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
      {showModal === 'demo' && (
        <div style={modalOverlay}>
          <div style={{ ...modalCard, maxWidth: 600, minWidth: 320, width: '95%' }}>
            <button style={closeBtn} aria-label="Close" onClick={() => setShowModal(null)}>&times;</button>
            <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 18, color: '#0E1E36' }}>Request a Demo</div>
            <p style={{ color: '#6B7280', marginBottom: 20, fontSize: 15 }}>
              See how Complyze can protect your organization's AI usage. Our team will show you a personalized demo and answer your questions.
            </p>
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
            <form onSubmit={handleDemoRequest}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle} htmlFor="demo-name">Full Name *</label>
                  <input 
                    style={inputStyle} 
                    id="demo-name" 
                    type="text" 
                    required 
                    value={demoFields.name} 
                    onChange={e => setDemoFields(f => ({ ...f, name: e.target.value }))} 
                  />
                </div>
                <div>
                  <label style={labelStyle} htmlFor="demo-email">Work Email *</label>
                  <input 
                    style={inputStyle} 
                    id="demo-email" 
                    type="email" 
                    required 
                    value={demoFields.email} 
                    onChange={e => setDemoFields(f => ({ ...f, email: e.target.value }))} 
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle} htmlFor="demo-company">Company</label>
                  <input 
                    style={inputStyle} 
                    id="demo-company" 
                    type="text" 
                    value={demoFields.company} 
                    onChange={e => setDemoFields(f => ({ ...f, company: e.target.value }))} 
                  />
                </div>
                <div>
                  <label style={labelStyle} htmlFor="demo-phone">Phone</label>
                  <input 
                    style={inputStyle} 
                    id="demo-phone" 
                    type="tel" 
                    value={demoFields.phone} 
                    onChange={e => setDemoFields(f => ({ ...f, phone: e.target.value }))} 
                  />
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle} htmlFor="demo-use-case">Primary Use Case</label>
                <select 
                  style={inputStyle} 
                  id="demo-use-case" 
                  value={demoFields.use_case} 
                  onChange={e => setDemoFields(f => ({ ...f, use_case: e.target.value }))}
                >
                  <option value="">Select your primary use case</option>
                  <option value="compliance">Compliance & Risk Management</option>
                  <option value="security">Security & Data Protection</option>
                  <option value="governance">AI Governance</option>
                  <option value="monitoring">Employee AI Usage Monitoring</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle} htmlFor="demo-team-size">Team Size</label>
                <select 
                  style={inputStyle} 
                  id="demo-team-size" 
                  value={demoFields.team_size} 
                  onChange={e => setDemoFields(f => ({ ...f, team_size: e.target.value }))}
                >
                  <option value="">Select team size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-1000">201-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle} htmlFor="demo-message">Additional Information</label>
                <textarea 
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} 
                  id="demo-message" 
                  placeholder="Tell us about your specific needs or questions..."
                  value={demoFields.message} 
                  onChange={e => setDemoFields(f => ({ ...f, message: e.target.value }))} 
                />
              </div>
              <button type="submit" style={{...buttonStyle, opacity: loading ? 0.6 : 1}} disabled={loading}>
                {loading ? 'Submitting...' : 'Request Demo'}
              </button>
            </form>
            <div style={{ marginTop: 18, fontSize: 13, color: '#6B7280', textAlign: 'center' }}>
              Our team typically responds within 24 hours during business days.
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
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <button 
            onClick={handleDemoClick}
            className="bg-[#FF6F3C] text-white font-bold text-lg px-8 py-4 rounded-lg shadow-lg hover:bg-[#ff8a5c] transition"
          >
            Request a Demo
          </button>
          <button 
            onClick={handleSignupClick}
            className="bg-white text-[#FF6F3C] border-2 border-[#FF6F3C] font-bold text-lg px-8 py-4 rounded-lg shadow-lg hover:bg-[#FF6F3C] hover:text-white transition"
          >
            Start Free Trial
          </button>
        </div>
      </section>

      {/* Persona Cards Section */}
      <PersonaCards />

      {/* Count-up Section */}
      <section className="bg-[#FAF9F6] text-[#0E1E36] py-16 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <CountUpSection />
        </div>
      </section>

      {/* Desktop App and Chrome Extension Side-by-Side Section */}
      <section className="bg-gradient-to-r from-[#0E1E36] to-[#1a2b4a] py-16 sm:py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-white">
              Choose Your Protection Layer
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto">
              AI prompt security across browsers, desktop apps, and beyond—Complyze gives you flexible, powerful control wherever you work.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12">
            {/* Desktop App Card */}
            <div className="bg-slate-700/30 backdrop-blur-sm rounded-2xl p-8 border border-slate-600/30">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-6">
                  <span className="text-4xl">🖥️</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">Complyze Desktop</h3>
                <p className="text-gray-300">Real-time AI prompt protection for desktop apps like ChatGPT, Claude, and others.</p>
              </div>
              
              {/* Desktop Features */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-white font-bold text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">Seamless System Integration</h4>
                    <p className="text-gray-300 text-sm">Works directly from your macOS menu bar</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-white font-bold text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">Live Risk Warnings</h4>
                    <p className="text-gray-300 text-sm">Flags prompts with compliance or security concerns before submission</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-white font-bold text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">Automated Redaction</h4>
                    <p className="text-gray-300 text-sm">Instantly redacts sensitive data using regex + AI-enhanced filtering</p>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-600/30">
                  <p className="text-sm text-gray-400 text-center italic">
                    Included in the Complyze platform. Admin-managed deployment available.
                  </p>
                </div>
              </div>
            </div>

            {/* Chrome Extension Card */}
            <div className="bg-slate-700/30 backdrop-blur-sm rounded-2xl p-8 border border-slate-600/30">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-6">
                  <span className="text-4xl">🌐</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">Complyze Chrome Extension</h3>
                <p className="text-gray-300">Browser-based AI prompt protection across all major web LLM tools</p>
              </div>
              
              {/* Chrome Features */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-white font-bold text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">Universal Detection</h4>
                    <p className="text-gray-300 text-sm">Secures prompts in ChatGPT, Claude, Gemini, Perplexity, and more</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-white font-bold text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">Instant Alerts</h4>
                    <p className="text-gray-300 text-sm">Notifies users when sensitive data is detected in real time</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-white font-bold text-xs">✓</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">Smart Redaction</h4>
                    <p className="text-gray-300 text-sm">Rewrites confidential inputs into safe, clear language without placeholders</p>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-600/30">
                  <p className="text-sm text-gray-400 text-center italic">
                    Part of the Complyze suite. Managed installation via admin console.
                  </p>
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

      {/* Footer */}
      <footer className="bg-[#0E1E36] text-white py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4">
            <a href="#" className="text-gray-400 hover:text-white transition">Terms of Service</a>
            <a href="/privacypolicy" className="text-gray-400 hover:text-white transition">Privacy Policy</a>
            <a href="mailto:support@complyze.co" className="text-gray-400 hover:text-white transition">Support</a>
          </div>
          <div className="mt-6 text-gray-400 text-sm">© 2023 Complyze. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
} 