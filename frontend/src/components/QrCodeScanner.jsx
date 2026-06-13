import React, { useRef, useState } from "react";
import jsQR from "jsqr";
import { apiUrl } from "../config";

export default function QrScanner({
  addToHistory
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);

  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(false);

  const [status, setStatus] = useState("");
  const [qrData, setQrData] = useState("");
  const [report, setReport] = useState(null);
  const [completedMitigations, setCompletedMitigations] = useState({});
  const attemptsRef = React.useRef(0);
  const scanTimeout = 600; // ~10s at 60fps
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [qrHistory, setQrHistory] = useState(() => {
    try {
      const raw = localStorage.getItem('qrHistory');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  const startCamera = async () => {
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("Camera capture is not supported in this browser.");
      return;
    }

    setQrData("");
    setReport(null);
    setCompletedMitigations({});

    const constraints = selectedDeviceId
      ? { video: { deviceId: { exact: selectedDeviceId } } }
      : { video: { facingMode: "environment" } };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    videoRef.current.srcObject = stream;

    await videoRef.current.play();

    setStreaming(true);
    setStatus("Scanning QR Code...");

    // small delay to ensure video is ready
    setTimeout(() => {
      scanQRCode();
    }, 300);

  } catch (err) {
    console.error(err);
    setStatus("Camera access denied");
  }
};

  const stopCamera = () => {
  cancelAnimationFrame(animationRef.current);

  const stream = videoRef.current?.srcObject;

  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  if (videoRef.current) {
    videoRef.current.srcObject = null;
  }

  setStreaming(false);
};

  const animationRef = React.useRef(null);

const scanQRCode = () => {
  const canvas = canvasRef.current;
  const ctx = canvas.getContext("2d");

  const scan = () => {
    const video = videoRef.current;

    // stop loop if camera is off
    if (!video || !video.srcObject) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );

      const code = jsQR(
        imageData.data,
        imageData.width,
        imageData.height
      );

      if (code) {
        setStatus("QR Detected");
        setQrData(code.data);

        // stop scanning loop
        cancelAnimationFrame(animationRef.current);

        // stop camera automatically
        stopCamera();

        // analyze QR
        analyzeQR(code.data);

        return;
      }
    }

    animationRef.current = requestAnimationFrame(scan);
  };

  scan();
};
const analyzeQR = async (content) => {
  setLoading(true);
  const nextHistory = [
    { data: content, ts: Date.now() },
    ...qrHistory.filter((item) => item.data !== content)
  ].slice(0, 10);
  setQrHistory(nextHistory);
  localStorage.setItem("qrHistory", JSON.stringify(nextHistory));

  try {
    // Non-URL QR
    if (
      !content.startsWith("http://") &&
      !content.startsWith("https://")
    ) {
      const safeReport = {
        threatScore: 0,
        threatLevel: "SAFE",
        classification: "Text QR",
        summary: "QR contains text data."
      };

      setReport(safeReport);

      addToHistory?.(
        "SAFE QR Detected",
        "qr",
        "safe",
        "safe"
      );

      setLoading(false);
      return;
    }

    // URL QR
    const res = await fetch(
      apiUrl("/api/analyze/url"),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: content
        })
      }
    );

    if (!res.ok) {
      throw new Error("QR URL analysis failed");
    }

    const data = await res.json();

    setReport(data);

    // Store EXACT result in history
    addToHistory?.(
      `${data.threatLevel} QR Detected`,
      "qr",
      data.threatLevel === "SAFE"
        ? "safe"
        : "threat",
      data.threatLevel.toLowerCase()
    );

  } catch (err) {
    console.error(err);
    setStatus("Unable to analyze QR content. Check backend connectivity.");
  } finally {
    setLoading(false);
  }
};

  // Camera will start when user clicks the Start button.
  // Ensure camera is stopped when the component unmounts.
  React.useEffect(() => {
  return () => {
    try {
      stopCamera();
    } catch (e) {}
  };
}, []);

  // enumerate cameras on mount (labels may be empty until permission granted)
  React.useEffect(() => {
    (async () => {
      try {
        const list = await navigator.mediaDevices.enumerateDevices();
        const cams = list.filter(d => d.kind === 'videoinput');
        setDevices(cams);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const getThreatClass = (level) => {
    switch ((level || "").toUpperCase()) {
      case "SAFE":
        return "safe";
      case "LOW":
        return "warning";
      case "MEDIUM":
        return "warning";
      case "HIGH":
        return "high";
      case "CRITICAL":
        return "critical";
      default:
        return "warning";
    }
  };

  const toggleMitigation = (index) => {
    setCompletedMitigations((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="tab-pane">
      <div
        className="glass-card"
        style={{ padding: "25px" }}
      >
        <h2 style={{ color: "#00ffd5" }}>
          📷 QR Scanner
        </h2>

        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', justifyContent: 'center' }}>
            <select
  className="cyber-select"
  value={selectedDeviceId || ""}
  onChange={(e) =>
    setSelectedDeviceId(e.target.value || null)
  }
  onClick={async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      const cams = list.filter(
        (d) => d.kind === "videoinput"
      );
      setDevices(cams);
    } catch (e) {
      console.error(e);
    }
  }}
>
  <option value="">📷 Default Camera</option>

  {devices.map((d, index) => (
    <option key={d.deviceId} value={d.deviceId}>
      Camera {index + 1}
    </option>
  ))}
</select>
          </div>

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              maxWidth: "420px",
              borderRadius: "12px",
              display: 'block'
            }}
          />

          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />

          <canvas
            ref={overlayRef}
            style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', width: '100%', height: '100%', borderRadius: '12px' }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            marginTop: "20px"
          }}
        >
          {!streaming ? (
            <button className="cyber-btn" onClick={startCamera}>
  📷 Start Scanner
</button>
          ) : (
            <button className="scan-btn" disabled>
  🔍 Scanning...
</button>
          )}
        </div>

        {loading && (
          <p style={{ color: "#00ffd5" }}>
            Analyzing QR...
          </p>
        )}

        {status && <p>{status}</p>}

        {qrData && (
          <div style={{ marginTop: "20px" }}>
            <h4>QR Content</h4>
            <p>{qrData}</p>
          </div>
        )}

        {qrHistory && qrHistory.length > 0 && (
          <div style={{ marginTop: '18px' }}>
            <h4>Recent Scans</h4>
            <div style={{ maxHeight: '160px', overflow: 'auto' }}>
              {qrHistory.map((h, idx) => (
                <div key={idx} style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }} onClick={() => { setQrData(h.data); analyzeQR(h.data); }}>
                  <div style={{ fontSize: '0.9rem' }}>{h.data}</div>
                  <div style={{ fontSize: '0.75rem', color: '#9aa' }}>{new Date(h.ts).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {report && (
          <div className="results-container">
            <div
              className="glass-card score-panel"
              style={{
                background: "#101827",
                borderRadius: "20px",
                padding: "30px",
                boxShadow: "0 0 25px rgba(0,255,255,.1)"
              }}
            >
              <h3 className="panel-section-title" style={{ border: 'none', marginBottom: '1rem' }}>
                Threat Assessment
              </h3>

              <div className="gauge-wrapper">
                <svg width="180" height="180" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#1b1b1b" strokeWidth="10" />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke={
                      report.threatScore > 70
                        ? "#ff4444"
                        : report.threatScore > 40
                        ? "#ffaa00"
                        : "#00ff99"
                    }
                    strokeWidth="10"
                    strokeDasharray="314"
                    strokeDashoffset={314 - (314 * Number(report.threatScore || 0)) / 100}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  />

                  <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#ffffff" fontSize="22" fontWeight="bold">
                    {report.threatScore || 0}%
                  </text>
                </svg>
              </div>

              <span className={`threat-badge ${getThreatClass(report.threatLevel)}`}>
                {report.threatLevel} RISK
              </span>

              <div style={{ marginTop: '1.25rem' }}>
                <span className="form-label" style={{ marginBottom: 0 }}>CLASSIFICATION</span>
                <p style={{ fontFamily: 'var(--font-cyber)', fontSize: '1.1rem', color: 'var(--primary)', marginTop: '0.25rem' }}>
                  {report.classification}
                </p>
              </div>
            </div>

            <div className="details-panel">
              <div className="glass-card">
                <h3 className="panel-section-title">📝 Analysis Summary</h3>
                <p style={{ lineHeight: '1.6', fontSize: '0.95rem' }}>{report.summary}</p>
              </div>

              {report.findings && report.findings.length > 0 && (
                <div className="glass-card">
                  <h3 className="panel-section-title">📊 Key Security Findings</h3>
                  <div>
                    {report.findings.map((finding, idx) => (
                      <div key={idx} className="detail-item">
                        <div className="detail-body">
                          <div className="detail-title">{finding.category}</div>
                          <div className="detail-desc">{finding.description}</div>
                        </div>
                        <span className={`severity-pill ${finding.severity}`}>{finding.severity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {report.mitigationPlan && report.mitigationPlan.length > 0 && (
                <div className="glass-card">
                  <h3 className="panel-section-title">🛡️ Recommended Mitigation Checklist</h3>
                  <p className="page-subtitle" style={{ marginBottom: '1rem' }}>
                    Safety checklist. Complete these actions before processing the URL.
                  </p>
                  <div>
                    {report.mitigationPlan.map((step, idx) => (
                      <div key={idx} className="checklist-item">
                        <div
                          className={`checklist-checkbox ${completedMitigations[idx] ? 'checked' : ''}`}
                          onClick={() => toggleMitigation(idx)}
                        ></div>
                        <span className={`checklist-text ${completedMitigations[idx] ? 'checked' : ''}`}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
