import { GoogleGenAI } from '@google/genai';

/**
 * Analyzes URLs and domain structures for typosquatting, phishing mimicry, and TLD reputational risk.
 * Falls back to local heuristics if Gemini API key is missing.
 */
export async function analyzeUrl(inputUrl, apiKey = '') {
  const finalApiKey = apiKey || process.env.GEMINI_API_KEY;

  if (finalApiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: finalApiKey });
      const prompt = `
You are an expert web security analyst.
Analyze the following URL / Domain for phishing, brand hijacking, SSL errors, typosquatting, or general malicious activity.

URL / DOMAIN:
"""
${inputUrl}
"""

Provide your detailed analysis in a valid JSON format only. Do not include any markdown fences or additional explanation outside the JSON. The JSON structure MUST exactly match this:
{
  "threatScore": <number between 0 and 100>,
  "threatLevel": "<SAFE | LOW | MEDIUM | HIGH | CRITICAL>",
  "domain": "<extracted domain name>",
  "typosquattingDetected": <true | false>,
  "targetedBrand": "<brand targeted, e.g., PayPal, Netflix, or None>",
  "summary": "<A 2-3 sentence overview of the domain credibility and potential threats>",
  "indicators": [
    {
      "name": "<e.g., Domain Age simulation, Typosquatting, No HTTPS, Blacklist match>",
      "status": "<DANGER | WARNING | SAFE>",
      "details": "<explanation of findings>"
    }
  ],
  "mitigationPlan": [
    "<Dynamic, custom mitigation step 1 customized EXACTLY to this domain/brand target>",
    "<Dynamic, custom mitigation step 2 detailing technical blocks, like firewall/DNS block scripts>",
    "<Dynamic, custom mitigation step 3 detailing verification protocols>"
  ]
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text || '';
      return JSON.parse(responseText.trim());
    } catch (error) {
      console.error('Gemini URL Analyzer Error, falling back to local heuristics:', error);
    }
  }

  // Fallback to Local Heuristics
  return runLocalUrlHeuristics(inputUrl);
}

function runLocalUrlHeuristics(inputUrl) {
  let urlStr = inputUrl.trim();
  if (!/^https?:\/\//i.test(urlStr)) {
    urlStr = 'http://' + urlStr;
  }

  let domain = '';
  let protocol = '';
  try {
    const parsed = new URL(urlStr);
    domain = parsed.hostname;
    protocol = parsed.protocol;
  } catch (e) {
    domain = inputUrl.trim();
  }

  let threatScore = 10;
  const indicators = [];
  const domainLower = domain.toLowerCase();

  // 1. SSL/Protocol Safety check
  if (protocol === 'http:') {
    indicators.push({
      name: 'Insecure Connection (HTTP)',
      status: 'WARNING',
      details: 'This website does not enforce HTTPS. Data sent to it is unencrypted.'
    });
    threatScore += 20;
  } else {
    indicators.push({
      name: 'Secure Connection (HTTPS)',
      status: 'SAFE',
      details: 'Connection uses SSL/TLS encryption. Note: Phishing sites can also have SSL.'
    });
  }

  // 2. Typosquatting / Brand Mimicry Check
  const popularBrands = [
    { name: 'paypal', abuse: 'spoof@paypal.com', variants: ['paypa1', 'paypaI', 'paypal-security', 'paypa1-update', 'paypall'] },
    { name: 'google', abuse: 'security@google.com', variants: ['go0gle', 'goog1e', 'g00gle', 'google-auth', 'googIe'] },
    { name: 'microsoft', abuse: 'abuse@microsoft.com', variants: ['microsof', 'micros0ft', 'microsoft-login', 'microsoft-security'] },
    { name: 'netflix', abuse: 'phishing@netflix.com', variants: ['netf1ix', 'netfIix', 'netflix-verify', 'netflix-billing'] },
    { name: 'amazon', abuse: 'stop-spoofing@amazon.com', variants: ['amaz0n', 'amazon-support', 'amazn', 'amz-billing'] },
    { name: 'apple', abuse: 'reportphishing@apple.com', variants: ['app1e', 'apple-support', 'icloud-verify', 'apple-id'] },
    { name: 'facebook', abuse: 'phish@fb.com', variants: ['faceb00k', 'facebo0k', 'fb-login'] },
    { name: 'chase', abuse: 'abuse@chase.com', variants: ['chase-login', 'chase-security', 'chase-update'] },
    { name: 'bankofamerica', abuse: 'abuse@bankofamerica.com', variants: ['bofa-update', 'bankofamerica-login', 'bankof-america'] }
  ];

  let typosquattingDetected = false;
  let targetedBrand = 'None';
  let brandAbuseEmail = 'abuse@domain.com';

  for (const brand of popularBrands) {
    const isVariant = brand.variants.some(v => domainLower.includes(v));
    const isDeceptiveSubstring = domainLower.includes(brand.name) && domainLower !== `${brand.name}.com` && !domainLower.endsWith(`.${brand.name}.com`) && !domainLower.endsWith(`.${brand.name}`);

    if (isVariant || isDeceptiveSubstring) {
      typosquattingDetected = true;
      targetedBrand = brand.name.toUpperCase();
      brandAbuseEmail = brand.abuse;
      indicators.push({
        name: 'Brand Mimicry / Typosquatting',
        status: 'DANGER',
        details: `This domain appears to mimic the official brand "${brand.name.toUpperCase()}" using look-alike characters or brand suffixes.`
      });
      threatScore += 60;
      break;
    }
  }

  // 3. Shady Top Level Domain Check
  const shadyTlds = ['xyz', 'top', 'click', 'info', 'cc', 'work', 'zip', 'party', 'gq', 'tk', 'cf', 'ml', 'date', 'club'];
  const ext = domainLower.split('.').pop();
  if (shadyTlds.includes(ext)) {
    indicators.push({
      name: 'Reputational Risk TLD',
      status: 'WARNING',
      details: `Uses the top-level domain (.${ext}) which has high statistical correlation with spam and phishing campaigns.`
    });
    threatScore += 25;
  }

  // 4. IP Address Check
  const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(domain);
  if (isIp) {
    indicators.push({
      name: 'Numeric IP Address Domain',
      status: 'DANGER',
      details: 'The domain name is a raw numeric IP address. Authentic businesses rarely request users to navigate directly to raw IP addresses.'
    });
    threatScore += 40;
  }

  // 5. URL Length Check
  const subdomainCount = (domainLower.match(/\./g) || []).length;
  if (subdomainCount > 3) {
    indicators.push({
      name: 'Excessive Subdomains',
      status: 'WARNING',
      details: 'This domain contains an unusually high number of subdomains, which is common in phishing attacks attempting to bury the real domain.'
    });
    threatScore += 15;
  }

  // Cap the score
  threatScore = Math.min(threatScore, 100);

  // Set Threat Level
  let threatLevel = 'SAFE';
  if (threatScore >= 80) threatLevel = 'CRITICAL';
  else if (threatScore >= 50) threatLevel = 'HIGH';
  else if (threatScore >= 25) threatLevel = 'MEDIUM';
  else if (threatScore >= 10) threatLevel = 'LOW';

  let summary = `This website is analyzed as SAFE. No clear typosquatting or protocol anomalies were detected.`;
  if (threatLevel === 'CRITICAL' || threatLevel === 'HIGH') {
    summary = `WARNING: High risk of phishing/fraud detected! The domain "${domain}" appears specifically structured to mimic ${targetedBrand !== 'None' ? targetedBrand : 'a trusted business'} or bypass secure browser standards.`;
  } else if (threatLevel === 'MEDIUM') {
    summary = `Caution: This URL contains flags like an insecure HTTP protocol or a less reputable TLD. Exercise care if inputting details.`;
  }

  // DYNAMIC MITIGATION CHECKLIST CONSTRUCTOR
  const mitigationPlan = [];
  if (threatScore > 15) {
    mitigationPlan.push(`Do NOT enter password credentials or credit card numbers on the domain "${domain}".`);
    
    if (typosquattingDetected) {
      mitigationPlan.push(`Report this typosquatted domain to the spoof prevention division of ${targetedBrand} at: ${brandAbuseEmail}`);
      mitigationPlan.push(`Verify any notifications by navigating directly to the official homepage of ${targetedBrand} using a fresh tab.`);
    } else {
      mitigationPlan.push(`Report this domain to Google Safe Browsing and Microsoft SmartScreen to protect other users.`);
    }

    mitigationPlan.push(`Configure your network DNS records or host files to sinkhole traffic requesting "${domain}".`);
  } else {
    mitigationPlan.push(`Domain matches safe profiles. Standard logging completed.`);
  }

  return {
    threatScore,
    threatLevel,
    domain,
    typosquattingDetected,
    targetedBrand,
    summary,
    indicators,
    mitigationPlan
  };
}

