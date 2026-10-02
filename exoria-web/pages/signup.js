import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../lib/auth';
import { signup, discordVerifyUrl, validateUsername, login } from '../lib/services';

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

function ageOn(birthday) {
  const b = new Date(birthday + 'T00:00:00');
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  if (now < new Date(now.getFullYear(), b.getMonth(), b.getDate())) age -= 1;
  return age;
}

export default function Signup() {
  const router = useRouter();
  const auth = useAuth();
  const [form, setForm] = useState({ username: '', password: '', confirm: '', birthday: '', gender: '1' });
  const [nameCheck, setNameCheck] = useState({ state: 'idle', msg: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => { if (auth.status === 'in') router.replace('/home'); }, [auth.status, router]);

  // Check the username with the backend shortly after the user stops typing.
  useEffect(() => {
    const name = form.username.trim();
    if (!name) { setNameCheck({ state: 'idle', msg: '' }); return undefined; }
    if (!USERNAME_RE.test(name)) { setNameCheck({ state: 'bad', msg: 'Use 3–20 letters, numbers or underscores.' }); return undefined; }
    setNameCheck({ state: 'checking', msg: 'Checking…' });
    const t = setTimeout(() => {
      validateUsername(name)
        .then((r) => setNameCheck(r.code === 0 || r.code === undefined
          ? { state: 'ok', msg: 'That name is available.' }
          : { state: 'bad', msg: r.message || 'That name isn’t available.' }))
        .catch(() => setNameCheck({ state: 'idle', msg: '' }));
    }, 450);
    return () => clearTimeout(t);
  }, [form.username]);

  const problems = useMemo(() => {
    const p = [];
    if (!USERNAME_RE.test(form.username.trim())) p.push('Choose a username of 3–20 letters, numbers or underscores.');
    if (form.password.length < 8) p.push('Use a password of at least 8 characters.');
    else if (form.password.toLowerCase().includes(form.username.trim().toLowerCase()) && form.username.trim()) p.push('Your password can’t contain your username.');
    if (form.confirm !== form.password) p.push('The two passwords don’t match.');
    const age = ageOn(form.birthday);
    if (age == null) p.push('Enter your birthday.');
    else if (age < 13) p.push('You need to be at least 13 to make an Exoria account.');
    else if (age > 120) p.push('Check your birthday; that date looks wrong.');
    return p;
  }, [form]);

  const submit = async (e) => {
    e.preventDefault();
    if (problems.length) { setError(problems[0]); return; }
    if (nameCheck.state === 'bad') { setError(nameCheck.msg); return; }
    setBusy(true);
    setError('');
    try {
      await signup({ username: form.username.trim(), password: form.password, birthday: form.birthday, gender: Number(form.gender) });
      try { await login({ username: form.username.trim(), password: form.password }); } catch { /* signup may already set the session */ }
      await auth.refresh();
      router.push('/home');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout title="Sign up">
      <div className="auth">
        <div className="logo">
          <img src="/brand/wordmark.png" alt="Exoria" />
          <h1 style={{ fontSize: 26 }}>Create your account</h1>
        </div>
        <section className="panel pb stack" style={{ marginBottom: 12 }}>
          <div><span className="tag">Step 1</span> <b>Verify with Discord</b></div>
          <p className="small muted" style={{ margin: 0 }}>We use Discord to keep out spam accounts. Each Discord account can make one Exoria account. Come back here when it’s done.</p>
          <a className="btn grey" href={discordVerifyUrl()}>Verify with Discord</a>
        </section>
        <form className="panel pb" onSubmit={submit} noValidate>
          <div style={{ marginBottom: 10 }}><span className="tag">Step 2</span> <b>Your details</b></div>
          <div className="field">
            <label htmlFor="su-user">Username</label>
            <input id="su-user" autoComplete="username" value={form.username} onChange={set('username')} maxLength={20} />
            <span className={`small ${nameCheck.state === 'bad' ? 'err-inline' : 'muted'}`} aria-live="polite">{nameCheck.msg}</span>
          </div>
          <div className="field">
            <label htmlFor="su-pass">Password</label>
            <input id="su-pass" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} />
          </div>
          <div className="field">
            <label htmlFor="su-confirm">Confirm password</label>
            <input id="su-confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
          </div>
          <div className="field">
            <label htmlFor="su-bday">Birthday</label>
            <input id="su-bday" type="date" value={form.birthday} onChange={set('birthday')} max={new Date().toISOString().slice(0, 10)} />
          </div>
          <fieldset className="field" style={{ border: 0, padding: 0, margin: '0 0 12px' }}>
            <legend style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Starter character</legend>
            <div style={{ display: 'flex', gap: 16 }}>
              <label><input type="radio" name="gender" value="2" checked={form.gender === '2'} onChange={set('gender')} /> Style A</label>
              <label><input type="radio" name="gender" value="3" checked={form.gender === '3'} onChange={set('gender')} /> Style B</label>
              <label><input type="radio" name="gender" value="1" checked={form.gender === '1'} onChange={set('gender')} /> Surprise me</label>
            </div>
          </fieldset>
          <div className="err" role="alert">{error}</div>
          <button className="btn" style={{ width: '100%' }} disabled={busy}>{busy ? 'Creating account…' : 'Sign up'}</button>
          <p className="small muted" style={{ textAlign: 'center', marginBottom: 0 }}>
            Already have an account? <Link href="/login">Log in</Link>
          </p>
        </form>
      </div>
    </Layout>
  );
}
