import React, { useState } from "react";

export default function QRAnalytics({
  searchHistory = []
}) {
  const [selectedCategory,
    setSelectedCategory] =
    useState("all");

  const qrHistory =
    searchHistory.filter(
      item => item.type === "qr"
    );

  const safeQRs =
    qrHistory.filter(
      item => item.severity === "low"
    );

  const mediumQRs =
    qrHistory.filter(
      item => item.severity === "medium"
    );

  const highQRs =
    qrHistory.filter(
      item => item.severity === "high"
    );

  const criticalQRs =
    qrHistory.filter(
      item =>
        item.severity ===
        "critical"
    );

  const displayedQRs =
    selectedCategory === "safe"
      ? safeQRs
      : selectedCategory ===
        "medium"
      ? mediumQRs
      : selectedCategory ===
        "high"
      ? highQRs
      : selectedCategory ===
        "critical"
      ? criticalQRs
      : qrHistory;

  return (
    <div
      className="glass-card"
      style={{
        marginTop: "20px",
        padding: "25px",
        background: "#111827"
      }}
    >
      <h3 style={{ color: "#00ffd5" }}>
        📊 QR Analytics
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4,1fr)",
          gap: "10px",
          marginTop: "15px"
        }}
      >
        <div>
          Safe:
          {safeQRs.length}
        </div>

        <div>
          Medium:
          {mediumQRs.length}
        </div>

        <div>
          High:
          {highQRs.length}
        </div>

        <div>
          Critical:
          {criticalQRs.length}
        </div>
      </div>

      <select
        value={selectedCategory}
        onChange={(e) =>
          setSelectedCategory(
            e.target.value
          )
        }
        style={{
          marginTop: "15px",
          padding: "10px"
        }}
      >
        <option value="all">
          All
        </option>

        <option value="safe">
          Safe
        </option>

        <option value="medium">
          Medium
        </option>

        <option value="high">
          High
        </option>

        <option value="critical">
          Critical
        </option>
      </select>

      <div
        style={{
          marginTop: "20px"
        }}
      >
        {displayedQRs.length ===
        0 ? (
          <p>
            No QR scans found
          </p>
        ) : (
          displayedQRs.map(
            (item, idx) => (
              <div
                key={idx}
                style={{
                  padding: "12px",
                  marginTop: "10px",
                  borderRadius:
                    "10px",
                  background:
                    item.severity ===
                    "critical"
                      ? "rgba(255,0,80,.1)"
                      : item.severity ===
                        "high"
                      ? "rgba(255,120,0,.1)"
                      : item.severity ===
                        "medium"
                      ? "rgba(255,170,0,.1)"
                      : "rgba(0,255,100,.08)"
                }}
              >
                <div>
                  {item.message}
                </div>

                <div>
                  {item.severity?.toUpperCase()}
                </div>
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}