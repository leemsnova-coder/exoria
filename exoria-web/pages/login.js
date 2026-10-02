import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../lib/auth';
import { login } from '../lib/services';

/** Only allow redirects back to paths on this site. */
function safeNext(next) {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : '/home';
}

export default function Login() {
  const router = useRouter();
  const auth = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Enter your username and password.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await login({ username: username.trim(), password });
      await auth.refresh();
      router.push(safeNext(router.query.next));
    } catch (err) {
      setError(err.status === 401 || err.status === 403 ? 'That username and password don’t match.' : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout title="Log in">
      <div className="auth">
        <div className="logo">
          <img src="/brand/wordmark.png" alt="Exoria" />
          <h1 style={{ fontSize: 26 }}>Log in</h1>
        </div>
        <form className="panel pb" onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="login-user">Username</label>
            <input id="login-user" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={20} />
          </div>
          <div className="field">
            <label htmlFor="login-pass">Password</label>
            <input id="login-pass" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="err" role="alert">{error}</div>
          <button className="btn" style={{ width: '100%' }} disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
          <p className="small muted" style={{ textAlign: 'center', marginBottom: 0 }}>
            <Link href="/forgot-password">Forgot your password?</Link> · New here? <Link href="/signup">Create an account</Link>
          </p>
        </form>
      </div>
    </Layout>
  );
}
