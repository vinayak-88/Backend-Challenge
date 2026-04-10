import React, { useState } from 'react'

function Login({ onLogin, error }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    try {
      await onLogin(email, password)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Slooze Food Ordering</h1>
        <p className="login-subtitle">Sign in to your account</p>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="demo-accounts">
          <h3>Demo Accounts (Password: Password123!)</h3>
          <ul>
            <li><code>nick@slooze.xyz</code> - ADMIN</li>
            <li><code>captain.marvel@slooze.xyz</code> - MANAGER (India)</li>
            <li><code>captain.america@slooze.xyz</code> - MANAGER (America)</li>
            <li><code>thanos@slooze.xyz</code> - MEMBER (India)</li>
            <li><code>thor@slooze.xyz</code> - MEMBER (India)</li>
            <li><code>travis@slooze.xyz</code> - MEMBER (America)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Login