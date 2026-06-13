import React, { useMemo, useState } from "react";

const statusOptions = ["new", "investigating", "contained", "resolved"];

const severityRank = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export default function IncidentResponse({ searchHistory = [] }) {
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [caseState, setCaseState] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("incident_cases")) || {};
    } catch {
      return {};
    }
  });

  const cases = useMemo(() => {
    return searchHistory
      .map((item) => {
        const saved = caseState[item.id] || {};

        return {
          ...item,
          analystStatus: saved.analystStatus || "new",
          note: saved.note || "",
          priority: severityRank[item.severity] || 1,
        };
      })
      .filter((item) => severityFilter === "all" || item.severity === severityFilter)
      .filter((item) => statusFilter === "all" || item.analystStatus === statusFilter)
      .sort((a, b) => b.priority - a.priority || b.id - a.id);
  }, [caseState, searchHistory, severityFilter, statusFilter]);

  const metrics = useMemo(() => {
    const openCases = searchHistory.filter((item) => {
      const saved = caseState[item.id] || {};
      return (saved.analystStatus || "new") !== "resolved";
    });

    return {
      total: searchHistory.length,
      open: openCases.length,
      critical: searchHistory.filter((item) => item.severity === "critical").length,
      threats: searchHistory.filter((item) => item.status === "threat").length,
    };
  }, [caseState, searchHistory]);

  const updateCase = (id, updates) => {
    setCaseState((current) => {
      const updated = {
        ...current,
        [id]: {
          ...(current[id] || {}),
          ...updates,
        },
      };

      localStorage.setItem("incident_cases", JSON.stringify(updated));
      return updated;
    });
  };

  const exportCases = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      totalCases: cases.length,
      cases,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "aegisshield-incident-cases.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="tab-pane" style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <div style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>Incident Response</p>
          <h2 style={titleStyle}>Threat Triage Queue</h2>
          <p style={subtitleStyle}>
            Review scan findings, assign response status, and preserve analyst notes.
          </p>
        </div>

        <button type="button" onClick={exportCases} style={exportButtonStyle} disabled={cases.length === 0}>
          Export cases
        </button>
      </div>

      <div style={metricsGridStyle}>
        <Metric label="Total cases" value={metrics.total} />
        <Metric label="Open cases" value={metrics.open} />
        <Metric label="Threats" value={metrics.threats} tone="#ff5d7a" />
        <Metric label="Critical" value={metrics.critical} tone="#d500f9" />
      </div>

      <div style={toolbarStyle}>
        <label style={filterLabelStyle}>
          Severity
          <select
            value={severityFilter}
            onChange={(event) => setSeverityFilter(event.target.value)}
            style={selectStyle}
          >
            <option value="all">All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>

        <label style={filterLabelStyle}>
          Status
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={selectStyle}
          >
            <option value="all">All</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {formatStatus(status)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {cases.length === 0 ? (
        <div className="glass-card" style={emptyStyle}>
          No matching incident cases yet. Run a scanner to populate this queue.
        </div>
      ) : (
        <div style={caseListStyle}>
          {cases.map((item) => (
            <article key={item.id} style={caseStyle}>
              <div style={caseHeaderStyle}>
                <div>
                  <div style={caseTitleStyle}>{item.message}</div>
                  <div style={caseMetaStyle}>
                    {item.type?.toUpperCase()} scan • {item.time}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <span style={{ ...pillStyle, ...getSeverityStyle(item.severity) }}>
                    {item.severity || "low"}
                  </span>
                  <span style={{ ...pillStyle, ...getStatusStyle(item.analystStatus) }}>
                    {formatStatus(item.analystStatus)}
                  </span>
                </div>
              </div>

              <div style={caseControlsStyle}>
                <label style={filterLabelStyle}>
                  Response status
                  <select
                    value={item.analystStatus}
                    onChange={(event) => updateCase(item.id, { analystStatus: event.target.value })}
                    style={selectStyle}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {formatStatus(status)}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ ...filterLabelStyle, flex: "1 1 320px" }}>
                  Analyst note
                  <input
                    value={item.note}
                    onChange={(event) => updateCase(item.id, { note: event.target.value })}
                    placeholder="Add containment action, owner, or follow-up..."
                    style={inputStyle}
                  />
                </label>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, tone = "#00ffd5" }) {
  return (
    <div style={metricStyle}>
      <div style={metricLabelStyle}>{label}</div>
      <div style={{ ...metricValueStyle, color: tone }}>{value}</div>
    </div>
  );
}

function formatStatus(status) {
  return status
    .split("-")
    .join(" ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getSeverityStyle(severity) {
  if (severity === "critical") return { color: "#f0abfc", borderColor: "#d500f9" };
  if (severity === "high") return { color: "#ff8aa0", borderColor: "#ff1744" };
  if (severity === "medium") return { color: "#ffd166", borderColor: "#ffb300" };
  return { color: "#72f5a6", borderColor: "#00e676" };
}

function getStatusStyle(status) {
  if (status === "resolved") return { color: "#72f5a6", borderColor: "#00e676" };
  if (status === "contained") return { color: "#00ffd5", borderColor: "#00ffd5" };
  if (status === "investigating") return { color: "#ffd166", borderColor: "#ffb300" };
  return { color: "#cbd5e1", borderColor: "rgba(255,255,255,0.18)" };
}

const headerStyle = {
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
  color: "#94a3b8",
  fontSize: "14px",
  lineHeight: 1.6,
  marginTop: "8px",
};

const exportButtonStyle = {
  padding: "11px 16px",
  borderRadius: "8px",
  border: "1px solid rgba(0,255,213,0.35)",
  background: "rgba(0,255,213,0.08)",
  color: "#00ffd5",
  cursor: "pointer",
  fontWeight: 800,
};

const metricsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: "14px",
  marginBottom: "18px",
};

const metricStyle = {
  padding: "16px",
  borderRadius: "8px",
  border: "1px solid rgba(0,255,213,0.16)",
  background: "rgba(15,20,35,0.82)",
};

const metricLabelStyle = {
  color: "#94a3b8",
  fontSize: "12px",
  textTransform: "uppercase",
};

const metricValueStyle = {
  marginTop: "8px",
  fontSize: "28px",
  fontWeight: 800,
};

const toolbarStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "14px",
  padding: "14px",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.025)",
  marginBottom: "18px",
};

const filterLabelStyle = {
  display: "grid",
  gap: "7px",
  color: "#cbd5e1",
  fontSize: "12px",
  fontWeight: 800,
};

const selectStyle = {
  minWidth: "170px",
  padding: "10px 12px",
  borderRadius: "8px",
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#f8fafc",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#f8fafc",
};

const caseListStyle = {
  display: "grid",
  gap: "12px",
};

const caseStyle = {
  padding: "16px",
  borderRadius: "8px",
  background: "rgba(13,17,33,0.9)",
  border: "1px solid rgba(0,255,213,0.14)",
};

const caseHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  marginBottom: "14px",
};

const caseTitleStyle = {
  color: "#f8fafc",
  fontSize: "15px",
  fontWeight: 800,
};

const caseMetaStyle = {
  color: "#94a3b8",
  fontSize: "12px",
  marginTop: "5px",
};

const pillStyle = {
  height: "28px",
  display: "inline-flex",
  alignItems: "center",
  padding: "0 10px",
  borderRadius: "999px",
  border: "1px solid",
  fontSize: "12px",
  fontWeight: 800,
  textTransform: "capitalize",
};

const caseControlsStyle = {
  display: "flex",
  gap: "14px",
  flexWrap: "wrap",
  alignItems: "end",
};

const emptyStyle = {
  borderRadius: "8px",
  color: "#94a3b8",
  textAlign: "center",
};
