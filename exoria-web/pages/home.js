import Link from 'next/link';
import { useEffect, useState } from 'react';
import Layout, { Coin } from '../components/Layout';
import RequireAuth from '../components/RequireAuth';
import GameCard from '../components/GameCard';
import { useAuth } from '../lib/auth';
import { getFriends, getHeadshots, getSorts, getGameList, getGameIcons } from '../lib/services';

function Dashboard() {
  const { user, balance, requests } = useAuth();
  const [friends, setFriends] = useState(null);
  const [heads, setHeads] = useState(null);
  const [sorts, setSorts] = useState(null);
  const [icons, setIcons] = useState({});
  const [error, setError] = useState('');
  const head = (id) => (heads && heads[id]) || '/brand/avatar-placeholder.svg';

  useEffect(() => {
    let live = true;
    getFriends(user.id)
      .then(async (list) => {
        if (!live) return;
        setFriends(list);
        const h = await getHeadshots([user.id, ...list.slice(0, 9).map((f) => f.id)]);
        if (live) setHeads(h);
      })
      .catch(() => live && (setFriends([]), setHeads({})));

    getSorts('HomeSorts')
      .then((all) => Promise.all(all.slice(0, 3).map(async (s) => ({ ...s, games: await getGameList({ sortToken: s.token, limit: 6 }) }))))
      .then(async (filled) => {
        if (!live) return;
        setSorts(filled);
        const ic = await getGameIcons(filled.flatMap((s) => s.games.map((g) => g.universeId)));
        if (live) setIcons(ic);
      })
      .catch((err) => live && (setSorts([]), setError(err.message)));
    return () => { live = false; };
  }, [user.id]);

  return (
    <div className="stack">
      <div className="hero">
        <section className="splash">
          <h1>Hello, {user.displayName || user.name}!</h1>
          <p>Pick up where you left off, or find something new to play.</p>
          <div style={{ position: 'relative', zIndex: 1 }}><Link href="/games" className="btn grey">Browse games</Link></div>
          <img src="/brand/icon.png" alt="" className="mark" />
        </section>
        <section className="panel">
          <div className="ph">Your character <Link href="/profile">Profile</Link></div>
          <div className="pb" style={{ display: 'grid', gridTemplateColumns: '100px minmax(0,1fr)', gap: 12, alignItems: 'center' }}>
            {heads
              ? <img src={head(user.id)} alt="" style={{ width: 100, height: 100, background: 'var(--panel-head)', border: '1px solid var(--line)', borderRadius: 3 }} />
              : <div className="skeleton" style={{ minHeight: 100 }} />}
            <div>
              <div className="stat"><span>Balance</span><Coin amount={balance} /></div>
              <div className="stat"><span>Friends</span><b>{friends ? friends.length : '–'}</b></div>
              <div className="stat"><span>Requests</span><b>{requests}</b></div>
            </div>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="ph">Friends {friends ? `(${friends.length})` : ''} <Link href="/friends">See all</Link></div>
        <div className="pb">
          {friends == null && <div className="skeleton" />}
          {friends && friends.length === 0 && <p className="muted" style={{ margin: 0 }}>No friends yet. Find people on a game page or in the forum and send them a request.</p>}
          {friends && friends.length > 0 && (
            <div className="friends">
              {friends.slice(0, 9).map((f) => (
                <Link key={f.id} href={`/users/${f.id}`} className="friend">
                  {heads ? <img src={head(f.id)} alt="" /> : <div className="skeleton" style={{ minHeight: 0, aspectRatio: '1' }} />}
                  <div className="n">{f.displayName || f.name}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {error && <div className="notice error">Games couldn’t load: {error}</div>}
      {sorts == null && <div className="skeleton" />}
      {sorts && sorts.filter((s) => s.games.length).map((s) => (
        <section className="panel" key={s.token}>
          <div className="ph">{s.displayName || s.name} <Link href={`/games?sort=${encodeURIComponent(s.token)}`}>See all</Link></div>
          <div className="pb cards">
            {s.games.map((g) => <GameCard key={g.placeId} game={g} icon={icons[g.universeId]} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <Layout title="Home">
      <RequireAuth><Dashboard /></RequireAuth>
    </Layout>
  );
}
