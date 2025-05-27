import { NextRequest, NextResponse } from 'next/server';

// PII patterns for detection
const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
  ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
  creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  ipAddress: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
  name: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // Simple name pattern
  address: /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)\b/gi,
  apiKey: /\b[A-Za-z0-9]{32,}\b/g,
  token: /\b(?:sk-|pk_|rk_)[A-Za-z0-9]{20,}\b/g
};

const SENSITIVE_KEYWORDS = [
  'password', 'secret', 'confidential', 'private', 'internal',
  'proprietary', 'classified', 'restricted', 'sensitive'
];

function detectPII(text: string) {
  const detected: string[] = [];
  
  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      detected.push(type);
    }
  }
  
  // Check for sensitive keywords
  const lowerText = text.toLowerCase();
  for (const keyword of SENSITIVE_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      detected.push('sensitive_keyword');
      break;
    }
  }
  
  return detected;
}

function redactText(text: string) {
  let redactedText = text;
  
  // Redact emails
  redactedText = redactedText.replace(PII_PATTERNS.email, '[EMAIL_REDACTED]');
  
  // Redact phone numbers
  redactedText = redactedText.replace(PII_PATTERNS.phone, '[PHONE_REDACTED]');
  
  // Redact SSNs
  redactedText = redactedText.replace(PII_PATTERNS.ssn, '[SSN_REDACTED]');
  
  // Redact credit cards
  redactedText = redactedText.replace(PII_PATTERNS.creditCard, '[CARD_REDACTED]');
  
  // Redact IP addresses
  redactedText = redactedText.replace(PII_PATTERNS.ipAddress, '[IP_REDACTED]');
  
  // Redact potential names (be conservative)
  redactedText = redactedText.replace(PII_PATTERNS.name, '[NAME_REDACTED]');
  
  // Redact addresses
  redactedText = redactedText.replace(PII_PATTERNS.address, '[ADDRESS_REDACTED]');
  
  // Redact API keys and tokens
  redactedText = redactedText.replace(PII_PATTERNS.apiKey, '[API_KEY_REDACTED]');
  redactedText = redactedText.replace(PII_PATTERNS.token, '[TOKEN_REDACTED]');
  
  // Redact sensitive keywords context
  for (const keyword of SENSITIVE_KEYWORDS) {
    const regex = new RegExp(`\\b\\w*${keyword}\\w*\\b`, 'gi');
    redactedText = redactedText.replace(regex, '[SENSITIVE_REDACTED]');
  }
  
  return redactedText;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Valid prompt text is required' },
        { status: 400 }
      );
    }
    
    // Detect PII and sensitive information
    const piiDetected = detectPII(prompt);
    
    // Redact the text
    const redactedText = redactText(prompt);
    
    // Calculate redaction statistics
    const originalLength = prompt.length;
    const redactedLength = redactedText.length;
    const redactionCount = (prompt.match(/\[.*?_REDACTED\]/g) || []).length;
    
    const response = {
      original_text: prompt,
      redacted_text: redactedText,
      pii_detected: piiDetected,
      redaction_stats: {
        original_length: originalLength,
        redacted_length: redactedLength,
        redaction_count: redactionCount,
        redaction_percentage: Math.round((redactionCount / originalLength) * 100)
      },
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Redaction error:', error);
    return NextResponse.json(
      { error: 'Failed to process redaction request' },
      { status: 500 }
    );
  }
} 