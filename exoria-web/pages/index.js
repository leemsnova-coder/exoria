import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../lib/auth';

export default function Landing() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.status === 'in') router.replace('/home');
  }, [auth.status, router]);

  return (
    <Layout>
      <div className="hero">
        <section className="splash">
          <h1>Build it. Play it. Share it.</h1>
          <p>Exoria is a place to make your own games, play what your friends made, and dress up a blocky character however you like.</p>
          <div style={{ display: 'flex', gap: 8, position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
            <Link href="/signup" className="btn play">Join Exoria</Link>
            <Link href="/games" className="btn grey">Browse games</Link>
          </div>
          <img src="/brand/icon.png" alt="" className="mark" />
        </section>
        <section className="panel">
          <div className="ph">Already a member?</div>
          <div className="pb stack">
            <p style={{ margin: 0 }}>Log in to see your friends, your games and your inventory.</p>
            <Link href="/login" className="btn">Log in</Link>
          </div>
        </section>
      </div>
    </Layout>
  );
}
