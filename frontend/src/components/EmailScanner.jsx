import React, { useState } from 'react';
import { apiUrl } from '../config';

export default function EmailScanner({
  addToHistory,
  searchHistory = []
}) {
  const [content, setContent] = useState('');
  const [headers, setHeaders] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [selectedHighlight, setSelectedHighlight] = useState(null);
  const [completedMitigations, setCompletedMitigations] = useState({});

  const handleScan = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setReport(null);
    setSelectedHighlight(null);
    setCompletedMitigations({});

    try {
      // Retrieve Gemini key if set locally in settings
      const localGeminiKey = localStorage.getItem('gemini_api_key') || '';

      const res = await fetch(apiUrl("/api/analyze/email"), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, headers, apiKey: localGeminiKey })
      });

      if (!res.ok) {
        throw new Error('Failed to run email analysis');
      }

      const data = await res.json();
      setReport(data);

      // ✅ ADD HISTORY HERE
      if (data.threatLevel === "CRITICAL") {
        addToHistory?.(
          "Critical phishing email detected",
          "email",
          "threat",
          "critical"
        );
      }
      else if (data.threatLevel === "HIGH") {
        addToHistory?.(
          "High-risk email detected",
          "email",
          "threat",
          "high"
        );
      }
      else if (data.threatLevel === "MEDIUM") {
        addToHistory?.(
          "Suspicious email detected",
          "email",
          "threat",
          "medium"
        );
      }
      else {
        addToHistory?.(
          "Safe email scanned",
          "email",
          "safe",
          "low"
        );
      }
    } catch (err) {
      console.error(err);
      alert('Error conducting email scan. Please verify backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const getThreatClass = (level) => {
    switch (level?.toUpperCase()) {
      case 'SAFE': return 'safe';
      case 'LOW': return 'warning';
      case 'MEDIUM': return 'warning';
      case 'HIGH': return 'high';
      case 'CRITICAL': return 'critical';
      default: return 'warning';
    }
  };

  const toggleMitigation = (index) => {
    setCompletedMitigations(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Helper function to render email content with highlighted text
  const renderHighlightedContent = () => {
    if (!report || !report.highlightedTexts || report.highlightedTexts.length === 0) {
      return content;
    }

    let result = [];
    let currentIdx = 0;
    const textLower = content.toLowerCase();

    let matches = [];
    report.highlightedTexts.forEach((hl, hIdx) => {
      let pos = textLower.indexOf(hl.text.toLowerCase());
      while (pos !== -1) {
        matches.push({
          start: pos,
          end: pos + hl.text.length,
          text: hl.text,
          highlightIndex: hIdx
        });
        pos = textLower.indexOf(hl.text.toLowerCase(), pos + 1);
      }
    });

    // Remove overlapping matches (keep first ones)
    matches.sort((a, b) => a.start - b.start || (b.end - a.end) - (a.end - a.start));
    let filteredMatches = [];
    let lastEnd = -1;
    matches.forEach(m => {
      if (m.start >= lastEnd) {
        filteredMatches.push(m);
        lastEnd = m.end;
      }
    });

    if (filteredMatches.length === 0) {
      return content;
    }

    let lastIdx = 0;
    filteredMatches.forEach((m, idx) => {
      if (m.start > lastIdx) {
        result.push(content.substring(lastIdx, m.start));
      }
      const highlightInfo = report.highlightedTexts[m.highlightIndex];
      const severity = highlightInfo.severity || 'HIGH';
      result.push(
        <span
          key={`hl-${idx}`}
          className={`highlighted-text-span ${severity}`}
          onClick={() => setSelectedHighlight(highlightInfo)}
        >
          {content.substring(m.start, m.end)}
        </span>
      );
      lastIdx = m.end;
    });

    if (lastIdx < content.length) {
      result.push(content.substring(lastIdx));
    }

    return result;
  };

  return (
    <div
      className="tab-pane"
      style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "20px"
      }}
    >
      <div
        className="glass-card"
        style={{
          marginBottom: "2rem",
          background: "rgba(15,20,35,0.9)",
          border: "1px solid rgba(0,255,255,0.15)",
          borderRadius: "20px",
          padding: "30px",
          boxShadow: "0 0 30px rgba(0,255,255,0.1)"
        }}
      >
        <h2
          className="panel-section-title"
          style={{
            color: "#00ffd5",
            fontSize: "2rem",
            fontWeight: "700"
          }}
        >
          ✉️ Email & Message Forensic Scanner
        </h2>
        <p
          className="page-subtitle"
          style={{
            color: "#b8c1d1",
            fontSize: "1rem",
            lineHeight: "1.8"
          }}
        >
          Paste raw messages, SMS copy, or email body. Optionally add mail header fields to inspect SPF/DKIM flags.
        </p>

        <form onSubmit={handleScan}>
          <div
            className="form-group"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "25px",
              marginBottom: "25px"
            }}
          >
            <label
              className="form-label"
              style={{
                width: "180px",
                fontSize: "16px",
                color: "#00ff99",
                marginTop: "15px"
              }}
            >
              📧 Email Content
            </label>

            <textarea
              className="form-textarea"
              placeholder="Paste email body or message text here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              style={{
                width: "400px",
                height: "70px",
                padding: "15px",
                borderRadius: "12px",
                background: "#0f172a",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.15)",
                resize: "none"
              }}
            />
          </div>

          <div
            className="form-group"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "25px",
              marginBottom: "35px"
            }}
          >
            <label
              className="form-label"
              style={{
                width: "180px",
                fontSize: "16px",
                color: "#00ff99",
                marginTop: "15px"
              }}
            >
              📄 Email Headers
            </label>

            <textarea
              className="form-textarea"
              placeholder="Paste mail headers..."
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              style={{
                width: "400px",
                height: "70px",
                padding: "15px",
                borderRadius: "12px",
                background: "#0f172a",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.15)",
                resize: "none"
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              background: "linear-gradient(135deg,#00ffd5,#0099ff)",
              color: "#06111f",
              fontWeight: "700",
              fontSize: "17px",
              padding: "15px 30px",
              borderRadius: "15px",
              border: "none",
              boxShadow: "0 0 20px rgba(0,255,255,.3)"
            }}
          >
            {loading ? 'Analyzing Content...' : 'Scan Content'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="glass-card loading-overlay">
          <div className="radar-spinner"></div>
          <div className="loading-text">DECODING TEXT SEMANTICS...</div>
        </div>
      )}

      {report && (
        <div className="results-container">
          <div
            className="glass-card score-panel"
            style={{
              background: "#101827",
              borderRadius: "20px",
              padding: "30px",
              boxShadow: "0 0 25px rgba(0,255,255,.1)"
            }}
          >
            <h3 className="panel-section-title" style={{ border: 'none', marginBottom: '1rem' }}>
              Threat Assessment
            </h3>

            <div className="gauge-wrapper">
              <svg width="180" height="180" viewBox="0 0 120 120">
                {/* Background circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#1b1b1b"
                  strokeWidth="10"
                />

                {/* Progress circle */}
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

                {/* Percentage text */}
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

            <div style={{ marginTop: '1.25rem' }}>
              <span className="form-label" style={{ marginBottom: 0 }}>CLASSIFICATION</span>
              <p style={{ fontFamily: 'var(--font-cyber)', fontSize: '1.1rem', color: 'var(--primary)', marginTop: '0.25rem' }}>
                {report.classification}
              </p>
            </div>
          </div>

          <div className="details-panel">
            <div className="glass-card">
              <h3 className="panel-section-title">📝 Analysis Summary</h3>
              <p style={{ lineHeight: '1.6', fontSize: '0.95rem' }}>{report.summary}</p>
            </div>

            <div
              className="glass-card"
              style={{
                background: "#111827",
                borderRadius: "18px",
                border: "1px solid rgba(255,255,255,.08)",
                padding: "25px"
              }}
            >
              <h3
                className="panel-section-title"
                style={{
                  color: "#00ffd5",
                  fontSize: "1.5rem",
                  fontWeight: "700"
                }}
              ></h3>
              <p className="page-subtitle" style={{ marginBottom: '1rem' }}>
                Click on the highlighted red/yellow phrases in the email box below to view security evaluations.
              </p>
              <div
                className="highlight-display-box"
                style={{
                  background: "#0b1220",
                  color: "#fff",
                  borderRadius: "15px",
                  padding: "20px",
                  lineHeight: "2",
                  fontSize: "17px",
                  border: "1px solid rgba(255,255,255,.1)"
                }}
              >
                {renderHighlightedContent()}
              </div>

              {selectedHighlight ? (
                <div className={`interactive-explanation ${selectedHighlight.severity || 'HIGH'}`}>
                  <div className="explanation-meta">
                    SEVERITY: <span className="severity-pill">{selectedHighlight.severity}</span>
                  </div>
                  <strong style={{ display: 'block', margin: '0.25rem 0' }}>"{selectedHighlight.text}"</strong>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{selectedHighlight.reason}</p>
                </div>
              ) : (
                <div style={{ marginTop: '1rem', fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  * No phrase selected. Click any highlighted phrase to examine.
                </div>
              )}
            </div>

            {report.findings && report.findings.length > 0 && (
              <div className="glass-card">
                <h3 className="panel-section-title">📊 Key Security Findings</h3>
                <div>
                  {report.findings.map((finding, idx) => (
                    <div key={idx} className="detail-item">
                      <div className="detail-body">
                        <div className="detail-title">{finding.category}</div>
                        <div className="detail-desc">{finding.description}</div>
                      </div>
                      <span className={`severity-pill ${finding.severity}`}>{finding.severity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.mitigationPlan && report.mitigationPlan.length > 0 && (
              <div className="glass-card">
                <h3 className="panel-section-title">🛡️ Recommended Mitigation Checklist</h3>
                <p className="page-subtitle" style={{ marginBottom: '1rem' }}>
                  Safety checklist. Complete these actions before processing the message.
                </p>
                <div>
                  {report.mitigationPlan.map((step, idx) => (
                    <div key={idx} className="checklist-item">
                      <div
                        className={`checklist-checkbox ${completedMitigations[idx] ? 'checked' : ''}`}
                        onClick={() => toggleMitigation(idx)}
                      ></div>
                      <span className={`checklist-text ${completedMitigations[idx] ? 'checked' : ''}`}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


