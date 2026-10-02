import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import RequireAuth from '../components/RequireAuth';
import { useAuth } from '../lib/auth';
import { getFriends, getFriendRequests, getHeadshots, acceptFriendRequest, declineFriendRequest } from '../lib/services';

const PLACEHOLDER = '/brand/avatar-placeholder.svg';

function FriendsPage() {
  const auth = useAuth();
  const [friends, setFriends] = useState(null);
  const [requests, setRequests] = useState(null);
  const [heads, setHeads] = useState({});
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    const [f, r] = await Promise.all([getFriends(auth.user.id).catch(() => []), getFriendRequests().catch(() => [])]);
    setFriends(f);
    setRequests(r);
    const h = await getHeadshots([...f, ...r].map((u) => u.id).slice(0, 100)).catch(() => ({}));
    setHeads(h);
  }, [auth.user.id]);

  useEffect(() => { load(); }, [load]);

  const act = async (user, fn, done) => {
    setBusy(user.id);
    setMessage('');
    try {
      await fn(user.id);
      setMessage(done);
      await load();
      auth.refresh();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(null);
    }
  };

  const shown = (friends || []).filter((f) => !query || (f.displayName || f.name).toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="stack">
      <div className="pagehead"><h1>Friends</h1></div>
      {message && <div className="notice" role="status">{message}</div>}
      <section className="panel">
        <div className="ph">Friend requests {requests ? `(${requests.length})` : ''}</div>
        <div className="pb">
          {requests == null && <div className="skeleton" />}
          {requests && requests.length === 0 && <p className="muted" style={{ margin: 0 }}>No requests right now.</p>}
          {requests && requests.map((u) => (
            <div key={u.id} className="row">
              <img src={heads[u.id] || PLACEHOLDER} alt="" className="row-img" />
              <Link href={`/users/${u.id}`} className="row-name">{u.displayName || u.name}</Link>
              <span className="row-actions">
                <button className="btn" disabled={busy === u.id} onClick={() => act(u, acceptFriendRequest, `You and ${u.name} are now friends.`)}>Accept</button>
                <button className="btn grey" disabled={busy === u.id} onClick={() => act(u, declineFriendRequest, `Declined ${u.name}'s request.`)}>Decline</button>
              </span>
            </div>
          ))}
        </div>
      </section>
      <section className="panel">
        <div className="ph">
          Your friends {friends ? `(${friends.length})` : ''}
          <input aria-label="Filter friends" placeholder="Filter by name" value={query} onChange={(e) => setQuery(e.target.value)} className="ph-filter" />
        </div>
        <div className="pb">
          {friends == null && <div className="skeleton" />}
          {friends && friends.length === 0 && <p className="muted" style={{ margin: 0 }}>No friends yet. Open someone’s profile and press Add friend.</p>}
          {friends && friends.length > 0 && shown.length === 0 && <p className="muted" style={{ margin: 0 }}>No friends match “{query}”.</p>}
          {shown.length > 0 && (
            <div className="friends">
              {shown.map((f) => (
                <Link key={f.id} href={`/users/${f.id}`} className="friend">
                  <img src={heads[f.id] || PLACEHOLDER} alt="" />
                  <div className="n">{f.displayName || f.name}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function Friends() {
  return <Layout title="Friends"><RequireAuth><FriendsPage /></RequireAuth></Layout>;
}
