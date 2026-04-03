const demoUsers = [
  ['Nick Fury', 'nick@slooze.xyz'],
  ['Captain Marvel', 'captain.marvel@slooze.xyz'],
  ['Captain America', 'captain.america@slooze.xyz'],
  ['Thanos', 'thanos@slooze.xyz'],
  ['Thor', 'thor@slooze.xyz'],
  ['Travis', 'travis@slooze.xyz'],
];

export function LoginPanel(props) {
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
        {demoUsers.map(([label, value]) => (
          <button
            key={value}
            className="credential-chip"
            type="button"
            onClick={() => props.onEmailChange(value)}
          >
            <strong>{label}</strong>
            <span>{value}</span>
          </button>
        ))}
      </div>

      <label>
        <span>Email</span>
        <input value={props.email} onChange={(event) => props.onEmailChange(event.target.value)} />
      </label>

      <label>
        <span>Password</span>
        <input
          type="password"
          value={props.password}
          onChange={(event) => props.onPasswordChange(event.target.value)}
        />
      </label>

      {props.error ? <p className="error">{props.error}</p> : null}

      <button type="button" className="primary-button" onClick={props.onLogin} disabled={props.loading}>
        {props.loading ? 'Signing in...' : 'Login'}
      </button>
    </section>
  );
}
