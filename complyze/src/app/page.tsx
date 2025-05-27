"use client";
import React, { useRef } from "react";
import PromptJourney from "./components/PromptJourney";

export default function Landing() {
  // Refs for journey and FAQ
  const journeyRef = useRef<HTMLDivElement | null>(null);
  const faqRef = useRef<HTMLDivElement | null>(null);

  // Scroll handlers
  const handleJourneyClick = () => {
    if (journeyRef.current) {
      journeyRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  const handleFaqClick = () => {
    if (faqRef.current) {
      faqRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0E1E36] font-sans text-white">
      {/* Top Navigation */}
      <nav className="flex justify-between items-center px-8 py-6">
        <div className="text-2xl font-extrabold tracking-widest uppercase">COMPLYZE</div>
        <div className="flex gap-8 text-base font-medium items-center">
          <button onClick={handleJourneyClick} className="hover:underline bg-transparent text-white" style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>Process</button>
          <button onClick={handleFaqClick} className="hover:underline bg-transparent text-white" style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>FAQs</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-20 px-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">LLM risk is invisible—until it's inevitable.</h1>
        <p className="text-lg md:text-2xl font-medium mb-10 max-w-2xl">Don't wait until an audit forces the question.
        Complyze transforms every AI prompt into a compliance asset—redacted, optimized, and aligned to frameworks you already trust..</p>
        {/* <a href="#how-it-works" className="bg-[#FF6F3C] text-white font-bold text-lg px-8 py-4 rounded-lg shadow-lg hover:bg-[#ff8a5c] transition">See how it works</a> */}
      </section>

      {/* Prompt Enhancement Tool Section */}
      <section className="bg-[#FAF9F6] text-[#0E1E36] py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">Your Prompts Aren't Working Hard Enough</h2>
          <p className="text-lg md:text-xl text-center mb-10">Most teams underutilize their LLMs. Complyze rewrites prompts using best practices learned from top models from OpenAI, Anthropic, Google,  and major academic institutions.</p>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-10">
            {/* Bullets */}
            
            {/* Visual: Before/After */}
            <div className="flex-1 flex flex-col items-center">
            </div>
          </div>
        </div>
      </section>
      {/* Insert PromptJourney below the prompt enhancement section */}
      <PromptJourney journeyRef={journeyRef} faqRef={faqRef} />
      {/* How It Works Section - REMOVE THIS SECTION */}
      {/* <section id="how-it-works" className="bg-[#0E1E36] text-white py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="flex flex-col items-center text-center">
              <div className="bg-[#FF6F3C] rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M4 20l16-16M9 11l4 4M11 9l4 4" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <div className="font-semibold text-lg mb-2">Tailored AI outputs without the headaches</div>
              <div className="text-base opacity-80">Complyze rewrites and enhances your prompts for optimal LLM performance—no prompt engineering degree required.</div>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-[#FF6F3C] rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M12 3l7 4v5c0 5-3.5 9-7 9s-7-4-7-9V7l7-4z" stroke="#fff" strokeWidth="2"/></svg>
              </div>
              <div className="font-semibold text-lg mb-2">AI mapped to risk and security controls</div>
              <div className="text-base opacity-80">Every prompt is checked and aligned with compliance frameworks like NIST, ISO, and the EU AI Act.</div>
            </div>
          </div>
        </div>
      </section> */}
    </div>
  );
}
