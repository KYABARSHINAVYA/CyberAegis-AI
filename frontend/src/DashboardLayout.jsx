import React, { useState, useEffect } from "react";
import { Send } from "lucide-react";
import { apiUrl } from "./config";

import Dashboard from "./components/Dashboard";
import EmailScanner from "./components/EmailScanner";
import UrlScanner from "./components/UrlScanner";
import MediaScanner from "./components/MediaScanner";
import Settings from "./components/Settings";
import QrCodeScanner from "./components/QrCodeScanner";
import SystemMonitoring from "./components/SystemMonitoring";
import EmailAnalytics from "./components/EmailAnalytics";
import UrlAnalytics from "./components/UrlAnalytics";
import MediaAnalytics from "./components/MediaAnalytics";
import QrAnalytics from "./components/QrAnalytics";
import IncidentResponse from "./components/IncidentResponse";
import SandboxAnalysis from "./components/SandboxAnalysis";
import ThreatMap from "./components/ThreatMap";
import TelegramAlerts from "./components/TelegramAlerts";
import ThreatCopilot from "./pages/ThreatCopilot";
import robotBlueIcon from "./assets/robo.png";

export default function DashboardLayout({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isCompact, setIsCompact] = useState(() => window.innerWidth <= 900);

  const [searchHistory, setSearchHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("search_history")) || [];
    } catch (error) {
      console.warn("Clearing invalid search_history from localStorage", error);
      localStorage.removeItem("search_history");
      return [];
    }
  });

  const [showProfile, setShowProfile] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);
  const [region, setRegion] = useState("India - AP");
  const [criticalAlerts, setCriticalAlerts] = useState([]);

  useEffect(() => {
    const handleResize = () => setIsCompact(window.innerWidth <= 900);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ SEARCH PANEL STATES
  const [selectedScanType, setSelectedScanType] = useState("email");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  
  

const totalScans = searchHistory.length;

const threatCount = searchHistory.filter(
  item =>
    item.status === "threat" ||
    item.severity === "critical"
).length;

const safeCount = searchHistory.filter(
  item => item.status === "safe"
).length;

const successRate =
  totalScans > 0
    ? ((safeCount / totalScans) * 100).toFixed(1)
    : 100;

const lastScanTime =
  totalScans > 0
    ? searchHistory[0].time
    : "No scans yet";

  const navItems = [
    ["dashboard", "Dashboard"],
    ["email", "Email Scanner"],
    ["url", "URL Scanner"],
    ["media", "Media Scanner"],
    ["qr", "QR Scanner"],
    ["sandbox", "Sandbox"],
    ["incidents", "Incident Response"],
    ["settings", "Settings"],
  ];

  // ✅ LOGOUT
  const handleSignOut = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    if (onLogout) onLogout();
  };

  // ✅ ADD HISTORY (REAL-TIME READY)
  const addToHistory = async (
    message,
    type = "info",
    status = "safe",
    severity = "low"
  ) => {
    const entry = {
      id: Date.now(),
      message,
      type,
      status,
      severity,
      time: new Date().toLocaleString(),
    };

    const updated = [entry, ...searchHistory.slice(0, 49)];

    setSearchHistory(updated);
    localStorage.setItem("search_history", JSON.stringify(updated));

    try {
      const chatId = localStorage.getItem("telegram_alert_chat_id") || undefined;
      await fetch(apiUrl("/api/alerts/telegram"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: chatId,
          incident: entry,
          message: `CyberAegis Alert: ${entry.message}\nSeverity: ${entry.severity}\nType: ${entry.type}\nTime: ${entry.time}`
        })
      });
    } catch (alertError) {
      console.warn("Telegram auto-alert failed:", alertError);
    }
  };
  // ✅ STATS FUNCTION (ONLY ONE - FIXED)
  const getScanStats = (type) => {
    const filtered = searchHistory.filter((item) => item.type === type);

    return {
      total: filtered.length,
      safe: filtered.filter((i) => i.status === "safe").length,
      threat: filtered.filter((i) => i.status === "threat").length,
      critical: filtered.filter((i) => i.severity === "critical").length,
      medium: filtered.filter((i) => i.severity === "medium").length,
    };
  };

  // ✅ NAV BUTTON STYLE
  const menuBtnStyle = (tab) => ({
    padding: "10px 14px",
    minWidth: "160px",
    borderRadius: "14px",
    border: "1px solid rgba(0,255,213,0.12)",
    background:
      activeTab === tab
        ? "linear-gradient(135deg,#00ffd5,#0099ff)"
        : "rgba(12,18,34,0.72)",
    color: activeTab === tab ? "#06111f" : "#c8f7ff",
    fontWeight: "600",
    cursor: "pointer",
    transition: "transform 0.2s ease, background 0.2s ease",
  });

  const actionBtnStyle = {
    minHeight: "38px",
    padding: "10px 14px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg,#00ffd5,#0099ff)",
    color: "#06111f",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "transform 0.2s ease",
  };

  const cardStyle = {
    padding: "14px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(0,255,213,0.12)",
    color: "#cbd5e1",
    fontSize: "13px",
    textAlign: "center",
  };

 return (
  <div
    style={{
      minHeight: "100vh",
      overflowX: "hidden",
      background: "radial-gradient(circle at top, #0f172a, #050814)",
      color: "white",
    }}
  >
      

      {/* 🔥 ACTIVITY PANEL */}
      

      {/* SIDEBAR */}
<div
  style={{
    position: isCompact ? "sticky" : "fixed",
    left: 0,
    top: 0,
    width: isCompact ? "100%" : "260px",
    height: isCompact ? "auto" : "100vh",
    padding: isCompact ? "14px" : "22px",
    paddingBottom: isCompact ? "14px" : "80px",
    display: "flex",
    flexDirection: isCompact ? "row" : "column",
    gap: "12px",
    overflowX: isCompact ? "auto" : "hidden",
    overflowY: isCompact ? "hidden" : "auto",
    borderRight: "1px solid rgba(0,255,213,0.15)",
    background: "rgba(15,20,35,0.95)",
    backdropFilter: "blur(12px)",
    zIndex: 1000
  }}
>
        <h2 style={{ color: "#00ffd5", flex: "0 0 auto", whiteSpace: "nowrap" }}>CyberAegis AI</h2>

        {navItems.map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ ...menuBtnStyle(tab), flex: "0 0 auto", whiteSpace: "nowrap" }}
          >
            {label}
          </button>
        ))}

        {/* PROFILE */}
        <div style={{ marginTop: isCompact ? 0 : "70px", flex: "0 0 auto" }}>
          <div
            onClick={() => setShowProfile(!showProfile)}
            style={{
              padding: "14px",
              borderRadius: "14px",
              background: "rgba(0,255,213,0.05)",
              border: "1px solid rgba(0,255,213,0.15)",
              cursor: "pointer",
              display: "flex",
              gap: "12px",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: "linear-gradient(135deg,#00ffd5,#0099ff)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#06111f",
                fontWeight: "bold",
              }}
            >
              {user?.name?.charAt(0) || "U"}
            </div>

            <div>
              <div style={{ color: "#00ffd5" }}>{user?.name}</div>
              <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                Security Analyst
              </div>
            </div>
          </div>

          {showProfile && (
            <div style={{ marginTop: "10px", padding: "12px", background: "#0f172a", borderRadius: "12px" }}>
              <p style={{ fontSize: "12px", color: "#94a3b8" }}>
                Email: {user?.email}
              </p>

              <button
                onClick={handleSignOut}
                style={{
                  width: "100%",
                  marginTop: "10px",
                  padding: "10px",
                  borderRadius: "8px",
                  background: "rgba(255,0,80,0.1)",
                  border: "1px solid rgba(255,80,80,0.4)",
                  color: "#ff4d6d",
                }}
              >
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MAIN PANEL */}
      {/* MAIN PANEL */}
<div
  style={{
    marginLeft: isCompact ? 0 : "260px",
    width: isCompact ? "100%" : "calc(100% - 260px)",
    minWidth: 0,
    padding: isCompact ? "18px" : "30px",
    minHeight: "100vh",
    overflowX: "hidden",
    boxSizing: "border-box"
  }}
>
  <div style={{ maxWidth: isCompact ? "100%" : "1200px", margin: isCompact ? 0 : "0 auto", width: "100%" }}>
  {/* TOP BAR */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "15px",
      marginBottom: "25px",
      width: "100%"
    }}
  ></div>

        {/* SEARCH BAR */}
        {/* SEARCH BAR */}
{/* TOP TOOLBAR */}
{/* TOP TOOLBAR */}
<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "25px",
    width: "100%",
    flexWrap: "wrap"
  }}
>

  {/* SEARCH BAR */}
  <div
    style={{
      position: "relative",
      flex: "1 1 280px",
      minWidth: 0
    }}
  >
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      onFocus={() => setShowSearchDropdown(true)}
      placeholder={`Search ${selectedScanType} scans...`}
      style={{
        width: "100%",
        padding: "14px 18px",
        borderRadius: "14px",
        background: "#0f172a",
        color: "white",
        border: "1px solid rgba(0,255,213,.2)",
        fontSize: "15px"
      }}
    />

    {showSearchDropdown && (
  <div
    style={{
      position: "absolute",
      top: "60px",
      left: 0,
      width: "100%",
      background: "#111827",
      borderRadius: "14px",
      border: "1px solid rgba(0,255,213,.2)",
      zIndex: 9999,
      boxShadow: "0 0 20px rgba(0,255,213,.2)"
    }}
  >

    {/* Email Analytics */}
    <div
      style={{
        padding: "12px",
        cursor: "pointer",
        color: "#cbd5e1"
      }}
      onClick={() => {
        setSelectedScanType("email");
        setActiveTab("emailAnalytics");
        setShowSearchDropdown(false);
      }}
    >
      ✉️ Email Analytics
    </div>

    {/* URL Analytics */}
    <div
      style={{
        padding: "12px",
        cursor: "pointer",
        color: "#cbd5e1"
      }}
      onClick={() => {
        setSelectedScanType("url");
        setActiveTab("urlAnalytics");
        setShowSearchDropdown(false);
      }}
    >
      🌐 URL Analytics
    </div>

    {/* Media Analytics */}
    <div
      style={{
        padding: "12px",
        cursor: "pointer",
        color: "#cbd5e1"
      }}
      onClick={() => {
        setSelectedScanType("media");
        setActiveTab("mediaAnalytics");
        setShowSearchDropdown(false);
      }}
    >
      🎥 Media Analytics
    </div>

    {/* QR Analytics */}
    <div
      style={{
        padding: "12px",
        cursor: "pointer",
        color: "#cbd5e1"
      }}
      onClick={() => {
        setSelectedScanType("qr");
        setActiveTab("qrAnalytics");
        setShowSearchDropdown(false);
      }}
    >
      📷 QR Analytics
    </div>

  </div>
)}
</div>

  {/* SYSTEM MONITORING */}
  <button
    onClick={() => setActiveTab("monitoring")}
    style={{
            ...actionBtnStyle,
            background: "linear-gradient(135deg,#8b5cf6,#3b82f6)",
          }}
        >
          🖥️ System Monitoring
        </button>

        <button
          onClick={() => setActiveTab("threatMap")}
          style={{
            ...actionBtnStyle,
            background: "linear-gradient(135deg,#00ffd5,#0099ff)",
          }}
        >
          Live Threat Map
        </button>

        {/* LIVE ACTIVITY */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowActivity(!showActivity)}
            style={{
              ...actionBtnStyle,
              background: showActivity
                ? "linear-gradient(135deg,#00ffd5,#0099ff)"
                : "linear-gradient(135deg,#4ade80,#10b981)",
            }}
          >
            🔔 Live Activity
          </button>

          {showActivity && (
            <div
              style={{
                position: "absolute",
                top: "60px",
                right: 0,
                width: "320px",
                maxHeight: "400px",
                overflowY: "auto",
                background: "rgba(15,20,35,0.98)",
                border: "1px solid rgba(0,255,213,0.2)",
                borderRadius: "16px",
                padding: "15px",
                zIndex: 9999,
                boxShadow: "0 0 20px rgba(0,255,213,.2)"
              }}
            >
              <h4 style={{ color: "#00ffd5", margin: 0, marginBottom: "10px" }}>
                Live Scan Activity
              </h4>

              {searchHistory.length === 0 ? (
                <p style={{ color: "#94a3b8", margin: 0 }}>
                  No activity yet
                </p>
              ) : (
                searchHistory.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: "10px",
                      marginBottom: "8px",
                      borderLeft: "3px solid #00ffd5",
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: "8px"
                    }}
                  >
                    <div style={{ fontSize: "12px", color: "#cbd5e1" }}>
                      {item.message}
                    </div>

                    <div style={{ fontSize: "10px", color: "#94a3b8" }}>
                      ⏱ {item.time}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

        {/* STATS */}
        

{/* ===== CRITICAL ALERTS TICKER ===== */}
<div
  style={{
    overflow: "hidden",
    whiteSpace: "nowrap",
    background: "rgba(255,0,90,0.08)",
    border: "1px solid rgba(255,0,90,0.25)",
    padding: "14px",
    borderRadius: "15px",
    marginBottom: "25px",
  }}
>
  <div
    style={{
      display: "inline-block",
      animation: "ticker 18s linear infinite",
      color: "#ff4d6d",
      fontWeight: "600",
    }}
  >
    🔥 Recent Critical Alerts • Phishing URL blocked • Deepfake media detected • Suspicious QR code scanned • Email spoofing attempt prevented • Malware attachment quarantined • AI engine operating normally
  </div>
</div>

<style>
{`
@keyframes ticker {
  0%{
    transform:translateX(100%);
  }
  100%{
    transform:translateX(-100%);
  }
}
`}
</style>


{/* STATS */}

        {/* ROUTES */}
        {activeTab === "dashboard" && (
  <Dashboard setActiveTab={setActiveTab} />
)}

{activeTab === "monitoring" && (
  <SystemMonitoring
    totalScans={totalScans}
    threatCount={threatCount}
    successRate={successRate}
    lastScanTime={lastScanTime}
    region={region}
  />
)}
        {activeTab === "email" && (
  <EmailScanner
    addToHistory={addToHistory}
    searchHistory={searchHistory}
  />
)}
        {activeTab === "url" && <UrlScanner addToHistory={addToHistory} />}
        {activeTab === "media" && <MediaScanner addToHistory={addToHistory} />}
        {activeTab === "qr" && <QrCodeScanner addToHistory={addToHistory} />}
        {activeTab === "threatMap" && <ThreatMap />}
        {activeTab === "sandbox" && <SandboxAnalysis addToHistory={addToHistory} />}
        {activeTab === "telegram" && <TelegramAlerts searchHistory={searchHistory} />}
        {activeTab === "incidents" && <IncidentResponse searchHistory={searchHistory} />}
        {activeTab === "settings" && <Settings />}
        {activeTab === "emailAnalytics" && (
  <EmailAnalytics searchHistory={searchHistory} />
)}

{activeTab === "urlAnalytics" && (
  <UrlAnalytics searchHistory={searchHistory} />
)}

{activeTab === "mediaAnalytics" && (
  <MediaAnalytics searchHistory={searchHistory} />
)}

{activeTab === "qrAnalytics" && (
  <QrAnalytics searchHistory={searchHistory} />
)}

      </div>
    </div>
    <button
      onClick={() => setActiveTab("telegram")}
      title="Telegram Alerts"
      aria-label="Telegram Alerts"
      style={{
        position: "fixed",
        bottom: isCompact ? "96px" : "112px",
        right: isCompact ? "20px" : "39px",
        width: "52px",
        height: "52px",
        padding: 0,
        borderRadius: "50%",
        border: "1px solid rgba(34,197,94,0.45)",
        background: activeTab === "telegram"
          ? "linear-gradient(135deg,#22c55e,#00ffd5)"
          : "rgba(18,25,40,0.94)",
        color: activeTab === "telegram" ? "#06111f" : "#7cf7a8",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 0 18px rgba(34,197,94,.35)",
        zIndex: 9999
      }}
    >
      <Send size={23} strokeWidth={2.4} />
    </button>
    {/* 🤖 Floating AI Button */}
<div
  onClick={() => setShowCopilot(!showCopilot)}
  style={{
    position: "fixed",
    bottom: "30px",
    right: isCompact ? "20px" : "30px",
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "transparent",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    boxShadow: "none",
    zIndex: 9999,
    overflow: "hidden"
  }}
>
  <img src={robotBlueIcon} alt="AI robot" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 0, background: "transparent" }} />
</div>
{/* AI Threat Copilot Drawer */}
    {showCopilot && (
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: isCompact ? "100%" : "400px",
          height: "100vh",
          background: "rgba(15,20,35,.98)",
          borderLeft: "1px solid rgba(0,255,213,.2)",
          backdropFilter: "blur(15px)",
          zIndex: 9998,
          overflowY: "auto",
          padding: "20px"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px"
          }}
        >
          <h2 style={{ color: "#00ffd5", margin: 0, fontSize: "20px" }}>
            AI Threat Copilot
          </h2>

          <button
            onClick={() => setShowCopilot(false)}
            style={{
              border: "none",
              background: "transparent",
              color: "#ff4d6d",
              fontSize: "24px",
              cursor: "pointer",
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        <ThreatCopilot />
      </div>
    )}
  </div>
  );
}
