import React, { useState } from 'react';
import { apiUrl } from '../config';

export default function Auth({ backendUrl = '', onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister ? { email, password, name } : { email, password };

    try {
      const res = await fetch(backendUrl ? `${backendUrl}${endpoint}` : apiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (isRegister) {
        // Toggle to login after registration success
        setIsRegister(false);
        setError('Registration successful! Please login.');
        setPassword('');
      } else {
        // Log in
        onLogin(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '1.5rem',
      background: 'var(--bg-dark)'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <svg className="brand-logo" style={{ width: '48px', height: '48px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h2 className="brand-name" style={{ textAlign: 'center', fontSize: '1.8rem', marginBottom: '0.25rem', display: 'block' }}>
          AegisShield AI
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '2rem', fontFamily: 'var(--font-cyber)' }}>
          SECURE FORENSIC NETWORK
        </p>

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            background: error.includes('success') ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 23, 68, 0.1)',
            border: `1px solid ${error.includes('success') ? 'var(--safe)' : 'var(--danger)'}`,
            color: error.includes('success') ? 'var(--safe)' : '#ff3e3e',
            borderRadius: '6px',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Analyst Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="name@aegis.ai"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Security Passcode</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Authorizing Access...' : isRegister ? 'Register Security Account' : 'Decrypt & Authenticate'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            {isRegister ? 'Already registered?' : 'Accessing for the first time?'}
          </span>{' '}
          <span
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }}
          >
            {isRegister ? 'Login here' : 'Request Registry'}
          </span>
        </div>
      </div>
    </div>
  );
}
