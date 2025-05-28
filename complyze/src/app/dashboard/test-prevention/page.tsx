'use client';

import { useState } from 'react';

export default function TestPreventionPage() {
  const [textareaValue, setTextareaValue] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [contentEditableValue, setContentEditableValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Form submitted! (This should be prevented if high-risk content is detected)');
  };

  const sampleRiskyTexts = [
    "My email is john.doe@example.com and my phone is 555-123-4567",
    "Here's my SSN: 123-45-6789 for verification",
    "My credit card number is 4532-1234-5678-9012",
    "API key: sk-1234567890abcdefghijklmnopqrstuvwxyz",
    "My password is MySecretPassword123!",
    "This contains confidential information about our company"
  ];

  return (
    <div className="min-h-screen p-8" style={{ background: '#0E1E36' }}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-2">
            🛡️ Real-Time Prompt Prevention Test
          </h1>
          <p className="text-white/80 mb-8">
            Test the Complyze extension's real-time security analysis. Try typing or pasting sensitive information below.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Test Form */}
            <div className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Textarea Input (Primary Test)
                  </label>
                  <textarea
                    value={textareaValue}
                    onChange={(e) => setTextareaValue(e.target.value)}
                    placeholder="Type or paste your prompt here..."
                    className="w-full h-32 p-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">
                    Text Input
                  </label>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Enter sensitive data here..."
                    className="w-full p-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">
                    Content Editable Div
                  </label>
                  <div
                    contentEditable
                    onInput={(e) => setContentEditableValue(e.currentTarget.textContent || '')}
                    className="w-full min-h-[100px] p-4 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    style={{ whiteSpace: 'pre-wrap' }}
                    suppressContentEditableWarning={true}
                  >
                    {contentEditableValue || 'Click here and type...'}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105"
                >
                  Submit Form (Should be blocked for high-risk content)
                </button>
              </form>
            </div>

            {/* Sample Risky Texts */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white mb-4">
                🧪 Sample Risky Content
              </h2>
              <p className="text-white/80 text-sm mb-4">
                Click any button below to populate the textarea with sample risky content and test the prevention system:
              </p>
              
              <div className="space-y-3">
                {sampleRiskyTexts.map((text, index) => (
                  <button
                    key={index}
                    onClick={() => setTextareaValue(text)}
                    className="w-full text-left p-3 rounded-lg bg-red-500/20 border border-red-400/30 text-white hover:bg-red-500/30 transition-colors duration-200"
                  >
                    <div className="font-semibold text-sm text-red-300 mb-1">
                      Risk Level: {index < 2 ? 'Medium' : 'High'}
                    </div>
                    <div className="text-sm truncate">
                      {text}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-8 p-4 rounded-lg bg-blue-500/20 border border-blue-400/30">
                <h3 className="font-bold text-blue-300 mb-2">Testing Instructions:</h3>
                <ol className="text-sm text-blue-200 space-y-1">
                  <li>1. Make sure the Complyze extension is loaded</li>
                  <li>2. Click a sample risky content button above</li>
                  <li>3. Watch for real-time warnings above the textarea</li>
                  <li>4. Try to submit - high-risk content should be blocked</li>
                  <li>5. Use browser console: <code>complyzeTestRealTime()</code></li>
                </ol>
              </div>

              <div className="mt-4 p-4 rounded-lg bg-green-500/20 border border-green-400/30">
                <h3 className="font-bold text-green-300 mb-2">Console Commands:</h3>
                <div className="text-sm text-green-200 space-y-1 font-mono">
                  <div>complyzeTestRealTime()</div>
                  <div>complyzeTogglePrevention()</div>
                  <div>complyzeDebug()</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 