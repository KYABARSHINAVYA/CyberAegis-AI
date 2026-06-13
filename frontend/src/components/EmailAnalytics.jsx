import React, { useState } from "react";

export default function EmailAnalytics({
  searchHistory = []
}) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const emailHistory = searchHistory.filter(
    item => item.type === "email"
  );

  const safeEmails = emailHistory.filter(
    item => item.severity === "low"
  );

  const mediumEmails = emailHistory.filter(
    item => item.severity === "medium"
  );

  const highEmails = emailHistory.filter(
    item => item.severity === "high"
  );

  const criticalEmails = emailHistory.filter(
    item => item.severity === "critical"
  );

  const displayedEmails =
    selectedCategory === "safe"
      ? safeEmails
      : selectedCategory === "medium"
      ? mediumEmails
      : selectedCategory === "high"
      ? highEmails
      : selectedCategory === "critical"
      ? criticalEmails
      : emailHistory;

  return (
    <div style={{ padding: "25px" }}>
      <h1
        style={{
          color: "#00ffd5",
          marginBottom: "25px"
        }}
      >
        📊 Email Scan Analytics
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: "20px"
        }}
      >
        <div className="monitor-card">
          <h2>{safeEmails.length}</h2>
          <p>Safe Emails</p>
        </div>

        <div className="monitor-card">
          <h2>{mediumEmails.length}</h2>
          <p>Medium Risk</p>
        </div>

        <div className="monitor-card">
          <h2>{highEmails.length}</h2>
          <p>High Risk</p>
        </div>

        <div className="monitor-card">
          <h2>{criticalEmails.length}</h2>
          <p>Critical Emails</p>
        </div>
      </div>

      <select
        value={selectedCategory}
        onChange={(e) =>
          setSelectedCategory(e.target.value)
        }
        style={{
          marginTop: "25px",
          padding: "12px",
          borderRadius: "12px"
        }}
      >
        <option value="all">All Emails</option>
        <option value="safe">Safe Emails</option>
        <option value="medium">Medium Risk</option>
        <option value="high">High Risk</option>
        <option value="critical">Critical Emails</option>
      </select>

      <div
        style={{
          marginTop: "25px",
          background: "#0f172a",
          padding: "20px",
          borderRadius: "15px"
        }}
      >
        <h3
          style={{
            color: "#00ffd5"
          }}
        >
          Email Scan History
        </h3>

        {displayedEmails.length === 0 ? (
          <p>No emails found.</p>
        ) : (
          displayedEmails.map((item) => (
            <div
              key={item.id}
              style={{
                padding: "15px",
                marginTop: "10px",
                borderRadius: "12px",
                background:
                  "rgba(255,255,255,.05)"
              }}
            >
              <h4>{item.message}</h4>
              <div>{item.time}</div>
              <div>
                {item.severity.toUpperCase()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}