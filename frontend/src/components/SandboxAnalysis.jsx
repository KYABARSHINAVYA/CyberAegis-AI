import React, { useState } from "react";
import { apiUrl } from "../config";

export default function SandboxAnalysis({ addToHistory }) {
  const [indicator, setIndicator] = useState("");
  const [type, setType] = useState("url");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const runSandbox = async (event) => {
    event.preventDefault();
    if (!indicator.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      // Choose the correct backend endpoint and payload per indicator type
      let path = "/api/analyze/universal";
      let payload = { text: indicator };
      const localGeminiKey = localStorage.getItem('gemini_api_key') || '';

      if (type === 'url') {
        path = '/api/analyze/url';
        payload = { url: indicator, apiKey: localGeminiKey };
      } else if (type === 'email') {
        path = '/api/analyze/email';
        payload = { content: indicator, headers: '', apiKey: localGeminiKey };
      } else {
        // universal will auto-detect url/email or classify plain text
        path = '/api/analyze/universal';
        payload = { text: indicator, apiKey: localGeminiKey };
      }

      const res = await fetch(apiUrl(path), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      let data;
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Expected JSON response but received: ${text.slice(0,200)}`);
      }

      if (!res.ok) throw new Error(data.error || `Sandbox analysis failed (${res.status})`);

      // Map backend report shape to the sandbox UI expectation
      const mapped = {
        verdict: data.threatLevel || (data.detectedType || '').toUpperCase() || 'UNKNOWN',
        riskScore: data.threatScore != null ? data.threatScore : (data.riskScore != null ? data.riskScore : 0),
        executedAt: data.executedAt || new Date().toISOString(),
        behaviors: (data.findings || data.indicators || []).map((item) => ({
          name: item.category || item.name || 'Finding',
          detail: item.description || item.details || item.reason || '',
          status: (item.severity || item.status || '').toUpperCase() || 'SAFE'
        })),
        raw: data
      };

      setResult(mapped);
      addToHistory?.(
        `${data.verdict} sandbox analysis`,
        "sandbox",
        data.riskScore >= 50 ? "threat" : "safe",
        data.riskScore >= 80 ? "critical" : data.riskScore >= 50 ? "high" : "low"
      );
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-pane" style={{ maxWidth: "1150px", margin: "0 auto", padding: "20px" }}>
      <div className="glass-card" style={headerCardStyle}>
        <p style={eyebrowStyle}>Sandbox Analysis</p>
        <h2 style={titleStyle}>Controlled Detonation Workspace</h2>
        <p style={subtitleStyle}>
          Submit URLs, QR payloads, or suspicious message fragments for behavioral analysis before users interact with them.
        </p>

        <form onSubmit={runSandbox} style={formStyle}>
          <select value={type} onChange={(event) => setType(event.target.value)} style={inputStyle}>
            <option value="url">URL</option>
            <option value="qr">QR Payload</option>
            <option value="email">Email Text</option>
            <option value="file">File Indicator</option>
          </select>

          <input
            value={indicator}
            onChange={(event) => setIndicator(event.target.value)}
            placeholder="Paste URL, decoded QR payload, sender, hash, or suspicious text"
            style={{ ...inputStyle, flex: "1 1 420px" }}
          />

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "Detonating..." : "Run Sandbox"}
          </button>
        </form>
      </div>

      {result?.error && (
        <div className="glass-card" style={{ ...noticeStyle, borderColor: "#ff1744", color: "#ff8aa0" }}>
          {result.error}
        </div>
      )}

      {result && !result.error && (
        <div style={resultGridStyle}>
          <div className="glass-card" style={scoreCardStyle}>
            <p style={eyebrowStyle}>Verdict</p>
            <h3 style={{ ...titleStyle, fontSize: "28px" }}>{result.verdict}</h3>
            <div style={{ ...scoreStyle, color: riskColor(result.riskScore) }}>{result.riskScore}%</div>
            <p style={subtitleStyle}>Executed at {new Date(result.executedAt).toLocaleString()}</p>
          </div>

          <div className="glass-card" style={{ borderRadius: "8px" }}>
            <h3 className="panel-section-title">Behavioral Findings</h3>
            {result.behaviors.map((behavior) => (
              <div key={behavior.name} className="detail-item">
                <div className="detail-body">
                  <div className="detail-title">{behavior.name}</div>
                  <div className="detail-desc">{behavior.detail}</div>
                </div>
                <span style={{ ...pillStyle, color: statusColor(behavior.status), borderColor: statusColor(behavior.status) }}>
                  {behavior.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function riskColor(score) {
  if (score >= 80) return "#d500f9";
  if (score >= 50) return "#ff1744";
  if (score >= 25) return "#ffb300";
  return "#00e676";
}

function statusColor(status) {
  if (status === "DANGER") return "#ff1744";
  if (status === "WARNING") return "#ffb300";
  return "#00e676";
}

const headerCardStyle = { borderRadius: "8px", marginBottom: "18px" };
const eyebrowStyle = { color: "#00ffd5", fontSize: "13px", fontWeight: 800, marginBottom: "6px" };
const titleStyle = { color: "#f8fafc", fontSize: "32px", fontWeight: 800, margin: 0 };
const subtitleStyle = { color: "#94a3b8", fontSize: "14px", lineHeight: 1.7, marginTop: "8px" };
const formStyle = { display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "22px", alignItems: "center" };
const inputStyle = { minHeight: "46px", padding: "0 13px", borderRadius: "8px", background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", color: "#f8fafc" };
const buttonStyle = { minHeight: "46px", borderRadius: "8px", padding: "0 18px", fontWeight: 800 };
const noticeStyle = { borderRadius: "8px", marginBottom: "18px" };
const resultGridStyle = { display: "grid", gridTemplateColumns: "minmax(240px, 0.8fr) minmax(0, 1.8fr)", gap: "18px" };
const scoreCardStyle = { borderRadius: "8px", textAlign: "center" };
const scoreStyle = { marginTop: "18px", fontSize: "54px", fontWeight: 900 };
const pillStyle = { display: "inline-flex", alignItems: "center", minHeight: "28px", padding: "0 10px", borderRadius: "999px", border: "1px solid", fontSize: "12px", fontWeight: 800 };
