import React from "react";

export default function SystemMonitoring({
  totalScans,
  threatCount,
  successRate,
  lastScanTime,
  region
}) {
  const cardStyle = {
    background: "rgba(15,23,42,0.85)",
    border: "1px solid rgba(0,255,213,0.25)",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 0 20px rgba(0,255,213,0.15)",
    backdropFilter: "blur(12px)",
    transition: "all 0.3s ease"
  };

  const titleStyle = {
    fontSize: "15px",
    fontWeight: "600",
    marginBottom: "12px"
  };

  const valueStyle = {
    fontSize: "28px",
    fontWeight: "700",
    color: "#ffffff"
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1
        style={{
          color: "#00ffd5",
          marginBottom: "25px",
          fontSize: "32px"
        }}
      >
        🖥️ System Monitoring
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
          gap: "20px"
        }}
      >
        <div style={cardStyle}>
          <div style={{ ...titleStyle, color: "#22c55e" }}>
            🟢 Live Monitoring Active
          </div>
          <div style={valueStyle}>
            AI Security Engine Running
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ ...titleStyle, color: "#00ffd5" }}>
            ⚡ Scans Per Minute
          </div>
          <div style={valueStyle}>
            {totalScans}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ ...titleStyle, color: "#ff4d6d" }}>
            🚨 Threats Detected Today
          </div>
          <div style={valueStyle}>
            {threatCount}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ ...titleStyle, color: "#22c55e" }}>
            📊 Success Rate
          </div>
          <div style={valueStyle}>
            {successRate}%
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ ...titleStyle, color: "#facc15" }}>
            🕒 Last Scan Time
          </div>
          <div style={valueStyle}>
            {lastScanTime}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ ...titleStyle, color: "#8b5cf6" }}>
            🌍 Region of Origin
          </div>
          <div style={valueStyle}>
            {region}
          </div>
        </div>
      </div>
    </div>
  );
}