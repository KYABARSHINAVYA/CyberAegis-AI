import { GoogleGenAI } from '@google/genai';

const AI_TIMEOUT_MS = 8000;

function withTimeout(promise, message) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), AI_TIMEOUT_MS);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

/**
 * Analyzes email/message text for phishing, social engineering, and spoofing signatures.
 * Falls back to local heuristics if Gemini API key is not provided.
 */
export async function analyzeEmail(content, headers = '', apiKey = '') {
  const finalApiKey = apiKey === null ? '' : (apiKey || process.env.GEMINI_API_KEY);

  if (finalApiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: finalApiKey });
      const prompt = `
You are an expert cybersecurity analyst.
Analyze the following email/message content and headers (if any) and identify security threats.

EMAIL/MESSAGE CONTENT:
"""
${content}
"""

HEADERS:
"""
${headers}
"""

Provide your detailed analysis in a valid JSON format only. Do not include any markdown fences or additional explanation outside the JSON. The JSON structure MUST exactly match this:
{
  "threatScore": <number between 0 and 100>,
  "threatLevel": "<SAFE | LOW | MEDIUM | HIGH | CRITICAL>",
  "classification": "<e.g., Phishing, Credentials Harvesting, Social Engineering, Spam, or Clean>",
  "summary": "<A 2-3 sentence overview of the email credibility and key threats>",
  "findings": [
    {
      "category": "<e.g., Urgency, Financial, Sender Spoofing, Bad Link, Suspicious Request>",
      "description": "<detailed explanation of what was found>",
      "severity": "<LOW | MEDIUM | HIGH | CRITICAL>"
    }
  ],
  "highlightedTexts": [
    {
      "text": "<EXACT text from the email content that is suspicious>",
      "reason": "<why this specific text is suspicious>",
      "severity": "<LOW | MEDIUM | HIGH | CRITICAL>"
    }
  ],
  "mitigationPlan": [
    "<Dynamic, custom mitigation step 1 customized EXACTLY to this sender/text details>",
    "<Dynamic, custom mitigation step 2 tailored to the specific threat type>",
    "<Dynamic, custom mitigation step 3 detailing how to report or delete this exact item>"
  ]
}
`;

      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        }),
        'Gemini email analysis timed out.'
      );

      const responseText = response.text || '';
      return JSON.parse(responseText.trim());
    } catch (error) {
      console.error('Gemini Email Analyzer Error, falling back to local heuristics:', error);
    }
  }

  // Local Heuristics Fallback
  return runLocalEmailHeuristics(content, headers);
}

function runLocalEmailHeuristics(content, headers = '') {
  let threatScore = 5;
  const findings = [];
  const highlightedTexts = [];
  const contentLower = content.toLowerCase();

  // 1. Urgency & Panic Indicators
  const urgencyKeywords = [
    { pattern: /action required/i, match: 'action required' },
    { pattern: /immediate/i, match: 'immediate' },
    { pattern: /urgent/i, match: 'urgent' },
    { pattern: /within 24 hours/i, match: 'within 24 hours' },
    { pattern: /suspend/i, match: 'suspend' },
    { pattern: /unauthorized access/i, match: 'unauthorized access' },
    { pattern: /compromised/i, match: 'compromised' },
    { pattern: /security alert/i, match: 'security alert' }
  ];

  let urgencyScore = 0;
  urgencyKeywords.forEach(kw => {
    if (kw.pattern.test(contentLower)) {
      urgencyScore += 15;
      const exactMatch = content.match(kw.pattern);
      highlightedTexts.push({
        text: exactMatch ? exactMatch[0] : kw.match,
        reason: `Urgency/Panic indicator: Attempts to rush the recipient into acting.`,
        severity: 'MEDIUM'
      });
    }
  });

  if (urgencyScore > 0) {
    findings.push({
      category: 'Urgency & Coercion',
      description: 'The message creates an artificial sense of urgency or fear to bypass critical thinking.',
      severity: urgencyScore > 25 ? 'HIGH' : 'MEDIUM'
    });
    threatScore += Math.min(urgencyScore, 35);
  }

  // 2. Financial / Gift Card / Wire Transfer requests
  const financialKeywords = [
    { pattern: /wire transfer/i, match: 'wire transfer' },
    { pattern: /gift card/i, match: 'gift card' },
    { pattern: /invoice/i, match: 'invoice' },
    { pattern: /bank details/i, match: 'bank details' },
    { pattern: /crypto/i, match: 'crypto' },
    { pattern: /bitcoin/i, match: 'bitcoin' },
    { pattern: /routing number/i, match: 'routing number' },
    { pattern: /payment/i, match: 'payment' }
  ];

  let financialScore = 0;
  financialKeywords.forEach(kw => {
    if (kw.pattern.test(contentLower)) {
      financialScore += 12;
      const exactMatch = content.match(kw.pattern);
      highlightedTexts.push({
        text: exactMatch ? exactMatch[0] : kw.match,
        reason: `Financial reference: Requests monetary action, bank info, or invoices.`,
        severity: 'HIGH'
      });
    }
  });

  if (financialScore > 0) {
    findings.push({
      category: 'Financial Solicitation',
      description: 'Contains requests involving financial transactions, invoices, bank routing, or gift cards.',
      severity: financialScore > 20 ? 'HIGH' : 'MEDIUM'
    });
    threatScore += Math.min(financialScore, 30);
  }

  // 3. Credentials & Personal Data Harvesting
  const credentialsKeywords = [
    { pattern: /reset password/i, match: 'reset password' },
    { pattern: /update credentials/i, match: 'update credentials' },
    { pattern: /login/i, match: 'login' },
    { pattern: /verify account/i, match: 'verify account' },
    { pattern: /social security/i, match: 'social security' },
    { pattern: /ssn/i, match: 'ssn' }
  ];

  let credentialScore = 0;
  credentialsKeywords.forEach(kw => {
    if (kw.pattern.test(contentLower)) {
      credentialScore += 15;
      const exactMatch = content.match(kw.pattern);
      highlightedTexts.push({
        text: exactMatch ? exactMatch[0] : kw.match,
        reason: `Credentials / PII Solicitation: Asks to verify accounts, passwords, or input credentials.`,
        severity: 'HIGH'
      });
    }
  });

  if (credentialScore > 0) {
    findings.push({
      category: 'Credential Harvesting',
      description: 'Prompts the user to update passwords, verify credentials, or expose personal identity info.',
      severity: 'HIGH'
    });
    threatScore += Math.min(credentialScore, 25);
  }

  // 4. Suspicious Links and Formatting
  let detectedBrand = '';
  const linkRegex = /(https?:\/\/[^\s]+)/gi;
  const links = content.match(linkRegex) || [];
  if (links.length > 0) {
    let linkAlertCount = 0;
    links.forEach(link => {
      let isSuspicious = false;
      let reason = '';
      const url = link.toLowerCase();

      // Check for raw IP address in links
      if (/https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url)) {
        isSuspicious = true;
        reason = 'URL contains a raw IP address instead of a domain name.';
      }
      // Check for shady TLDs
      else if (/\.(xyz|top|click|info|cc|work|zip|party)\b/.test(url)) {
        isSuspicious = true;
        reason = 'URL uses a generic/shady Top-Level Domain (e.g., .xyz, .top, .click).';
      }
      // Check for overly long subdomains
      else if ((url.match(/\./g) || []).length > 4) {
        isSuspicious = true;
        reason = 'URL has excessive subdomains, a common tactic to mimic official sites.';
      }

      // Check brand variants in link
      const brands = ['paypal', 'netflix', 'amazon', 'google', 'facebook', 'chase', 'microsoft', 'apple'];
      brands.forEach(b => {
        if (url.includes(b) && !url.includes(`${b}.com`)) {
          detectedBrand = b.toUpperCase();
        }
      });

      if (isSuspicious) {
        linkAlertCount++;
        highlightedTexts.push({
          text: link,
          reason: reason,
          severity: 'HIGH'
        });
      }
    });

    if (linkAlertCount > 0) {
      findings.push({
        category: 'Suspicious Links',
        description: `Found ${linkAlertCount} suspicious URL(s) using deceptive domain tactics.`,
        severity: 'HIGH'
      });
      threatScore += Math.min(linkAlertCount * 15, 30);
    }
  }

  // 5. Header Spoofing check
  let senderEmail = '';
  if (headers) {
    const headersLower = headers.toLowerCase();
    const fromMatch = headers.match(/from:\s*([^<\n]+)?<([^>\n]+)>/i) || headers.match(/from:\s*([^\s\n]+)/i);

    if (fromMatch) {
      senderEmail = fromMatch[2] || fromMatch[1] || '';
    }

    const replyToMatch = headersLower.match(/reply-to:\s*([^<\n]+)?<([^>\n]+)>/i);

    if (fromMatch && replyToMatch && senderEmail) {
      const fromDomain = senderEmail.split('@')[1] || '';
      const replyDomain = replyToMatch[2].split('@')[1] || '';

      if (fromDomain && replyDomain && fromDomain.trim() !== replyDomain.trim()) {
        findings.push({
          category: 'Sender Mismatch',
          description: `The "From" domain (${fromDomain}) does not match the "Reply-To" domain (${replyDomain}).`,
          severity: 'CRITICAL'
        });
        threatScore += 25;
        highlightedTexts.push({
          text: fromMatch[0],
          reason: `Sender email is ${senderEmail}, but replies go to ${replyToMatch[2]}. This is a spoofing indicator.`,
          severity: 'CRITICAL'
        });
      }
    }

    if (headersLower.includes('spf=fail') || headersLower.includes('dkim=fail')) {
      findings.push({
        category: 'Authentication Failures',
        description: 'Email headers report SPF or DKIM signature validation failures.',
        severity: 'CRITICAL'
      });
      threatScore += 30;
    }
  }

  // Cap the score at 100
  threatScore = Math.min(threatScore, 100);

  // Set Threat Level
  let threatLevel = 'SAFE';
  let classification = 'Clean';
  if (threatScore >= 80) {
    threatLevel = 'CRITICAL';
    classification = 'Critical Phishing Attempt';
  } else if (threatScore >= 50) {
    threatLevel = 'HIGH';
    classification = 'High Risk Phishing';
  } else if (threatScore >= 25) {
    threatLevel = 'MEDIUM';
    classification = 'Suspicious / Spam';
  } else if (threatScore >= 10) {
    threatLevel = 'LOW';
    classification = 'Unverified Message';
  }

  let summary = `This message has a threat score of ${threatScore}%. It appears relatively safe, though general caution is advised.`;
  if (threatLevel === 'CRITICAL' || threatLevel === 'HIGH') {
    summary = `CRITICAL ALERT: This message contains strong hallmarks of a phishing attack. Multiple indicators (urgency, credential soliciting, spoofing signs) were identified. Do NOT click links or reply.`;
  } else if (threatLevel === 'MEDIUM') {
    summary = `Caution: This email has suspicious elements. It contains generic urgency markers or standard marketing spam. Verify before engaging.`;
  }

  // DYNAMIC MITIGATION CHECKLIST CONSTRUCTOR
  const mitigationPlan = [];
  if (threatScore > 5) {
    mitigationPlan.push('Do NOT click on any links or download files from this message.');
    
    if (detectedBrand) {
      mitigationPlan.push(`Contact ${detectedBrand} customer support directly through official channels to verify this request.`);
    } else {
      mitigationPlan.push('Authenticate the sender\'s identity using an alternative, verified contact method.');
    }

    if (senderEmail) {
      mitigationPlan.push(`Flag the sender address (${senderEmail}) as a blocklist entry on your spam filters.`);
    }

    if (credentialScore > 0) {
      mitigationPlan.push('If you already entered passwords or login details, immediately navigate to the official platform and change your credentials.');
    }
  } else {
    mitigationPlan.push('Message appears valid. Proceed with standard corporate caution.');
  }

  return {
    threatScore,
    threatLevel,
    classification,
    summary,
    findings,
    highlightedTexts,
    mitigationPlan
  };
}
