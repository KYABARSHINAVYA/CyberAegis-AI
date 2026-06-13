import React, { useEffect, useMemo, useState } from "react";
import { apiUrl } from "../config";

const fallbackPoints = [
  { country: "India", code: "IN", lat: 20.59, lng: 78.96, detections: 38, maliciousUrls: 14, level: "CRITICAL" },
  { country: "United States", code: "US", lat: 37.09, lng: -95.71, detections: 31, maliciousUrls: 11, level: "HIGH" },
  { country: "United Kingdom", code: "GB", lat: 55.37, lng: -3.43, detections: 19, maliciousUrls: 7, level: "HIGH" },
  { country: "Brazil", code: "BR", lat: -14.23, lng: -51.92, detections: 16, maliciousUrls: 5, level: "MEDIUM" },
  { country: "Singapore", code: "SG", lat: 1.35, lng: 103.82, detections: 11, maliciousUrls: 4, level: "MEDIUM" },
  { country: "Australia", code: "AU", lat: -25.27, lng: 133.78, detections: 8, maliciousUrls: 2, level: "LOW" }
];

export default function ThreatMap() {
  const [feed, setFeed] = useState({ points: fallbackPoints, totals: null, generatedAt: null });
  const [selectedCode, setSelectedCode] = useState("IN");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadMap = async () => {
      setLoading(true);
      try {
        const res = await fetch(apiUrl("/api/threat-map"));
        if (!res.ok) throw new Error("Threat map unavailable");
        const data = await res.json();
        if (mounted) setFeed(data);
      } catch (error) {
        if (mounted) {
          setFeed((current) => ({
            ...current,
            generatedAt: new Date().toISOString()
          }));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadMap();
    const interval = window.setInterval(loadMap, 7000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const points = feed.points || fallbackPoints;
  const selected = points.find((point) => point.code === selectedCode) || points[0];
  const totals = useMemo(() => {
    if (feed.totals) return feed.totals;
    return {
      countries: points.length,
      detections: points.reduce((sum, item) => sum + item.detections, 0),
      maliciousUrls: points.reduce((sum, item) => sum + item.maliciousUrls, 0),
      hotspots: points.filter((item) => ["HIGH", "CRITICAL"].includes(item.level)).length
    };
  }, [feed.totals, points]);

  return (
    <div className="tab-pane" style={{ maxWidth: "1250px", margin: "0 auto", padding: "20px" }}>
      <div style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>Global Threat Map</p>
          <h2 style={titleStyle}>Live Phishing Hotspots</h2>
          <p style={subtitleStyle}>
            Attack origin countries, malicious URL detections, and active phishing hotspots.
          </p>
        </div>
        <span style={livePillStyle}>{loading ? "Updating" : "Live feed"}</span>
      </div>

      <div style={metricGridStyle}>
        <Metric label="Attack countries" value={totals.countries} />
        <Metric label="Live detections" value={totals.detections} tone="#ff5d7a" />
        <Metric label="Malicious URLs" value={totals.maliciousUrls} tone="#ffd166" />
        <Metric label="Hotspots" value={totals.hotspots} tone="#d500f9" />
      </div>

      <div style={layoutStyle}>
        <div className="glass-card" style={mapCardStyle}>
          <svg viewBox="0 0 720 360" style={mapStyle} role="img" aria-label="Global phishing threat map">
            <rect x="0" y="0" width="720" height="360" rx="8" fill="#07101f" />
            <path d="M64 108h95l34 32-18 51H84L45 153zM215 94h105l36 36-20 79-101 17-55-45zM410 100h184l48 42-37 67H431l-56-48zM251 245h109l27 44-49 40h-88l-36-48zM499 244h78l34 30-22 50h-82l-29-38z" fill="#12243a" stroke="#2e4f75" strokeWidth="2" />
            {points.map((point) => {
              const coords = project(point.lat, point.lng);
              const radius = Math.max(8, Math.min(24, point.detections / 2));
              const active = point.code === selected.code;

              return (
                <g key={point.code} onClick={() => setSelectedCode(point.code)} style={{ cursor: "pointer" }}>
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r={radius + (active ? 8 : 0)}
                    fill={levelColor(point.level)}
                    opacity={active ? 0.28 : 0.16}
                  />
                  <circle cx={coords.x} cy={coords.y} r={radius} fill={levelColor(point.level)} stroke="#ffffff" strokeWidth="2" />
                  <text x={coords.x} y={coords.y + radius + 18} fill="#dbeafe" fontSize="14" textAnchor="middle" fontWeight="800">
                    {point.code}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="glass-card" style={detailCardStyle}>
          <p style={eyebrowStyle}>Selected Hotspot</p>
          <h3 style={{ ...titleStyle, fontSize: "26px" }}>{selected.country}</h3>
          <span style={{ ...pillStyle, color: levelColor(selected.level), borderColor: levelColor(selected.level) }}>
            {selected.level}
          </span>
          <div style={selectedStatsStyle}>
            <Metric label="Attack signals" value={selected.detections} />
            <Metric label="Bad URLs" value={selected.maliciousUrls} tone="#ffd166" />
          </div>
          <p style={subtitleStyle}>
            Last seen {selected.lastSeen ? new Date(selected.lastSeen).toLocaleTimeString() : "simulated now"}.
          </p>
        </div>
      </div>

      <div style={listStyle}>
        {points
          .slice()
          .sort((a, b) => b.detections - a.detections)
          .map((point) => (
            <button key={point.code} type="button" onClick={() => setSelectedCode(point.code)} style={rowStyle}>
              <span>{point.country}</span>
              <strong style={{ color: levelColor(point.level) }}>{point.detections} detections</strong>
            </button>
          ))}
      </div>
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

function project(lat, lng) {
  return {
    x: ((lng + 180) / 360) * 720,
    y: ((90 - lat) / 180) * 360
  };
}

function levelColor(level) {
  if (level === "CRITICAL") return "#d500f9";
  if (level === "HIGH") return "#ff1744";
  if (level === "MEDIUM") return "#ffb300";
  return "#00e676";
}

const headerStyle = { display: "flex", justifyContent: "space-between", gap: "20px", marginBottom: "20px", alignItems: "flex-start" };
const eyebrowStyle = { color: "#00ffd5", fontSize: "13px", fontWeight: 800, marginBottom: "6px" };
const titleStyle = { color: "#f8fafc", fontSize: "32px", fontWeight: 800, margin: 0 };
const subtitleStyle = { color: "#94a3b8", fontSize: "14px", lineHeight: 1.7, marginTop: "8px" };
const livePillStyle = { border: "1px solid rgba(0,255,213,0.35)", color: "#00ffd5", borderRadius: "999px", padding: "9px 13px", fontWeight: 800 };
const metricGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "14px", marginBottom: "18px" };
const metricStyle = { padding: "16px", borderRadius: "8px", border: "1px solid rgba(0,255,213,0.16)", background: "rgba(15,20,35,0.82)" };
const metricLabelStyle = { color: "#94a3b8", fontSize: "12px", textTransform: "uppercase" };
const metricValueStyle = { marginTop: "8px", fontSize: "28px", fontWeight: 800 };
const layoutStyle = { display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)", gap: "18px", alignItems: "stretch" };
const mapCardStyle = { padding: "12px", borderRadius: "8px" };
const mapStyle = { display: "block", width: "100%", minHeight: "360px" };
const detailCardStyle = { borderRadius: "8px" };
const pillStyle = { display: "inline-flex", padding: "6px 10px", border: "1px solid", borderRadius: "999px", marginTop: "12px", fontWeight: 800 };
const selectedStatsStyle = { display: "grid", gap: "12px", margin: "18px 0" };
const listStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px", marginTop: "18px" };
const rowStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: "8px", padding: "13px", background: "rgba(15,20,35,0.82)", border: "1px solid rgba(0,255,213,0.14)", color: "#f8fafc" };
