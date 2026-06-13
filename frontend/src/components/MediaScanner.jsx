import React, { useState, useRef, useEffect } from 'react';
import { apiUrl } from '../config';

export default function MediaScanner({ addToHistory }) {
  const [mediaType, setMediaType] = useState('image');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [completedMitigations, setCompletedMitigations] = useState({});

  const fileInputRef = useRef(null);
  const chartCanvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);

  // Handle drawing charts when report updates
  useEffect(() => {
    if (!report || !chartCanvasRef.current) return;
    const canvas = chartCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear and size
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 160;

    const width = canvas.width;
    const height = canvas.height;

    if (report.mediaType === 'audio' && report.spectrumData) {
      // Draw Spectrogram / Bar chart
      const data = report.spectrumData;
      const barCount = data.length;
      const spacing = 4;
      const barWidth = (width - (spacing * (barCount - 1))) / barCount;

      ctx.fillStyle = '#080a13';
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let y = height / 4; y < height; y += height / 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw bars
      data.forEach((bar, idx) => {
        const x = idx * (barWidth + spacing);
        const barHeight = (bar.power / 100) * (height - 30);
        const y = height - 20 - barHeight;

        // Gradient color based on power
        const gradient = ctx.createLinearGradient(x, y, x, height - 20);
        if (report.threatScore > 50 && idx > 15) {
          // Flat flat synthetic flatline
          gradient.addColorStop(0, 'rgba(255, 23, 68, 0.9)');
          gradient.addColorStop(1, 'rgba(255, 23, 68, 0.2)');
        } else {
          gradient.addColorStop(0, '#00ffcc');
          gradient.addColorStop(1, 'rgba(0, 255, 204, 0.15)');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);

        // Label first, middle, last
        if (idx === 0 || idx === Math.floor(barCount / 2) || idx === barCount - 1) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.font = '9px var(--font-cyber)';
          ctx.textAlign = 'center';
          ctx.fillText(bar.frequency, x + barWidth / 2, height - 5);
        }
      });

    } else if (report.mediaType === 'video' && report.frameTimeline) {
      // Draw Timeline Line chart
      const data = report.frameTimeline;
      const count = data.length;
      const stepX = width / (count - 1 || 1);

      ctx.fillStyle = '#080a13';
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let y = height / 4; y < height; y += height / 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw line path
      ctx.beginPath();
      data.forEach((pt, idx) => {
        const x = idx * stepX;
        const y = height - 25 - (pt.alterationScore / 100) * (height - 40);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      const lineGradient = ctx.createLinearGradient(0, 0, width, 0);
      lineGradient.addColorStop(0, '#00ffcc');
      lineGradient.addColorStop(0.5, '#d500f9');
      lineGradient.addColorStop(1, '#ff1744');
      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Draw points & labels
      data.forEach((pt, idx) => {
        const x = idx * stepX;
        const y = height - 25 - (pt.alterationScore / 100) * (height - 40);

        ctx.fillStyle = pt.alterationScore > 60 ? '#ff1744' : '#00ffcc';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Node labels
        if (idx % 2 === 0) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.font = '9px var(--font-cyber)';
          ctx.textAlign = 'center';
          ctx.fillText(pt.frame, x, height - 5);

          ctx.fillStyle = '#fff';
          ctx.font = 'bold 8px var(--font-main)';
          ctx.fillText(`${pt.alterationScore}%`, x, y - 8);
        }
      });
    }

  }, [report]);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setReport(null);
    setCompletedMitigations({});

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', mediaType);

    try {
      const res = await fetch(apiUrl("/api/analyze/media"), {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error('Failed to analyze file');
      }

      const data = await res.json();
      setReport(data);
      let severity = "low";

if (data.threatLevel) {
  switch (data.threatLevel.toUpperCase()) {
    case "CRITICAL":
      severity = "critical";
      break;
    case "HIGH":
      severity = "high";
      break;
    case "MEDIUM":
      severity = "medium";
      break;
    default:
      severity = "low";
  }
}

const status = severity === "low" ? "safe" : "threat";

addToHistory?.(
  status === "safe"
    ? "Safe Media Scanned"
    : "Deepfake / Manipulated Media Detected",
  "media",
  status,
  severity
);
    } catch (err) {
      console.error(err);
      alert('Error scanning file. Ensure the size is not excessive and that the server is online.');
    } finally {
      setLoading(false);
    }
  };

  const getThreatClass = (level) => {
    switch (level?.toUpperCase()) {
      case 'SAFE': return 'safe';
      case 'LOW': return 'warning';
      case 'MEDIUM': return 'warning';
      case 'HIGH': return 'high';
      case 'CRITICAL': return 'critical';
      default: return 'warning';
    }
  };

  const getIndicatorStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case 'SAFE': return 'safe';
      case 'WARNING': return 'warning';
      case 'DANGER': return 'high';
      default: return 'warning';
    }
  };

  const toggleMitigation = (index) => {
    setCompletedMitigations(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  const startCamera = async () => {
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Camera capture is not supported in this browser.");
      return;
    }

    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    setStream(mediaStream);
    setCameraOpen(true);

    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }
  } catch (err) {
    alert("Camera access denied or not available");
  }
};
const stopCamera = () => {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
  setCameraOpen(false);
  setStream(null);
};
const captureImage = () => {
  const canvas = canvasRef.current;
  const video = videoRef.current;

  if (!cameraOpen || !video || !canvas || !video.videoWidth) {
    alert("Open the camera before capturing an image.");
    return;
  }

  const context = canvas.getContext("2d");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  canvas.toBlob((blob) => {
    const file = new File([blob], "webcam-image.jpg", {
      type: "image/jpeg",
    });

    setFile(file); // IMPORTANT: your existing state
  }, "image/jpeg");
};

const startRecording = () => {
  if (!stream) {
    alert("Open the camera before starting a recording.");
    return;
  }

  const recorder = new MediaRecorder(stream);
  const chunks = [];

  setMediaRecorder(recorder);
  setRecordedChunks([]);

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      chunks.push(e.data);
      setRecordedChunks([...chunks]);
    }
  };

  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: recorder.mimeType || "video/webm" });
    const file = new File([blob], "webcam-video.webm", {
      type: blob.type,
    });

    setFile(file);
  };

  recorder.start();
  setIsRecording(true);
};
const stopRecording = () => {
  if (!mediaRecorder) return;
  mediaRecorder.stop();
  setIsRecording(false);
};
const getButtonStyle = (type) => {
  const base = {
    padding: "14px 30px",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "700",
    border: "none",
    cursor: "pointer",
    transition: "0.3s",
  };

  if (type === "image") {
    return {
      ...base,
      background: "linear-gradient(135deg,#00ffd5,#00c8ff)",
      color: "#06111f",
    };
  }

  if (type === "audio") {
    return {
      ...base,
      background: "linear-gradient(135deg,#a855f7,#ec4899)",
      color: "white",
    };
  }

  if (type === "video") {
    return {
      ...base,
      background: "linear-gradient(135deg,#ff4d6d,#ff9f1c)",
      color: "white",
    };
  }

  return base;
};

  return (
    <div className="tab-pane">
      <div
  className="glass-card"
  style={{
    marginBottom: "2rem",
    padding: "35px",
    borderRadius: "20px",
    background: "linear-gradient(145deg,#0b1324,#111827)",
    border: "1px solid rgba(0,255,153,0.15)"
  }}
>
  <h2
    className="panel-section-title"
    style={{
      border: "none",
      marginBottom: "10px",
      color: "#00ff99",
      fontSize: "32px"
    }}
  >
    🎬 Media Deepfake Scanner
  </h2>

  <p
    className="page-subtitle"
    style={{
      marginBottom: "2rem",
      color: "#94a3b8",
      lineHeight: "1.8",
      fontSize: "15px"
    }}
  >
    Upload images, audio, or videos to inspect deepfake manipulations and media anomalies.
  </p>

  <form onSubmit={handleScan}></form>
        <h2 className="panel-section-title" style={{ border: 'none', marginBottom: '0.5rem' }}>
          🎬 Multimedia Deepfake & Tamper Forensic Analyzer
        </h2>
        <p className="page-subtitle" style={{ marginBottom: '1.5rem' }}>
          Detect voice cloning, video frame swaps, compression artifacts, and digital manipulation overlays in images, audio clips, and videos.
        </p>

        <div
  style={{
    display: "flex",
    justifyContent: "center",
    marginBottom: "1.5rem"
  }}
>
  <div
    style={{
      display: "flex",
      gap: "1rem"
    }}
  >
    <button
      type="button"
      onClick={() => { setMediaType('image'); setFile(null); setReport(null); }}
      style={{
        padding: "12px 20px",
        borderRadius: "14px",
        border: "1px solid rgba(0,255,213,0.25)",
        background: mediaType === 'image'
          ? "linear-gradient(135deg,#00ffd5,#0099ff)"
          : "rgba(15,20,35,0.9)",
        color: mediaType === 'image' ? "#06111f" : "#00ffd5",
        fontWeight: "700",
        cursor: "pointer",
        boxShadow: mediaType === 'image'
          ? "0 0 20px rgba(0,255,255,0.35)"
          : "0 0 10px rgba(0,255,255,0.08)",
        transition: "all 0.3s ease"
      }}
    >
      🖼️ Image Check
    </button>

    <button
      type="button"
      onClick={() => { setMediaType('audio'); setFile(null); setReport(null); }}
      style={{
        padding: "12px 20px",
        borderRadius: "14px",
        border: "1px solid rgba(0,255,213,0.25)",
        background: mediaType === 'audio'
          ? "linear-gradient(135deg,#00ffd5,#0099ff)"
          : "rgba(15,20,35,0.9)",
        color: mediaType === 'audio' ? "#06111f" : "#00ffd5",
        fontWeight: "700",
        cursor: "pointer",
        boxShadow: mediaType === 'audio'
          ? "0 0 20px rgba(0,255,255,0.35)"
          : "0 0 10px rgba(0,255,255,0.08)",
        transition: "all 0.3s ease"
      }}
    >
      🎵 Audio Check
    </button>

    <button
      type="button"
      onClick={() => { setMediaType('video'); setFile(null); setReport(null); }}
      style={{
        padding: "12px 20px",
        borderRadius: "14px",
        border: "1px solid rgba(0,255,213,0.25)",
        background: mediaType === 'video'
          ? "linear-gradient(135deg,#00ffd5,#0099ff)"
          : "rgba(15,20,35,0.9)",
        color: mediaType === 'video' ? "#06111f" : "#00ffd5",
        fontWeight: "700",
        cursor: "pointer",
        boxShadow: mediaType === 'video'
          ? "0 0 20px rgba(0,255,255,0.35)"
          : "0 0 10px rgba(0,255,255,0.08)",
        transition: "all 0.3s ease"
      }}
    >
      📹 Video Check
    </button>
  </div>
</div>

        <form onSubmit={handleScan}>
          {/* WEBCAM CONTROLS */}
{/* WEBCAM CONTROLS (CENTERED + STYLED) */}
<div
  style={{
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "20px",
  }}
>
  <button type="button" onClick={startCamera} className="webcam-btn">
    📷 Open Camera
  </button>

  <button type="button" onClick={stopCamera} className="webcam-btn danger" disabled={!cameraOpen}>
    ⛔ Stop Camera
  </button>

  <button type="button" onClick={captureImage} className="webcam-btn" disabled={!cameraOpen}>
    📸 Capture Image
  </button>

  {!isRecording ? (
    <button type="button" onClick={startRecording} className="webcam-btn" disabled={!cameraOpen}>
      🎥 Start Recording
    </button>
  ) : (
    <button type="button" onClick={stopRecording} className="webcam-btn danger">
      ⏹ Stop Recording
    </button>
  )}
</div>
{cameraOpen && (
  <div style={{ marginBottom: "1rem" }}>
    <video
      ref={videoRef}
      autoPlay
      style={{
        width: "100%",
        maxHeight: "300px",
        borderRadius: "12px",
        border: "1px solid rgba(0,255,255,0.3)",
      }}
    />

    <canvas ref={canvasRef} style={{ display: "none" }} />
  </div>
)}
  <div
    className="upload-dropzone"
    onDragOver={handleDragOver}
    onDrop={handleDrop}
    onClick={triggerFileSelect}
    style={{
      marginBottom: "1.5rem",
      background: "rgba(15,20,35,0.9)",
      border: "1px solid rgba(0,255,213,0.15)",
      borderRadius: "20px",
      padding: "35px",
      textAlign: "center",
      boxShadow: "0 0 25px rgba(0,255,255,0.08)",
      cursor: "pointer",
      transition: "all 0.3s ease"
    }}
  >
    <input
      type="file"
      ref={fileInputRef}
      className="file-input"
      onChange={handleFileChange}
      accept={
        mediaType === 'image'
          ? 'image/*'
          : mediaType === 'audio'
          ? 'audio/*'
          : mediaType === 'video'
          ? 'video/*'
          : '*'
      }
      style={{ display: "none" }}
    />

    <svg
      width="50"
      height="50"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#00ffd5"
      strokeWidth="1.5"
      style={{ marginBottom: "15px" }}
    >
      <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>

    {file ? (
      <div>
        <p style={{ color: "#00ffd5", fontWeight: "700", fontSize: "1rem" }}>
          📂 File Ready for Analysis
        </p>
        <p style={{ color: "#b8c1d1", fontSize: "0.9rem", marginTop: "5px" }}>
          {file.name}
        </p>
      </div>
    ) : (
      <div>
        <p style={{ fontWeight: "600", color: "#ffffff" }}>
          Drag & drop file here or click to browse
        </p>
        <p style={{ fontSize: "0.85rem", color: "#b8c1d1", marginTop: "8px" }}>
          Supports Images (JPG/PNG), Audio (MP3/WAV), Video (MP4)
        </p>
      </div>
    )}
  </div>

  {/* SCAN BUTTON CENTERED */}
  <div
    style={{
      display: "flex",
      justifyContent: "center"
    }}
  >
    <button
  type="submit"
  disabled={loading}
  style={getButtonStyle(mediaType)}
>
  {loading
    ? `Analyzing ${mediaType}...`
    : `Scan ${mediaType}`}
</button>
  </div>
</form>
      </div>

      {loading && (
        <div className="glass-card loading-overlay">
          <div className="radar-spinner"></div>
          <div className="loading-text">EXTRACTING METADATA & COMPRESSION MAPS...</div>
        </div>
      )}

      {report && (
        <div className="results-container">
          <div className="glass-card score-panel">
            <h3 className="panel-section-title" style={{ border: 'none', marginBottom: '1rem' }}>
              Deepfake Probability
            </h3>

            <div className="gauge-wrapper">
  <svg width="180" height="180" viewBox="0 0 120 120">
    {/* Background circle */}
    <circle
      cx="60"
      cy="60"
      r="50"
      fill="none"
      stroke="#1b1b1b"
      strokeWidth="10"
    />

    {/* Progress circle */}
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
      strokeDashoffset={
        314 - (314 * Number(report.threatScore || 0)) / 100
      }
      strokeLinecap="round"
      transform="rotate(-90 60 60)"
    />

    {/* Percentage text */}
    <text
      x="50%"
      y="50%"
      dominantBaseline="middle"
      textAnchor="middle"
      fill="#ffffff"
      fontSize="22"
      fontWeight="bold"
    >
      {report.threatScore || 0}%
    </text>
  </svg>
</div>

            <span className={`threat-badge ${getThreatClass(report.threatLevel)}`}>
              {report.threatLevel} RISK
            </span>

            <div style={{ marginTop: '1.5rem', width: '100%', textAlign: 'left' }}>
              <span className="form-label">FILE METADATA</span>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontFamily: 'var(--font-cyber)' }}>
                <div>NAME: <span style={{ color: '#fff' }}>{report.filename}</span></div>
                <div>SIZE: <span style={{ color: '#fff' }}>{formatSize(report.sizeBytes)}</span></div>
                <div>MIME: <span style={{ color: '#fff' }}>{report.mimeType}</span></div>
              </div>
            </div>
          </div>

          <div className="details-panel">
            <div className="glass-card">
              <h3 className="panel-section-title">📝 Forensic Assessment Summary</h3>
              <p style={{ lineHeight: '1.6', fontSize: '0.95rem' }}>{report.summary}</p>
            </div>

            {/* Render Canvas Chart for Audio/Video */}
            {(report.mediaType === 'audio' || report.mediaType === 'video') && (
              <div className="glass-card">
                <h3 className="panel-section-title">
                  {report.mediaType === 'audio' ? '🔊 Vocal Frequency Spectrum (FFT Analysis)' : '📈 Temporal Alteration Profile (Timeline Analysis)'}
                </h3>
                <p className="page-subtitle" style={{ marginBottom: '1rem' }}>
                  {report.mediaType === 'audio' 
                    ? 'Spectral flatness distributions. Shaded segments indicate robotic vocoder artifacts.'
                    : 'Frame modification likelihood over playback timeline. Spikes mark high-probability face swaps.'
                  }
                </p>
                <div style={{ background: '#080a13', borderRadius: '8px', border: '1px solid var(--border-muted)', padding: '0.5rem' }}>
                  <canvas ref={chartCanvasRef} className="canvas-element" style={{ height: '160px' }}></canvas>
                </div>
              </div>
            )}

            {report.analyses && report.analyses.length > 0 && (
              <div className="glass-card">
                <h3 className="panel-section-title">📊 Layer-by-Layer Forensic Inspections</h3>
                <div>
                  {report.analyses.map((a, idx) => (
                    <div key={idx} className="detail-item">
                      <div className="detail-body">
                        <div className="detail-title">{a.metric}</div>
                        <div className="detail-desc">{a.details}</div>
                      </div>
                      <span className={`severity-pill ${getIndicatorStatusClass(a.status)}`}>
                        {a.score}% {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.mitigationPlan && report.mitigationPlan.length > 0 && (
              <div className="glass-card">
                <h3 className="panel-section-title">🛡️ Recommended Mitigation Checklist</h3>
                <p className="page-subtitle" style={{ marginBottom: '1rem' }}>
                  Verifications recommended before treating this media file as truth.
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
  );
}
