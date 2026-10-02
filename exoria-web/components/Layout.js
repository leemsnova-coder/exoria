import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { CURRENCY_NAME } from '../lib/api';

const MAIN_NAV = [
  ['/games', 'Games'],
  ['/catalog', 'Catalog'],
  ['/develop', 'Create'],
  ['/forum', 'Forum'],
];
const SUB_NAV = [
  ['/home', 'Home'],
  ['/profile', 'Profile'],
  ['/friends', 'Friends'],
  ['/messages', 'Messages'],
  ['/settings', 'Settings'],
];

export function Coin({ amount }) {
  return (
    <span className="price" title={CURRENCY_NAME}>
      <span className="coin" aria-hidden="true" />
      {amount == null ? '–' : Number(amount).toLocaleString()}
      <span className="sr-only"> {CURRENCY_NAME}</span>
    </span>
  );
}

function Navbar() {
  const router = useRouter();
  const auth = useAuth();
  const [q, setQ] = useState('');
  const on = (href) => (router.asPath === href || router.asPath.startsWith(href + '/') ? 'on' : '');

  const search = (e) => {
    e.preventDefault();
    const keyword = q.trim();
    router.push(keyword ? `/games?keyword=${encodeURIComponent(keyword)}` : '/games');
  };

  const signOut = async () => {
    await auth.logout();
    router.push('/login');
  };

  return (
    <>
      <header className="top">
        <div className="top-in">
          <Link href={auth.status === 'in' ? '/home' : '/'} className="brand" aria-label="Exoria home">
            <img src="/brand/wordmark.png" alt="Exoria" className="wordmark" />
            <img src="/brand/icon.png" alt="" className="mark" />
          </Link>
          <nav className="mainnav" aria-label="Main">
            {MAIN_NAV.map(([href, label]) => (
              <Link key={href} href={href} className={on(href)}>{label}</Link>
            ))}
          </nav>
          <form className="search" onSubmit={search} role="search">
            <input id="nav-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search games" aria-label="Search games" maxLength={80} />
            <button type="submit">Go</button>
          </form>
          <div className="me">
            {auth.status === 'in' && (
              <>
                <span className="coins"><Coin amount={auth.balance} /></span>
                <Link href="/profile" className="me-name">{auth.user.name}</Link>
                <button type="button" className="linkish" onClick={signOut}>Log out</button>
              </>
            )}
            {auth.status === 'out' && (
              <>
                <Link href="/signup" className="btn small">Sign up</Link>
                <Link href="/login" className="me-name">Log in</Link>
              </>
            )}
          </div>
        </div>
      </header>
      {auth.status === 'in' && (
        <nav className="sub" aria-label="Account">
          <div className="sub-in">
            {SUB_NAV.map(([href, label]) => (
              <Link key={href} href={href} className={on(href)}>
                {label}{href === '/friends' && auth.requests > 0 ? ` (${auth.requests})` : ''}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </>
  );
}

export default function Layout({ title, children }) {
  const full = title ? `${title} · Exoria` : 'Exoria';
  return (
    <>
      <Head>
        <title>{full}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar />
      <main className="wrap">{children}</main>
      <footer className="foot">
        <span>© {new Date().getFullYear()} Exoria</span>
        <Link href="/info/about">About</Link>
        <Link href="/info/terms">Terms</Link>
        <Link href="/info/privacy">Privacy</Link>
        <Link href="/help">Help</Link>
      </footer>
    </>
  );
}
