import React, { useState, useEffect } from 'react';
import { apiUrl } from '../config';

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState('');
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key') || '';
    setApiKey(savedKey);
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('gemini_api_key', apiKey.trim());
    setTestStatus('API key saved locally to browser storage.');
  };

  const handleClear = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setTestStatus('API key removed from local browser storage.');
  };

  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      setTestStatus('Please enter an API key to test.');
      return;
    }

    setTestLoading(true);
    setTestStatus('Testing API Key with Gemini Model...');

    try {
      const res = await fetch(apiUrl('/api/analyze/email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'Hello, this is a test email analysis. Safe message.',
          apiKey: apiKey.trim()
        })
      });

      if (!res.ok) {
        throw new Error('Verification request failed');
      }

      const data = await res.json();
      if (data && data.threatLevel) {
        setTestStatus('✅ Connection Success! Gemini responded successfully.');
      } else {
        setTestStatus('❌ Unexpected response structure. Verify your API Key permissions.');
      }
    } catch (err) {
      console.error(err);
      setTestStatus('❌ Connection Failed! Verify API key validity and backend connectivity.');
    } finally {
      setTestLoading(false);
    }
  };

  return (
  <div
    className="tab-pane"
    style={{
      maxWidth: "1400px",
      margin: "0 auto",
      padding: "20px"
    }}
  >
    <div
      className="glass-card"
      style={{
        background: "rgba(15,20,35,0.9)",
        border: "1px solid rgba(0,255,213,0.15)",
        borderRadius: "20px",
        padding: "35px",
        boxShadow: "0 0 30px rgba(0,255,255,0.08)"
      }}
    >
      <h2
        className="panel-section-title"
        style={{
          color: "#00ffd5",
          fontSize: "2rem",
          fontWeight: "700",
          border: "none",
          marginBottom: "0.5rem"
        }}
      >
        ⚙️ AI Engine Settings
      </h2>

      <p
        className="page-subtitle"
        style={{
          marginBottom: "2rem",
          color: "#b8c1d1",
          lineHeight: "1.8",
          fontSize: "0.95rem"
        }}
      >
        Configure AI API keys and customize analysis modes. API keys are stored locally in your browser.
      </p>

      <form onSubmit={handleSave} className="settings-grid">

        {/* INPUT BLOCK */}
        <div className="form-group" style={{ marginBottom: "1.5rem" }}>
          <label
            className="form-label"
            style={{
              color: "#00ff99",
              fontSize: "16px",
              marginBottom: "10px",
              display: "block"
            }}
          >
            🔑 Google Gemini API Key
          </label>

          <div style={{ position: "relative" }}>
            <input
              type={showKey ? "text" : "password"}
              className="form-input"
              style={{
                width: "100%",
                padding: "14px",
                paddingRight: "80px",
                background: "#0f172a",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "12px",
                color: "#fff",
                fontSize: "15px",
                outline: "none"
              }}
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />

            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                padding: "6px 10px",
                fontSize: "12px",
                borderRadius: "8px",
                border: "1px solid rgba(0,255,213,0.3)",
                background: "rgba(15,20,35,0.9)",
                color: "#00ffd5",
                cursor: "pointer"
              }}
            >
              {showKey ? "HIDE" : "SHOW"}
            </button>
          </div>

          <p
            style={{
              marginTop: "10px",
              fontSize: "0.8rem",
              color: "#94a3b8"
            }}
          >
            💡 If empty, local AI fallback model will be used.
          </p>
        </div>

        {/* BUTTONS */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            marginTop: "10px"
          }}
        >
          <button
            type="submit"
            style={{
              padding: "12px 20px",
              borderRadius: "12px",
              border: "none",
              fontWeight: "700",
              background: "linear-gradient(135deg,#00ffd5,#0099ff)",
              color: "#06111f",
              cursor: "pointer",
              boxShadow: "0 0 20px rgba(0,255,255,0.25)"
            }}
          >
            Save Settings
          </button>

          <button
            type="button"
            onClick={handleTestKey}
            disabled={testLoading || !apiKey.trim()}
            style={{
              padding: "12px 20px",
              borderRadius: "12px",
              border: "1px solid rgba(0,255,213,0.25)",
              background: "rgba(15,20,35,0.9)",
              color: "#00ffd5",
              fontWeight: "700",
              cursor: "pointer"
            }}
          >
            {testLoading ? "Verifying..." : "Test API Key"}
          </button>

          <button
            type="button"
            onClick={handleClear}
            style={{
              padding: "12px 20px",
              borderRadius: "12px",
              border: "1px solid rgba(255,0,80,0.4)",
              background: "rgba(15,20,35,0.9)",
              color: "#ff4d6d",
              fontWeight: "700",
              cursor: "pointer"
            }}
          >
            Clear Key
          </button>
        </div>
      </form>

      {/* STATUS PANEL */}
      {testStatus && (
        <div
          style={{
            marginTop: "25px",
            padding: "15px",
            borderRadius: "14px",
            border: "1px solid rgba(0,255,213,0.15)",
            background: "rgba(15,20,35,0.8)",
            color: "#b8c1d1",
            fontSize: "0.9rem",
            boxShadow: "0 0 15px rgba(0,255,255,0.05)"
          }}
        >
          {testStatus}
        </div>
      )}
    </div>
  </div>
);
}
