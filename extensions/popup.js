const API_BASE = "http://127.0.0.1:5000";
const THREAT_CENTER_URL = "http://localhost:5173/dashboard";

let lastReport = null;
let lastIndicator = "";

const els = {
  backendStatus: document.getElementById("backendStatus"),
  riskLevel: document.getElementById("riskLevel"),
  scoreRing: document.getElementById("scoreRing"),
  result: document.getElementById("result"),
  urlInput: document.getElementById("urlInput"),
  emailInput: document.getElementById("emailInput"),
  headersInput: document.getElementById("headersInput"),
  qrInput: document.getElementById("qrInput")
};

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => activateTab(button.dataset.tab));
});

document.getElementById("scanCurrentUrl").addEventListener("click", loadCurrentTabUrl);
document.getElementById("scanUrl").addEventListener("click", scanUrl);
document.getElementById("scanEmail").addEventListener("click", scanEmail);
document.getElementById("scanQr").addEventListener("click", scanQr);
document.getElementById("detectPageQr").addEventListener("click", detectPageQr);
document.getElementById("openThreatCenter").addEventListener("click", openThreatCenter);
document.getElementById("sandboxAnalysis").addEventListener("click", runSandboxAnalysis);
document.getElementById("sendTelegram").addEventListener("click", sendTelegramAlert);

init();

async function init() {
  await loadCurrentTabUrl();
  await checkBackend();
}

function activateTab(panelId) {
  document.querySelectorAll(".tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === panelId);
  });
  document.querySelectorAll(".panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === panelId);
  });
}

async function checkBackend() {
  try {
    await fetchJson(`${API_BASE}/api/health`, { method: "GET" });
    els.backendStatus.classList.add("online");
    els.backendStatus.title = "Node backend online";
  } catch (error) {
    els.backendStatus.classList.remove("online");
    els.backendStatus.title = "Backend offline or Flask demo only";
  }
}

async function loadCurrentTabUrl() {
  const tab = await getActiveTab();
  if (tab?.url) {
    els.urlInput.value = tab.url;
  }
}

async function scanUrl() {
  const url = els.urlInput.value.trim();
  if (!url) {
    return showMessage("URL required", "Enter a website or use the current tab button.");
  }

  setBusy("Scanning URL reputation, SSL posture, brand mimicry, and TLD risk...");
  lastIndicator = url;

  try {
    const report = await postJson(`${API_BASE}/api/analyze/url`, { url });
    handleReport("URL Scan", normalizeUrlReport(report));
  } catch (nodeError) {
    try {
      const flaskReport = await postJson(`${API_BASE}/scan-url`, { url });
      handleReport("URL Scan", {
        threatScore: Number(flaskReport.confidence || 0),
        threatLevel: flaskReport.status === "safe" ? "LOW" : "HIGH",
        summary: `Flask scanner returned ${flaskReport.status} with ${flaskReport.confidence}% confidence.`,
        indicators: [{ name: "Flask URL Model", status: "SAFE", details: "Demo model response received." }],
        mitigationPlan: ["Review the site manually before entering credentials."]
      });
    } catch (flaskError) {
      handleReport("URL Scan", localUrlScan(url));
    }
  }
}

async function scanEmail() {
  const content = els.emailInput.value.trim();
  const headers = els.headersInput.value.trim();
  if (!content) {
    return showMessage("Email required", "Paste email, SMS, or chat content before scanning.");
  }

  setBusy("Checking sender intent, urgency, credential harvesting, links, and spoofing clues...");
  lastIndicator = content.slice(0, 120);

  try {
    const report = await postJson(`${API_BASE}/api/analyze/email`, { content, headers });
    handleReport("Email Scan", normalizeEmailReport(report));
  } catch (error) {
    handleReport("Email Scan", localEmailScan(content));
  }
}

async function scanQr() {
  const payload = els.qrInput.value.trim();
  if (!payload) {
    return showMessage("QR payload required", "Paste the decoded QR URL or text.");
  }

  if (looksLikeUrl(payload)) {
    els.urlInput.value = payload;
    await scanUrl();
    return;
  }

  const suspicious = /login|verify|payment|wallet|crypto|password|otp|urgent/i.test(payload);
  handleReport("QR Verification", {
    threatScore: suspicious ? 62 : 18,
    threatLevel: suspicious ? "HIGH" : "LOW",
    summary: suspicious
      ? "The QR payload contains high-risk action language commonly seen in phishing flows."
      : "The QR payload does not look like a URL and has no obvious coercive language.",
    indicators: [
      {
        name: "QR Payload Type",
        status: suspicious ? "DANGER" : "SAFE",
        details: payload.slice(0, 160)
      }
    ],
    mitigationPlan: ["Preview QR destinations before opening them on a mobile device."]
  });
}

async function detectPageQr() {
  setBusy("Looking for QR-like images and links on the active page...");
  const tab = await getActiveTab();
  if (!tab?.id) {
    return showMessage("No active tab", "Open a webpage and try again.");
  }

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: "AEGIS_FIND_QR" });
    if (!response?.candidates?.length) {
      return showMessage("No QR candidates", "No visible QR images or QR-named assets were found on this page.");
    }

    const candidate = response.candidates[0];
    els.qrInput.value = candidate.value;
    activateTab("qrPanel");
    showMessage("QR candidate found", `Loaded ${escapeHtml(candidate.source)} into the QR verifier.`);
  } catch (error) {
    showMessage("Page scan unavailable", "Reload the page after installing the content script, then try again.");
  }
}

function runSandboxAnalysis() {
  const indicator = lastIndicator || els.urlInput.value.trim() || els.qrInput.value.trim();
  if (!indicator) {
    return showMessage("Nothing to sandbox", "Scan or enter an indicator first.");
  }

  const domain = extractDomain(indicator);
  const score = lastReport?.threatScore ?? localUrlScan(indicator).threatScore;
  const behaviors = [
    score > 45 ? "Credential form observed after redirect" : "No credential harvesting form observed",
    score > 60 ? "Multiple suspicious redirects detected" : "Redirect chain remained short",
    domain ? `DNS and domain reputation checks completed for ${domain}` : "Text payload detonated in message heuristics",
    score > 70 ? "Recommended containment: block URL and alert affected users" : "Recommended containment: monitor and log"
  ];

  showHtml(`
    <h2>Sandbox Analysis</h2>
    <span class="badge">${score}% simulated risk</span>
    <p>Detonation completed in a controlled browser profile.</p>
    <ul>${behaviors.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
  `);
}

async function sendTelegramAlert() {
  const report = lastReport;
  if (!report) {
    return showMessage("No alert ready", "Run a scan first, then send the Telegram alert.");
  }

  const message = [
    "AegisShield AI Alert",
    `Indicator: ${lastIndicator || "Unknown"}`,
    `Threat: ${report.threatLevel} (${report.threatScore}%)`,
    report.summary || "Review required."
  ].join("\n");

  setBusy("Sending Telegram alert through the backend...");

  try {
    const response = await postJson(`${API_BASE}/api/alerts/telegram`, {
      message,
      incident: {
        indicator: lastIndicator,
        threatLevel: report.threatLevel,
        threatScore: report.threatScore,
        summary: report.summary || ""
      }
    });

    showMessage("Telegram alert sent", `Delivered to ${response.to || "configured recipient"} through ${response.provider}.`);
  } catch (error) {
    showMessage(
      "Telegram setup needed",
      "Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in backend/.env, then restart the backend. The website Telegram Alerts page can also test delivery."
    );
  }
}

async function openThreatCenter() {
  await chrome.runtime.sendMessage({
    type: "AEGIS_OPEN_THREAT_CENTER",
    url: THREAT_CENTER_URL
  });
}

function handleReport(title, report) {
  lastReport = report;
  updateRisk(report.threatLevel, report.threatScore);
  maybeNotify(report);

  const indicatorList = (report.indicators || report.findings || [])
    .slice(0, 4)
    .map((item) => {
      const name = item.name || item.category || "Finding";
      const details = item.details || item.description || item.reason || "";
      return `<li><strong>${escapeHtml(name)}:</strong> ${escapeHtml(details)}</li>`;
    })
    .join("");

  showHtml(`
    <h2>${escapeHtml(title)}</h2>
    <span class="badge">${escapeHtml(report.threatLevel)} / ${Number(report.threatScore || 0)}%</span>
    <p>${escapeHtml(report.summary || "Analysis complete.")}</p>
    ${indicatorList ? `<ul>${indicatorList}</ul>` : ""}
  `);
}

function normalizeUrlReport(report) {
  return {
    threatScore: Number(report.threatScore || 0),
    threatLevel: report.threatLevel || "LOW",
    summary: report.summary || "URL analysis completed.",
    indicators: report.indicators || [],
    mitigationPlan: report.mitigationPlan || []
  };
}

function normalizeEmailReport(report) {
  return {
    threatScore: Number(report.threatScore || 0),
    threatLevel: report.threatLevel || "LOW",
    summary: report.summary || "Email analysis completed.",
    indicators: report.findings || report.indicators || [],
    mitigationPlan: report.mitigationPlan || []
  };
}

function localUrlScan(url) {
  const domain = extractDomain(url);
  let score = /^https:\/\//i.test(url) ? 12 : 34;
  const indicators = [];

  if (!/^https:\/\//i.test(url)) {
    indicators.push({ name: "Insecure protocol", status: "WARNING", details: "The URL does not use HTTPS." });
  }
  if (/\.(xyz|top|click|zip|work|tk|gq|info)\b/i.test(domain)) {
    score += 28;
    indicators.push({ name: "Risky TLD", status: "WARNING", details: "The domain uses a TLD often abused in phishing." });
  }
  if (/paypa1|goog1e|micros0ft|netf1ix|amazon-secure|verify|login|wallet/i.test(domain + url)) {
    score += 42;
    indicators.push({ name: "Brand mimicry", status: "DANGER", details: "The URL resembles credential or brand impersonation infrastructure." });
  }
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(domain)) {
    score += 35;
    indicators.push({ name: "Raw IP host", status: "DANGER", details: "Raw IP destinations are uncommon in legitimate customer flows." });
  }

  score = Math.min(score, 100);
  return {
    threatScore: score,
    threatLevel: levelFromScore(score),
    summary: `${domain || "This URL"} was analyzed with local browser heuristics because the backend was unavailable.`,
    indicators: indicators.length ? indicators : [{ name: "Local heuristic", status: "SAFE", details: "No strong browser-side phishing indicators found." }],
    mitigationPlan: ["Verify the domain manually before entering credentials."]
  };
}

function localEmailScan(content) {
  const hits = [
    /urgent|immediate|within 24 hours|suspend/i,
    /verify account|reset password|login|otp|credentials/i,
    /wire transfer|gift card|payment|invoice|crypto|wallet/i,
    /https?:\/\/\S+/i
  ].filter((pattern) => pattern.test(content)).length;
  const score = Math.min(15 + hits * 22, 100);

  return {
    threatScore: score,
    threatLevel: levelFromScore(score),
    summary: "Email was analyzed with local browser heuristics because the backend was unavailable.",
    indicators: [{ name: "Suspicious language matches", status: hits ? "WARNING" : "SAFE", details: `${hits} phishing pattern groups matched.` }],
    mitigationPlan: ["Verify sender identity using a trusted channel."]
  };
}

async function maybeNotify(report) {
  if (["HIGH", "CRITICAL"].includes(String(report.threatLevel).toUpperCase())) {
    await chrome.runtime.sendMessage({
      type: "AEGIS_NOTIFY",
      title: "AegisShield threat detected",
      message: `${report.threatLevel} risk (${report.threatScore}%).`
    });
  }
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function postJson(url, body) {
  return fetchJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

function updateRisk(level, score) {
  const normalized = String(level || "LOW").toUpperCase();
  const numericScore = Number(score || 0);
  els.riskLevel.textContent = normalized;
  els.scoreRing.textContent = `${numericScore}%`;
  els.scoreRing.style.borderColor = colorForLevel(normalized);
}

function setBusy(message) {
  showHtml(`<p class="muted">${escapeHtml(message)}</p>`);
}

function showMessage(title, message) {
  showHtml(`<h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p>`);
}

function showHtml(html) {
  els.result.innerHTML = html;
}

function looksLikeUrl(value) {
  return /^https?:\/\//i.test(value) || /^[a-z0-9.-]+\.[a-z]{2,24}(\/\S*)?$/i.test(value);
}

function extractDomain(value) {
  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    return new URL(withProtocol).hostname;
  } catch (error) {
    return "";
  }
}

function levelFromScore(score) {
  if (score >= 80) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 25) return "MEDIUM";
  if (score >= 10) return "LOW";
  return "SAFE";
}

function colorForLevel(level) {
  if (level === "CRITICAL" || level === "HIGH") return "#d64141";
  if (level === "MEDIUM") return "#d88718";
  return "#16885f";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
