"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Persona {
  title: string;
  description: string;
  challenges: string[];
  solutions: string[];
  icon: string;
}

const personas: Persona[] = [
  {
    title: "The Accidental AI Officer",
    description: "A software engineer or IT manager suddenly tasked with managing AI compliance and security across the organization.",
    challenges: [
      "Limited experience with compliance frameworks",
      "Overwhelmed by rapid AI adoption",
      "Needs to establish governance quickly",
      "Balancing innovation with risk management"
    ],
    solutions: [
      "Automated compliance mapping",
      "Real-time prompt risk detection",
      "Pre-built governance templates",
      "Integration with existing tools"
    ],
    icon: "🔧"
  },
  {
    title: "CISO at a Federal Contractor",
    description: "A security leader responsible for maintaining compliance with federal regulations while leveraging AI capabilities.",
    challenges: [
      "Complex regulatory requirements",
      "High stakes for non-compliance",
      "Need for detailed audit trails",
      "Secure data handling requirements"
    ],
    solutions: [
      "NIST AI RMF alignment",
      "Comprehensive audit logging",
      "Automated redaction engine",
      "FedRAMP-ready infrastructure"
    ],
    icon: "🛡️"
  },
  {
    title: "Healthcare Legal Counsel",
    description: "An attorney ensuring AI implementations comply with healthcare regulations and protect patient data.",
    challenges: [
      "HIPAA compliance requirements",
      "PHI protection in AI interactions",
      "Risk management for patient data",
      "Regulatory documentation needs"
    ],
    solutions: [
      "Healthcare-specific controls",
      "Automated PHI detection",
      "Compliance documentation",
      "Real-time risk alerts"
    ],
    icon: "⚕️"
  }
];

export default function PersonaCards() {
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-12">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 text-center text-[#0E1E36]">
        Who We Help
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {personas.map((persona) => (
          <motion.div
            key={persona.title}
            className="bg-white rounded-xl shadow-lg p-6 cursor-pointer transform transition-all duration-300 hover:shadow-xl"
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedPersona(persona)}
          >
            <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl">{persona.icon}</span>
              <h3 className="text-xl font-bold text-[#0E1E36]">{persona.title}</h3>
            </div>
            <p className="text-gray-600 mb-4">{persona.description}</p>
            <div className="flex justify-end">
              <span className="text-[#FF6F3C] font-semibold">Click to learn more →</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal for detailed view */}
      <AnimatePresence>
        {selectedPersona && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedPersona(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-6">
                <span className="text-5xl">{selectedPersona.icon}</span>
                <h3 className="text-2xl font-bold text-[#0E1E36]">{selectedPersona.title}</h3>
              </div>
              
              <p className="text-gray-600 mb-6 text-lg">{selectedPersona.description}</p>
              
              <div className="mb-6">
                <h4 className="text-xl font-semibold text-[#0E1E36] mb-3">Key Challenges</h4>
                <ul className="space-y-2">
                  {selectedPersona.challenges.map((challenge, index) => (
                    <li key={index} className="flex items-center gap-2 text-gray-600">
                      <span className="text-[#FF6F3C]">•</span>
                      {challenge}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-6">
                <h4 className="text-xl font-semibold text-[#0E1E36] mb-3">Complyze Solutions</h4>
                <ul className="space-y-2">
                  {selectedPersona.solutions.map((solution, index) => (
                    <li key={index} className="flex items-center gap-2 text-gray-600">
                      <span className="text-[#388E3C]">✓</span>
                      {solution}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                className="w-full bg-[#FF6F3C] text-white py-3 rounded-lg font-semibold hover:bg-[#e65d2e] transition-colors"
                onClick={() => setSelectedPersona(null)}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 