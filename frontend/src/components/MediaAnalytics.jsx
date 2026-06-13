import React, { useState } from "react";

export default function MediaAnalytics({
  searchHistory = []
}) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const mediaHistory = searchHistory.filter(
    item => item.type === "media"
  );

  const safeMedia = mediaHistory.filter(
    item => item.severity === "low"
  );

  const mediumMedia = mediaHistory.filter(
    item => item.severity === "medium"
  );

  const highMedia = mediaHistory.filter(
    item => item.severity === "high"
  );

  const criticalMedia = mediaHistory.filter(
    item => item.severity === "critical"
  );

  const displayedMedia =
    selectedCategory === "safe"
      ? safeMedia
      : selectedCategory === "medium"
      ? mediumMedia
      : selectedCategory === "high"
      ? highMedia
      : selectedCategory === "critical"
      ? criticalMedia
      : mediaHistory;

  return (
    <div style={{ padding: "25px" }}>
      <h1
        style={{
          color: "#00ffd5",
          marginBottom: "25px"
        }}
      >
        🎬 Media Scan Analytics
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
          <h2>{safeMedia.length}</h2>
          <p>Safe Media</p>
        </div>

        <div className="monitor-card">
          <h2>{mediumMedia.length}</h2>
          <p>Medium Risk</p>
        </div>

        <div className="monitor-card">
          <h2>{highMedia.length}</h2>
          <p>High Risk</p>
        </div>

        <div className="monitor-card">
          <h2>{criticalMedia.length}</h2>
          <p>Critical Media</p>
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
        <option value="all">All Media</option>
        <option value="safe">Safe Media</option>
        <option value="medium">Medium Risk</option>
        <option value="high">High Risk</option>
        <option value="critical">Critical Media</option>
      </select>

      <div
        style={{
          marginTop: "25px",
          background: "#0f172a",
          padding: "20px",
          borderRadius: "15px"
        }}
      >
        <h3 style={{ color: "#00ffd5" }}>
          Media Scan History
        </h3>

        {displayedMedia.length === 0 ? (
          <p>No media scans found.</p>
        ) : (
          displayedMedia.map((item) => (
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