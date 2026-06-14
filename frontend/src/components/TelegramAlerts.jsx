import React, { useMemo, useState } from "react";
import { apiUrl } from "../config";

export default function TelegramAlerts({ searchHistory = [] }) {
  const latestThreat = useMemo(() => {
    return searchHistory.find((item) => item.status === "threat") || searchHistory[0] || null;
  }, [searchHistory]);

  const [chatId, setChatId] = useState(() => localStorage.getItem("telegram_alert_chat_id") || "");
  const [message, setMessage] = useState(() => buildMessage(latestThreat));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const useLatestThreat = () => {
    setMessage(buildMessage(latestThreat));
  };

  const sendAlert = async (event) => {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    localStorage.setItem("telegram_alert_chat_id", chatId.trim());

    try {
      const res = await fetch(apiUrl("/api/alerts/telegram"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: chatId || undefined,
          message,
          incident: latestThreat
        })
      });

      const data = await res.json();
      setResult({ ok: res.ok, data });
    } catch (error) {
      setResult({ ok: false, data: { error: error.message } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-pane" style={{ maxWidth: "1050px", margin: "0 auto", padding: "20px" }}>
      <div className="glass-card" style={{ borderRadius: "8px", marginBottom: "18px" }}>
        <p style={eyebrowStyle}>Telegram Alerts</p>
        <h2 style={titleStyle}>Send Mobile Threat Alerts</h2>
        <p style={subtitleStyle}>
          To deliver messages directly to a chat, the backend must use Telegram Bot API credentials.
        </p>
      </div>

      <div style={gridStyle}>
        <form onSubmit={sendAlert} className="glass-card" style={{ borderRadius: "8px" }}>
          <label style={labelStyle}>
            Telegram chat ID or username (optional)
            <input
              value={chatId}
              onChange={(event) => setChatId(event.target.value)}
              placeholder="Example: 7525033541 or @YourBotChat"
              style={inputStyle}
            />
            <span style={{ color: "#94a3b8", fontSize: "12px", marginTop: "6px", display: "block" }}>
              Leave this blank to use the configured TELEGRAM_CHAT_ID from backend/.env.
            </span>
          </label>

          <label style={labelStyle}>
            Alert message
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={8}
              style={{ ...inputStyle, paddingTop: "12px", resize: "vertical" }}
            />
          </label>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button type="submit" disabled={loading || !message.trim()} style={buttonStyle}>
              {loading ? "Sending..." : "Send Telegram Alert"}
            </button>
            <button type="button" onClick={useLatestThreat} style={secondaryButtonStyle}>
              Use Latest Threat
            </button>
          </div>
        </form>

        <div className="glass-card" style={{ borderRadius: "8px" }}>
          <h3 className="panel-section-title">Delivery Status</h3>

          {!result ? (
            <p style={subtitleStyle}>No alert sent in this session.</p>
          ) : result.ok ? (
            <div style={{ ...statusBoxStyle, borderColor: "#00e676", color: "#72f5a6" }}>
              Alert sent through {result.data.provider}. {result.data.to ? `Delivered to ${result.data.to}.` : "Delivered via configured backend chat."}
            </div>
          ) : (
            <div style={{ ...statusBoxStyle, borderColor: "#ffb300", color: "#ffd166" }}>
              <strong>{result.data.error || "Alert not sent."}</strong>
              {result.data.details && (
                <p style={{ marginTop: "12px" }}>{result.data.details}</p>
              )}
              {result.data.setup && (
                <ul style={{ marginTop: "12px", paddingLeft: "18px" }}>
                  {result.data.setup.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div style={{ marginTop: "18px" }}>
            <h3 className="panel-section-title">Backend .env Needed</h3>
            <pre style={codeStyle}>{`TELEGRAM_BOT_TOKEN=8802779164:AAEW_lcvm8UdhEVD7PkikntpDhOEAWwHyxA
TELEGRAM_CHAT_ID=7525033541
`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildMessage(item) {
  if (!item) {
    return "CyberAegis AI Alert\nNo recent threat selected. Please review the dashboard.";
  }

  return [
    "CyberAegis AI Alert",
    `Type: ${String(item.type || "scan").toUpperCase()}`,
    `Severity: ${item.severity || "low"}`,
    `Status: ${item.status || "unknown"}`,
    `Message: ${item.message || "Threat requires review"}`,
    `Time: ${item.time || new Date().toLocaleString()}`
  ].join("\n");
}

const eyebrowStyle = { color: "#00ffd5", fontSize: "13px", fontWeight: 800, marginBottom: "6px" };
const titleStyle = { color: "#f8fafc", fontSize: "32px", fontWeight: 800, margin: 0 };
const subtitleStyle = { color: "#94a3b8", fontSize: "14px", lineHeight: 1.7, marginTop: "8px" };
const gridStyle = { display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(300px, 0.9fr)", gap: "18px" };
const labelStyle = { display: "grid", gap: "8px", marginBottom: "16px", color: "#cbd5e1", fontWeight: 800, fontSize: "13px" };
const inputStyle = { width: "100%", minHeight: "46px", padding: "0 13px", borderRadius: "8px", background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", color: "#f8fafc" };
const buttonStyle = { minHeight: "44px", borderRadius: "8px", padding: "0 18px", fontWeight: 800 };
const secondaryButtonStyle = { minHeight: "44px", borderRadius: "8px", padding: "0 18px", fontWeight: 800, background: "rgba(0,255,213,0.08)", color: "#00ffd5", border: "1px solid rgba(0,255,213,0.35)" };
const statusBoxStyle = { border: "1px solid", borderRadius: "8px", padding: "14px", background: "rgba(255,255,255,0.03)", lineHeight: 1.6 };
const codeStyle = { marginTop: "10px", padding: "14px", borderRadius: "8px", background: "#050814", color: "#cbd5e1", overflowX: "auto" };
