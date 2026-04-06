import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ErrorBanner from '../components/ErrorBanner';

const DEMO_USERS = [
  { label: 'Nick Fury', email: 'nick@slooze.xyz' },
  { label: 'Captain Marvel', email: 'captain.marvel@slooze.xyz' },
  { label: 'Captain America', email: 'captain.america@slooze.xyz' },
  { label: 'Thanos', email: 'thanos@slooze.xyz' },
  { label: 'Thor', email: 'thor@slooze.xyz' },
  { label: 'Travis', email: 'travis@slooze.xyz' },
];

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('nick@slooze.xyz');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState(null);

  async function handleLogin() {
    try {
      setError(null);
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed.');
    }
  }

  return (
    <section className="panel login-panel">
      <div>
        <p className="eyebrow">Assignment Demo</p>
        <h1>Country-aware food ordering</h1>
        <p className="muted">
          Sign in with any seeded account. Every user shares the same password:
          <code> Password123!</code>
        </p>
      </div>

      <div className="credentials">
        {DEMO_USERS.map((item) => (
          <button
            key={item.email}
            className="credential-chip"
            type="button"
            onClick={() => setEmail(item.email)}
          >
            <strong>{item.label}</strong>
            <span>{item.email}</span>
          </button>
        ))}
      </div>

      <label>
        <span>Email</span>
        <input value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>

      <label>
        <span>Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>

      <ErrorBanner message={error} />

      <button
        type="button"
        className="primary-button"
        onClick={handleLogin}
        disabled={loading}
      >
        {loading ? 'Signing in...' : 'Login'}
      </button>
    </section>
  );
}