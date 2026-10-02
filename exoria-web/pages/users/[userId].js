import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import GameCard from '../../components/GameCard';
import Modal from '../../components/Modal';
import { useAuth } from '../../lib/auth';
import {
  getUser, getStatus, getAvatars, getHeadshots, getFriends, getFollowersCount, getUserGames, getCollectibles,
  getFriendStatus, sendFriendRequest, acceptFriendRequest, unfriend, getAssetThumbs, itemHref,
} from '../../lib/services';

const PLACEHOLDER = '/brand/avatar-placeholder.svg';

function FriendButton({ me, userId }) {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => getFriendStatus(me.id, userId).then(setStatus).catch(() => setStatus('NotFriends')), [me.id, userId]);
  useEffect(() => { load(); }, [load]);

  const run = async (fn) => {
    setBusy(true);
    setError('');
    try { await fn(userId); await load(); } catch (err) { setError(err.message); } finally { setBusy(false); setConfirm(false); }
  };

  if (status == null) return <button className="btn grey" disabled>…</button>;
  return (
    <>
      {status === 'Friends' && <button className="btn grey" disabled={busy} onClick={() => setConfirm(true)}>Unfriend</button>}
      {status === 'RequestSent' && <button className="btn grey" disabled>Request sent</button>}
      {status === 'RequestReceived' && <button className="btn" disabled={busy} onClick={() => run(acceptFriendRequest)}>Accept friend request</button>}
      {status === 'NotFriends' && <button className="btn" disabled={busy} onClick={() => run(sendFriendRequest)}>Add friend</button>}
      {error && <div className="err">{error}</div>}
      {confirm && (
        <Modal title="Remove friend" onClose={() => setConfirm(false)} actions={[
          { label: 'Cancel', kind: 'grey', onClick: () => setConfirm(false) },
          { label: 'Remove', kind: 'red', onClick: () => run(unfriend) },
        ]}>
          <p style={{ margin: 0 }}>Remove this person from your friends? You can send a new request later.</p>
        </Modal>
      )}
    </>
  );
}

export default function UserProfile() {
  const router = useRouter();
  const auth = useAuth();
  const userId = Number(router.query.userId);
  const tab = typeof router.query.tab === 'string' ? router.query.tab : 'games';

  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [extra, setExtra] = useState({ status: '', avatar: undefined, followers: null });
  const [friends, setFriends] = useState(null);
  const [heads, setHeads] = useState({});
  const [games, setGames] = useState(null);
  const [items, setItems] = useState(null);
  const [itemThumbs, setItemThumbs] = useState({});

  useEffect(() => {
    if (!router.isReady) return undefined;
    if (!Number.isInteger(userId) || userId <= 0) { setError("That user doesn't exist."); return undefined; }
    let live = true;
    setUser(null); setError(''); setFriends(null); setGames(null); setItems(null);
    getUser(userId).then((u) => live && setUser(u)).catch((err) => live && setError(err.message));
    Promise.all([
      getStatus(userId).catch(() => ''),
      getAvatars([userId]).catch(() => ({})),
      getFollowersCount(userId).catch(() => null),
    ]).then(([status, av, followers]) => live && setExtra({ status, avatar: av[userId] || null, followers }));
    getFriends(userId).then(async (list) => {
      if (!live) return;
      setFriends(list);
      const h = await getHeadshots(list.slice(0, 12).map((f) => f.id)).catch(() => ({}));
      if (live) setHeads(h);
    }).catch(() => live && setFriends([]));
    return () => { live = false; };
  }, [router.isReady, userId]);

  useEffect(() => {
    if (!user) return undefined;
    let live = true;
    if (tab === 'games' && games == null) {
      getUserGames(user.id).then((g) => live && setGames(g.map((x) => ({
        placeId: x.rootPlace ? x.rootPlace.id : x.rootPlaceId || x.id, universeId: x.id, name: x.name, playerCount: x.playing, totalUpVotes: 0, totalDownVotes: 0,
      })))).catch(() => live && setGames([]));
    }
    if (tab === 'items' && items == null) {
      getCollectibles(user.id).then(async (list) => {
        if (!live) return;
        setItems(list);
        const t = await getAssetThumbs(list.map((i) => i.assetId)).catch(() => ({}));
        if (live) setItemThumbs(t);
      }).catch(() => live && setItems([]));
    }
    return () => { live = false; };
  }, [user, tab, games, items]);

  const setTab = (t) => router.replace({ pathname: router.pathname, query: { userId, tab: t } }, undefined, { shallow: true });

  if (error) return <Layout title="User not found"><div className="notice error">{error}</div></Layout>;
  if (!user) return <Layout title="Profile"><div className="skeleton" style={{ minHeight: 320 }} /></Layout>;

  const isMe = auth.status === 'in' && auth.user.id === user.id;
  return (
    <Layout title={user.name}>
      <div className="cols">
        <div className="stack">
          <section className="panel pb" style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 24, overflowWrap: 'anywhere' }}>{user.displayName || user.name}</h1>
            {user.displayName && user.displayName !== user.name && <div className="small muted">@{user.name}</div>}
            {extra.status && <div className="small" style={{ marginTop: 6, overflowWrap: 'anywhere' }}>“{extra.status}”</div>}
            <div style={{ margin: '10px 0' }}>
              {extra.avatar === undefined
                ? <div className="skeleton" style={{ aspectRatio: '1' }} />
                : <img src={extra.avatar || PLACEHOLDER} alt={`${user.name}'s character`} style={{ width: '100%', aspectRatio: '1', background: 'var(--panel-head)', border: '1px solid var(--line)', borderRadius: 3 }} />}
            </div>
            {isMe && <Link href="/settings" className="btn grey">Edit profile</Link>}
            {!isMe && auth.status === 'in' && <FriendButton me={auth.user} userId={user.id} />}
            {!isMe && auth.status === 'out' && <Link href={`/login?next=/users/${user.id}`} className="btn">Log in to add friend</Link>}
          </section>
          <section className="panel">
            <div className="ph">Stats</div>
            <div className="pb">
              <div className="stat"><span>Joined</span><b>{user.created ? new Date(user.created).toLocaleDateString() : '–'}</b></div>
              <div className="stat"><span>Friends</span><b>{friends ? friends.length : '–'}</b></div>
              <div className="stat"><span>Followers</span><b>{extra.followers ?? '–'}</b></div>
            </div>
          </section>
        </div>
        <div className="stack">
          <section className="panel">
            <div className="ph">About</div>
            <div className="pb" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
              {user.description || <span className="muted">{isMe ? 'You haven’t written anything yet. Add a bio in Settings.' : 'Nothing here yet.'}</span>}
            </div>
          </section>
          <section className="panel pb">
            <div className="tabs" role="tablist">
              {[['games', 'Games'], ['friends', 'Friends'], ['items', 'Collectibles']].map(([k, l]) => (
                <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
              ))}
            </div>
            {tab === 'games' && (games == null ? <div className="skeleton" />
              : games.length ? <div className="cards">{games.map((g) => <GameCard key={g.universeId} game={g} />)}</div>
                : <p className="muted">No games yet.</p>)}
            {tab === 'friends' && (friends == null ? <div className="skeleton" />
              : friends.length ? (
                <div className="friends">
                  {friends.map((f) => (
                    <Link key={f.id} href={`/users/${f.id}`} className="friend">
                      <img src={heads[f.id] || PLACEHOLDER} alt="" />
                      <div className="n">{f.displayName || f.name}</div>
                    </Link>
                  ))}
                </div>
              ) : <p className="muted">No friends yet.</p>)}
            {tab === 'items' && (items == null ? <div className="skeleton" />
              : items.length ? (
                <div className="cards">
                  {items.map((i) => (
                    <Link key={i.userAssetId || i.assetId} href={itemHref(i.assetId, i.name)} className="card">
                      <img src={itemThumbs[i.assetId] || PLACEHOLDER} alt="" className="thumb" loading="lazy" />
                      <span className="cb"><span className="t">{i.name}</span>{i.serialNumber ? <span className="small muted">#{i.serialNumber}</span> : null}</span>
                    </Link>
                  ))}
                </div>
              ) : <p className="muted">No collectibles yet.</p>)}
          </section>
        </div>
      </div>
    </Layout>
  );
}
