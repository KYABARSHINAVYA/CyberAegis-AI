import React, { useEffect, useRef, useState } from "react";
import { apiUrl } from "../config";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function Dashboard({ setActiveTab }) {

  const canvasRef = useRef(null);

  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState({
    defenseShield: "ACTIVE",
    totalScans: 0,
    threatsDetected: 0,
    deepfakeAlerts: 0
  });

  useEffect(() => {

  fetch(apiUrl("/api/dashboard/stats"))
    .then((res) => res.json())
    .then((data) => setStats(data))
    .catch(() => {});

}, []);
  useEffect(() => {

  fetch(apiUrl("/api/analysis/history"))
    .then((res) => res.json())
    .then((data) => {

      const formatted = data.map((item) => ({
        time: new Date(item.timestamp).toLocaleTimeString(),
        score: item.score
      }));

      setChartData(formatted);

    })
    .catch(() => {});

}, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId;
    let angle = 0;

    const resizeCanvas = () => {
      const width = canvas.parentElement?.clientWidth || 320;
      const height = 180;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();

    window.addEventListener("resize", resizeCanvas);

    const targets = [
      { x: 0.3, y: 0.4, size: 4, type: "phish" },
      { x: 0.75, y: 0.6, size: 6, type: "deepfake" },
      { x: 0.5, y: 0.25, size: 5, type: "phish" }
    ];

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const maxRadius = Math.min(cx, cy) - 10;

      ctx.strokeStyle = "rgba(0,255,204,0.08)";

      for (let r = maxRadius / 4; r <= maxRadius; r += maxRadius / 4) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      targets.forEach((t) => {
        const tx = cx + (t.x - 0.5) * 2 * maxRadius;
        const ty = cy + (t.y - 0.5) * 2 * maxRadius;

        ctx.fillStyle =
          t.type === "deepfake"
            ? "rgba(213,0,249,0.7)"
            : "rgba(255,23,68,0.7)";

        ctx.beginPath();
        ctx.arc(tx, ty, t.size, 0, Math.PI * 2);
        ctx.fill();
      });

      angle += 0.015;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <div className="tab-pane">
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1.75rem",
          overflowX: "auto",
          paddingBottom: "0.5rem"
        }}
      >
        {[
          {
            icon: "🛡️",
            title: "Defense Shield",
            value: stats.defenseShield,
            valueColor: "#00ff99",
            subtitle: "Protection modules running"
          },
          {
            icon: "⚠️",
            title: "Threats Detected",
            value: stats.threatsDetected,
            valueColor: "#ff4444",
            subtitle: "Blocked phishing attempts"
          },
          {
            icon: "📧",
            title: "Emails Scanned",
            value: stats.totalScans,
            valueColor: "#7dd3fc",
            subtitle: "+12% today"
          },
          {
            icon: "🎬",
            title: "Deepfake Alerts",
            value: stats.deepfakeAlerts,
            valueColor: "#ff9900",
            subtitle: "Media anomalies detected"
          }
        ].map((card) => (
          <div
            key={card.title}
            className="glass-card"
            style={{
              display: "grid",
              gap: "0.55rem",
              padding: "1rem 0.95rem",
              minWidth: "220px",
              minHeight: "145px",
              flex: "1 1 220px"
            }}
          >
            <div style={{ fontSize: "1.65rem" }}>{card.icon}</div>
            <h3 style={{ fontSize: "0.88rem", fontWeight: 700, margin: 0, color: "#cbd5e1" }}>
              {card.title}
            </h3>
            <h1 style={{ color: card.valueColor, fontSize: "1.9rem", margin: 0, fontWeight: 800 }}>
              {card.value}
            </h1>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.84rem", lineHeight: 1.4 }}>
              {card.subtitle}
            </p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '240px' }}>
          <h3 className="panel-section-title" style={{ border: 'none', marginBottom: '1rem', fontSize: '1rem', fontWeight: 700 }}>
            🧭 Threat Assignment
          </h3>
          <div style={{ position: 'relative', width: '170px', height: '170px', marginBottom: '1rem' }}>
            <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%' }}>
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="#ff4d6d"
                strokeWidth="12"
                strokeDasharray="326"
                strokeDashoffset={326 - (326 * Math.min(stats.threatsDetected, 100) / 100)}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 700, color: '#ff4d6d' }}>{stats.threatsDetected}</span>
              <span style={{ fontSize: '0.95rem', color: '#94a3b8' }}>Assigned threats</span>
            </div>
          </div>
          <p style={{ margin: 0, color: '#94a3b8', textAlign: 'center', fontSize: '0.92rem' }}>
            Threat assignment is now shown at the top for fast analyst handoff.
          </p>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h3 className="panel-section-title" style={{ border: 'none', marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 700 }}>
              🛰️ Real-Time Cyber Threat Map (Simulated)
            </h3>
            <p className="page-subtitle" style={{ marginBottom: '0', fontSize: '0.95rem' }}>
              Monitoring incoming file signatures and typosquatted domains globally.
            </p>
          </div>
          <div style={{ flexGrow: 1, background: '#080a13', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', padding: '0.75rem' }}>
            <canvas ref={canvasRef} className="canvas-element" style={{ height: '180px', width: '100%' }}></canvas>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 className="panel-section-title" style={{ border: 'none', marginBottom: '0', fontSize: '1rem', fontWeight: 700 }}>
            🛡️ Platform Checklist
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {[
              'Local NLP Heuristics Loaded',
              'Typosquat Brand Check Active',
              'EXIF Structural Inspectors Ready',
              'Acoustic FFT Analyzers Online',
              'Temporal Video Sync Ready'
            ].map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="status-dot"></span>
                <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#e2e8f0' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem 1.4rem' }}>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#cbd5e1' }}>
              📊 Recent Analysis Results
            </h3>
            <div className="glass-card" style={{ padding: '1.35rem', borderRadius: '16px', background: 'rgba(12,18,34,0.95)' }}>
              <h3 style={{ margin: 0, marginBottom: '1rem', fontSize: '1rem', fontWeight: 700 }}>
                📈 Real-Time Analysis Results
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid stroke="#333" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#00ff99"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="panel-section-title" style={{ border: 'none', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: 700 }}>
              🔍 Start Direct Analysis
            </h3>
            <p className="page-subtitle" style={{ marginBottom: '1.25rem', fontSize: '0.96rem' }}>
              CyberAegis AI uses modern forensic modeling to analyze phishing attempts and deepfake assets. Pick a workspace below to inspect files or links:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {[
                { label: '✉️ Email & Messages', tab: 'email' },
                { label: '🌐 Web & URL', tab: 'url' },
                { label: '🎬 Media Deepfakes', tab: 'media' },
                { label: '🧩 Incident Response', tab: 'incidents' }
              ].map((action) => (
                <button
                  key={action.tab}
                  className="btn btn-secondary"
                  onClick={() => setActiveTab(action.tab)}
                  style={{
                    minHeight: '44px',
                    padding: '0.8rem 1rem',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    borderRadius: '12px',
                    border: '1px solid rgba(0,255,213,0.18)',
                    color: '#c8f7ff',
                    background: 'rgba(12,18,34,0.9)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
