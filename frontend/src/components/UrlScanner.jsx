import React, { useState } from 'react';
import { apiUrl } from '../config';

export default function UrlScanner({
  addToHistory
}){
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  
  const [completedMitigations, setCompletedMitigations] = useState({});

  const handleScan = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setReport(null);
    setCompletedMitigations({});

    try {
      const localGeminiKey = localStorage.getItem('gemini_api_key') || '';

      const res = await fetch(apiUrl("/api/analyze/url"), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, apiKey: localGeminiKey })
      });

      if (!res.ok) throw new Error("Failed to analyze URL");

      const data = await res.json();
      setReport(data);

      // =========================
      // SEVERITY MAPPING (EMAIL STYLE)
      // =========================
      let severity = "low";

      if (data.threatLevel) {
        switch (data.threatLevel.toUpperCase()) {
          case "CRITICAL":
            severity = "critical";
            break;
          case "HIGH":
            severity = "high";
            break;
          case "MEDIUM":
            severity = "medium";
            break;
          default:
            severity = "low";
        }
      } else {
        if (data.threatScore >= 80) severity = "critical";
        else if (data.threatScore >= 60) severity = "high";
        else if (data.threatScore >= 40) severity = "medium";
        else severity = "low";
      }

      const status = severity === "low" ? "safe" : "threat";

      // =========================
      // HISTORY (FIXED LIKE EMAIL)
      // =========================
      addToHistory?.(
        status === "safe"
          ? "Safe URL scanned"
          : "Malicious URL detected",
        "url",
        status,
        severity
      );

    } catch (err) {
      console.error(err);
      alert("Error analyzing URL. Check backend.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // HISTORY FILTERING
  // =========================
  

  const toggleMitigation = (index) => {
    setCompletedMitigations(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  const getThreatClass = (level) => {
  switch ((level || "").toUpperCase()) {
    case "SAFE":
      return "safe";
    case "LOW":
    case "MEDIUM":
      return "warning";
    case "HIGH":
      return "high";
    case "CRITICAL":
      return "critical";
    default:
      return "warning";
  }
};

  return (
    <div className="tab-pane" style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px" }}>

      {/* ================= INPUT ================= */}
      <div className="glass-card" style={{ padding: "30px", borderRadius: "20px", background: "#111827" }}>
        <h2 style={{ color: "#00ffd5" }}>
  🌐 URL Phishing Scanner
</h2>

<p
  style={{
    color: "#94a3b8",
    marginTop: "10px",
    lineHeight: "1.6",
    fontSize: "0.95rem"
  }}
>
  Enter a website URL to analyze for phishing attempts, malicious domains,
  suspicious redirects, and other security threats.
</p>

        <form onSubmit={handleScan}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a website URL (e.g. https://google.com)"
            style={{
              width: "100%",
              padding: "14px",
              marginTop: "15px",
              borderRadius: "12px",
              background: "#0f172a",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.2)"
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "15px",
              padding: "12px 25px",
              borderRadius: "12px",
              background: "linear-gradient(135deg,#00ff99,#00c8ff)",
              border: "none",
              fontWeight: "700"
            }}
          >
            {loading ? "Scanning..." : "Scan URL"}
          </button>
        </form>
      </div>

      
      {/* ================= LOADING ================= */}
      {loading && (
        <div className="glass-card" style={{ marginTop: "20px", padding: "20px" }}>
          <div style={{ color: "#00ffd5" }}>Analyzing URL structure...</div>
        </div>
      )}

      {/* ================= REPORT (EMAIL STYLE) ================= */}
      {report && (
  <div className="results-container">

    {/* LEFT PANEL */}
    <div
      className="glass-card score-panel"
      style={{
        background: "#101827",
        borderRadius: "20px",
        padding: "30px",
        boxShadow: "0 0 25px rgba(0,255,255,.1)"
      }}
    >
      <h3 className="panel-section-title">
        Threat Assessment
      </h3>

      <div className="gauge-wrapper">
        <svg width="180" height="180" viewBox="0 0 120 120">

          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="#1b1b1b"
            strokeWidth="10"
          />

          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke={
              report.threatScore > 70
                ? "#ff4444"
                : report.threatScore > 40
                ? "#ffaa00"
                : "#00ff99"
            }
            strokeWidth="10"
            strokeDasharray="314"
            strokeDashoffset={
              314 - (314 * Number(report.threatScore || 0)) / 100
            }
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
          />

          <text
            x="50%"
            y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="22"
            fontWeight="bold"
          >
            {report.threatScore || 0}%
          </text>

        </svg>
      </div>

      <span className={`threat-badge ${getThreatClass(report.threatLevel)}`}>
        {report.threatLevel} RISK
      </span>

      <div style={{ marginTop: "1.25rem" }}>
        <span className="form-label">
          CLASSIFICATION
        </span>

        <p
          style={{
            fontFamily: "var(--font-cyber)",
            fontSize: "1.1rem",
            color: "var(--primary)"
          }}
        >
          {report.classification}
        </p>
      </div>

    </div>

    {/* RIGHT PANEL */}
    <div className="details-panel">

      <div className="glass-card">
        <h3 className="panel-section-title">
          📝 Analysis Summary
        </h3>

        <p>{report.summary}</p>
      </div>

      {report.indicators?.length > 0 && (
        <div className="glass-card">
          <h3 className="panel-section-title">
            📊 Key Security Findings
          </h3>

          {report.indicators.map((item, idx) => (
            <div key={idx} className="detail-item">

              <div className="detail-body">
                <div className="detail-title">
                  {item.name}
                </div>

                <div className="detail-desc">
                  {item.details}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {report.mitigationPlan?.length > 0 && (
        <div className="glass-card">

          <h3 className="panel-section-title">
            🛡️ Recommended Mitigation Checklist
          </h3>

          {report.mitigationPlan.map((step, idx) => (
            <div key={idx} className="checklist-item">

              <div
                className={`checklist-checkbox ${
                  completedMitigations[idx] ? "checked" : ""
                }`}
                onClick={() => toggleMitigation(idx)}
              />

              <span
                className={`checklist-text ${
                  completedMitigations[idx] ? "checked" : ""
                }`}
              >
                {step}
              </span>

            </div>
          ))}

        </div>
      )}

    </div>

  </div>
)}
    </div>
  );
}
