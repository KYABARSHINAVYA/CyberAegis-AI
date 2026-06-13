import React, { useMemo, useState } from "react";

const sampleIndicators = [
  "paypal-security-alert.xyz/login",
  "https://google.com",
  "URGENT: your account will be suspended within 24 hours. Verify account at http://paypa1-update.click",
  "microsoft-login-security.top",
].join("\n");

export default function BulkInvestigation({ addToHistory }) {
  const [input, setInput] = useState(sampleIndicators);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [notes, setNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("bulk_investigation_notes")) || {};
    } catch {
      return {};
    }
  });
  const [error, setError] = useState("");

  const indicators = useMemo(() => parseIndicators(input), [input]);

  const filteredResults = useMemo(() => {
    if (filter === "all") return results;
    if (filter === "failed") return results.filter((item) => item.error);
    return results.filter((item) => String(item.threatLevel).toLowerCase() === filter);
  }, [filter, results]);

  const investigation = useMemo(() => buildInvestigation(results), [results]);

  const runBulkScan = async () => {
    if (indicators.length === 0) {
      setError("Add at least one URL, domain, or message before scanning.");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);
    setSummary(null);

    try {
      const apiKey = localStorage.getItem("gemini_api_key") || "";
      const response = await fetch("/api/analyze/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: indicators, apiKey }),
      });

      if (!response.ok) {
        const details = await response.json().catch(() => ({}));
        throw new Error(details.error || "Bulk scan failed.");
      }

      const data = await response.json();
      setResults(data.results || []);
      setSummary(data);

      const highestSeverity = getHighestSeverity(data.results || []);
      addToHistory?.(
        `Bulk investigation scanned ${data.scanned || 0} indicators`,
        "bulk",
        highestSeverity === "low" ? "safe" : "threat",
        highestSeverity
      );
    } catch (scanError) {
      setError(scanError.message || "Bulk scan failed. Check backend status.");
    } finally {
      setLoading(false);
    }
  };

  const updateNote = (id, note) => {
    setNotes((current) => {
      const updated = { ...current, [id]: note };
      localStorage.setItem("bulk_investigation_notes", JSON.stringify(updated));
      return updated;
    });
  };

  const exportInvestigation = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      summary,
      investigation,
      results: results.map((item) => ({
        ...item,
        analystNote: notes[item.id] || "",
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "aegisshield-bulk-investigation.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="tab-pane" style={pageStyle}>
      <section style={heroStyle}>
        <div>
          <p style={eyebrowStyle}>Advanced Investigation</p>
          <h2 style={titleStyle}>Bulk Scan & Data Investigation</h2>
          <p style={subtitleStyle}>
            Paste URLs, domains, or suspicious message snippets. AegisShield classifies each item and builds an investigation view from the evidence.
          </p>
        </div>
        <button type="button" onClick={exportInvestigation} disabled={results.length === 0} style={secondaryButtonStyle}>
          Export investigation
        </button>
      </section>

      <section style={gridStyle}>
        <div className="glass-card" style={inputPanelStyle}>
          <div style={panelHeaderStyle}>
            <h3 style={panelTitleStyle}>Indicators</h3>
            <span style={countPillStyle}>{indicators.length} queued</span>
          </div>

          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste one indicator per line..."
            style={textareaStyle}
          />

          <div style={actionsStyle}>
            <button type="button" onClick={runBulkScan} disabled={loading || indicators.length === 0} style={primaryButtonStyle}>
              {loading ? "Scanning..." : "Run bulk scan"}
            </button>
            <button type="button" onClick={() => setInput("")} style={ghostButtonStyle}>
              Clear
            </button>
          </div>

          {error && <p style={errorStyle}>{error}</p>}
        </div>

        <div style={summaryGridStyle}>
          <SummaryCard label="Scanned" value={summary?.scanned || 0} />
          <SummaryCard label="High risk" value={summary?.highRiskCount || 0} tone="#ff5d7a" />
          <SummaryCard label="Failed" value={summary?.failed || 0} tone="#fbbf24" />
          <SummaryCard label="Domains" value={investigation.domains.length} />
        </div>
      </section>

      {results.length > 0 && (
        <>
          <section style={insightGridStyle}>
            <InsightPanel title="Threat Levels" items={Object.entries(summary?.byLevel || {})} />
            <InsightPanel title="Detected Types" items={Object.entries(summary?.byType || {})} />
            <InsightPanel title="Domain Clusters" items={investigation.domains.slice(0, 6).map((item) => [item.domain, item.count])} />
          </section>

          <section className="glass-card" style={resultsPanelStyle}>
            <div style={panelHeaderStyle}>
              <h3 style={panelTitleStyle}>Evidence Table</h3>
              <select value={filter} onChange={(event) => setFilter(event.target.value)} style={selectStyle}>
                <option value="all">All results</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="safe">Safe</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div style={tableStyle}>
              {filteredResults.map((item) => (
                <article key={item.id} style={rowStyle}>
                  <div style={rowTopStyle}>
                    <div>
                      <div style={inputTextStyle}>{item.input}</div>
                      <div style={metaStyle}>
                        {(item.detectedType || "unknown").toUpperCase()}
                        {item.domain ? ` • ${item.domain}` : ""}
                      </div>
                    </div>
                    {item.error ? (
                      <span style={{ ...badgeStyle, color: "#fbbf24", borderColor: "#fbbf24" }}>Failed</span>
                    ) : (
                      <span style={{ ...badgeStyle, ...getLevelStyle(item.threatLevel) }}>
                        {item.threatLevel} • {item.threatScore}%
                      </span>
                    )}
                  </div>

                  <p style={summaryTextStyle}>{item.error || item.summary || "No summary provided."}</p>

                  {item.indicators?.length > 0 && (
                    <div style={indicatorListStyle}>
                      {item.indicators.slice(0, 3).map((indicator, index) => (
                        <span key={`${item.id}-indicator-${index}`} style={miniPillStyle}>
                          {indicator.name || indicator.category || "Finding"}
                        </span>
                      ))}
                    </div>
                  )}

                  <input
                    value={notes[item.id] || ""}
                    onChange={(event) => updateNote(item.id, event.target.value)}
                    placeholder="Analyst note or follow-up action..."
                    style={noteInputStyle}
                  />
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function parseIndicators(value) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 50);
}

function buildInvestigation(items) {
  const domains = new Map();

  items.forEach((item) => {
    const domain = item.domain || extractDomain(item.input);
    if (!domain) return;

    domains.set(domain, (domains.get(domain) || 0) + 1);
  });

  return {
    domains: Array.from(domains.entries())
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count),
  };
}

function extractDomain(value) {
  try {
    const candidate = /^https?:\/\//i.test(value) ? value : `http://${value}`;
    return new URL(candidate).hostname;
  } catch {
    return "";
  }
}

function getHighestSeverity(items) {
  const order = { critical: 4, high: 3, medium: 2, low: 1, safe: 1 };
  return items.reduce((highest, item) => {
    const level = String(item.threatLevel || "low").toLowerCase();
    return (order[level] || 1) > (order[highest] || 1) ? level : highest;
  }, "low");
}

function SummaryCard({ label, value, tone = "#00ffd5" }) {
  return (
    <div style={summaryCardStyle}>
      <span style={summaryLabelStyle}>{label}</span>
      <strong style={{ ...summaryValueStyle, color: tone }}>{value}</strong>
    </div>
  );
}

function InsightPanel({ title, items }) {
  return (
    <div className="glass-card" style={insightPanelStyle}>
      <h3 style={panelTitleStyle}>{title}</h3>
      {items.length === 0 ? (
        <p style={mutedStyle}>No data yet</p>
      ) : (
        items.map(([label, value]) => (
          <div key={label} style={insightRowStyle}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))
      )}
    </div>
  );
}

function getLevelStyle(level) {
  const normalized = String(level || "safe").toUpperCase();
  if (normalized === "CRITICAL") return { color: "#f0abfc", borderColor: "#d500f9" };
  if (normalized === "HIGH") return { color: "#ff8aa0", borderColor: "#ff1744" };
  if (normalized === "MEDIUM") return { color: "#ffd166", borderColor: "#ffb300" };
  return { color: "#72f5a6", borderColor: "#00e676" };
}

const pageStyle = {
  maxWidth: "1300px",
  margin: "0 auto",
  padding: "20px",
};

const heroStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "20px",
  alignItems: "flex-start",
  marginBottom: "20px",
};

const eyebrowStyle = {
  color: "#00ffd5",
  fontSize: "13px",
  fontWeight: 800,
  marginBottom: "6px",
};

const titleStyle = {
  color: "#f8fafc",
  fontSize: "30px",
  fontWeight: 800,
  margin: 0,
};

const subtitleStyle = {
  maxWidth: "720px",
  color: "#94a3b8",
  fontSize: "14px",
  lineHeight: 1.6,
  marginTop: "8px",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(320px, 1.4fr) minmax(240px, 0.8fr)",
  gap: "18px",
  marginBottom: "18px",
};

const inputPanelStyle = {
  borderRadius: "8px",
  padding: "20px",
};

const panelHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "14px",
  marginBottom: "14px",
};

const panelTitleStyle = {
  color: "#f8fafc",
  fontSize: "17px",
  fontWeight: 800,
  margin: 0,
};

const countPillStyle = {
  color: "#00ffd5",
  border: "1px solid rgba(0,255,213,0.35)",
  borderRadius: "999px",
  padding: "5px 10px",
  fontSize: "12px",
  fontWeight: 800,
};

const textareaStyle = {
  width: "100%",
  minHeight: "210px",
  resize: "vertical",
  padding: "14px",
  borderRadius: "8px",
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#f8fafc",
  lineHeight: 1.55,
};

const actionsStyle = {
  display: "flex",
  gap: "10px",
  marginTop: "12px",
};

const primaryButtonStyle = {
  padding: "12px 16px",
  borderRadius: "8px",
  border: "none",
  background: "linear-gradient(135deg,#00ffcc,#00f0ff)",
  color: "#06111f",
  fontWeight: 800,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  padding: "11px 16px",
  borderRadius: "8px",
  border: "1px solid rgba(0,255,213,0.35)",
  background: "rgba(0,255,213,0.08)",
  color: "#00ffd5",
  cursor: "pointer",
  fontWeight: 800,
};

const ghostButtonStyle = {
  padding: "12px 16px",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "transparent",
  color: "#cbd5e1",
  cursor: "pointer",
};

const errorStyle = {
  marginTop: "12px",
  color: "#ff5d7a",
  fontSize: "13px",
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "12px",
};

const summaryCardStyle = {
  minHeight: "100px",
  padding: "16px",
  borderRadius: "8px",
  background: "rgba(13,17,33,0.84)",
  border: "1px solid rgba(0,255,213,0.16)",
};

const summaryLabelStyle = {
  color: "#94a3b8",
  fontSize: "12px",
  textTransform: "uppercase",
};

const summaryValueStyle = {
  display: "block",
  marginTop: "10px",
  fontSize: "30px",
};

const insightGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: "14px",
  marginBottom: "18px",
};

const insightPanelStyle = {
  borderRadius: "8px",
};

const insightRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "10px 0",
  color: "#cbd5e1",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};

const mutedStyle = {
  color: "#94a3b8",
  fontSize: "13px",
};

const resultsPanelStyle = {
  borderRadius: "8px",
};

const selectStyle = {
  padding: "10px 12px",
  borderRadius: "8px",
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#f8fafc",
};

const tableStyle = {
  display: "grid",
  gap: "12px",
};

const rowStyle = {
  padding: "14px",
  borderRadius: "8px",
  background: "rgba(255,255,255,0.025)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const rowTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "14px",
};

const inputTextStyle = {
  color: "#f8fafc",
  fontWeight: 800,
  wordBreak: "break-word",
};

const metaStyle = {
  color: "#94a3b8",
  fontSize: "12px",
  marginTop: "5px",
};

const badgeStyle = {
  flex: "0 0 auto",
  padding: "6px 10px",
  borderRadius: "999px",
  border: "1px solid",
  fontSize: "12px",
  fontWeight: 800,
};

const summaryTextStyle = {
  marginTop: "10px",
  color: "#cbd5e1",
  fontSize: "13px",
  lineHeight: 1.6,
};

const indicatorListStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginTop: "10px",
};

const miniPillStyle = {
  padding: "5px 8px",
  borderRadius: "999px",
  background: "rgba(0,255,213,0.08)",
  color: "#00ffd5",
  fontSize: "12px",
};

const noteInputStyle = {
  width: "100%",
  marginTop: "12px",
  padding: "10px 12px",
  borderRadius: "8px",
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#f8fafc",
};
