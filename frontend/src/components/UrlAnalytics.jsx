
import React, { useState } from "react";

export default function UrlAnalytics({
  searchHistory = []
}) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const urlHistory = searchHistory.filter(
    item => item.type === "url"
  );

  const safeUrls = urlHistory.filter(
    item => item.severity === "low"
  );

  const mediumUrls = urlHistory.filter(
    item => item.severity === "medium"
  );

  const highUrls = urlHistory.filter(
    item => item.severity === "high"
  );

  const criticalUrls = urlHistory.filter(
    item => item.severity === "critical"
  );

  const displayedUrls =
    selectedCategory === "safe"
      ? safeUrls
      : selectedCategory === "medium"
      ? mediumUrls
      : selectedCategory === "high"
      ? highUrls
      : selectedCategory === "critical"
      ? criticalUrls
      : urlHistory;

  return (
    <div style={{ padding: "25px" }}>
      <h1
        style={{
          color: "#00ffd5",
          marginBottom: "25px"
        }}
      >
        🌐 URL Scan Analytics
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
          <h2>{safeUrls.length}</h2>
          <p>Safe URLs</p>
        </div>

        <div className="monitor-card">
          <h2>{mediumUrls.length}</h2>
          <p>Medium Risk</p>
        </div>

        <div className="monitor-card">
          <h2>{highUrls.length}</h2>
          <p>High Risk</p>
        </div>

        <div className="monitor-card">
          <h2>{criticalUrls.length}</h2>
          <p>Critical URLs</p>
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
        <option value="all">All URLs</option>
        <option value="safe">Safe URLs</option>
        <option value="medium">Medium Risk</option>
        <option value="high">High Risk</option>
        <option value="critical">Critical URLs</option>
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
          URL Scan History
        </h3>

        {displayedUrls.length === 0 ? (
          <p>No URLs found.</p>
        ) : (
          displayedUrls.map((item) => (
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