import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../lib/auth';
import { FallbackArt } from '../../../components/GameCard';
import { getPlace, getVotes, vote, getGameIcons, getJoinTicket } from '../../../lib/services';

const LAUNCH_SCHEME = 'exoria-player';

function Modal({ title, children, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(10,20,30,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 40 }}>
      <div className="panel" role="dialog" aria-modal="true" aria-label={title} style={{ maxWidth: 420, width: '100%' }}>
        <div className="ph">{title}</div>
        <div className="pb stack">
          {children}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button className="btn grey" onClick={onClose} autoFocus>Close</button></div>
        </div>
      </div>
    </div>
  );
}

export default function GamePage() {
  const router = useRouter();
  const auth = useAuth();
  const placeId = Number(router.query.placeId);
  const [data, setData] = useState(null);
  const [votes, setVotes] = useState(null);
  const [icon, setIcon] = useState(undefined);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    if (!Number.isInteger(placeId) || placeId <= 0) { setError("That game doesn't exist."); return; }
    let live = true;
    getPlace(placeId)
      .then(async (d) => {
        if (!live) return;
        setData(d);
        const uid = d.place.universeId;
        const [v, ic] = await Promise.all([getVotes(uid).catch(() => null), getGameIcons([uid], '512x512').catch(() => ({}))]);
        if (!live) return;
        setVotes(v);
        setIcon(ic[uid] || null);
      })
      .catch((err) => live && setError(err.message));
    return () => { live = false; };
  }, [router.isReady, placeId]);

  const play = async () => {
    if (auth.status !== 'in') { router.push(`/login?next=${encodeURIComponent(router.asPath)}`); return; }
    setJoining(true);
    try {
      const ticket = await getJoinTicket(placeId);
      if (!ticket) {
        setModal({ title: 'Couldn’t join', body: 'The server didn’t issue a join ticket. Try again in a moment.' });
        return;
      }
      window.location.href = `${LAUNCH_SCHEME}://join?place=${placeId}&ticket=${encodeURIComponent(ticket)}`;
      setModal({ title: 'Starting Exoria', body: 'If nothing opens, install the Exoria player from the Download page, then press Play again.' });
    } catch (err) {
      setModal({ title: 'Couldn’t join', body: err.message });
    } finally {
      setJoining(false);
    }
  };

  const castVote = async (up) => {
    if (auth.status !== 'in') { router.push(`/login?next=${encodeURIComponent(router.asPath)}`); return; }
    try {
      await vote(data.place.universeId, up);
      setVotes(await getVotes(data.place.universeId));
    } catch (err) {
      setModal({ title: 'Vote not saved', body: err.message });
    }
  };

  if (error) {
    return <Layout title="Game not found"><div className="notice error">{error} <Link href="/games">Back to games</Link></div></Layout>;
  }
  if (!data) {
    return <Layout title="Game"><div className="skeleton" style={{ minHeight: 320 }} /></Layout>;
  }

  const { place, universe } = data;
  const up = votes ? votes.upVotes : 0;
  const down = votes ? votes.downVotes : 0;
  const liked = up + down ? Math.round((up / (up + down)) * 100) : null;
  const creatorName = (universe && universe.creator && universe.creator.name) || place.builder;
  const creatorId = (universe && universe.creator && universe.creator.id) || place.builderId;

  return (
    <Layout title={place.name}>
      <div className="gamehead">
        {icon === undefined ? <div className="art skeleton" /> : icon ? <img src={icon} alt="" className="art" /> : <FallbackArt seed={place.placeId} className="art" />}
        <section className="panel">
          <div className="pb stack">
            <h1 style={{ fontSize: 26, overflowWrap: 'anywhere' }}>{place.name}</h1>
            <div className="muted">By {creatorId ? <Link href={`/users/${creatorId}`}>{creatorName}</Link> : creatorName}</div>
            <button className="btn play" onClick={play} disabled={joining}>{joining ? 'Joining…' : 'Play'}</button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn grey" onClick={() => castVote(true)}>Like ({up.toLocaleString()})</button>
              <button className="btn grey" onClick={() => castVote(false)}>Dislike ({down.toLocaleString()})</button>
            </div>
            <div>
              <div className="stat"><span>Playing</span><b>{(universe?.playing ?? 0).toLocaleString()}</b></div>
              <div className="stat"><span>Visits</span><b>{(universe?.visits ?? 0).toLocaleString()}</b></div>
              <div className="stat"><span>Max players</span><b>{universe?.maxPlayers ?? '–'}</b></div>
              <div className="stat"><span>Liked</span><b>{liked == null ? 'No votes yet' : `${liked}%`}</b></div>
              {universe?.updated && <div className="stat"><span>Updated</span><b>{new Date(universe.updated).toLocaleDateString()}</b></div>}
            </div>
          </div>
        </section>
      </div>
      <section className="panel">
        <div className="ph">About</div>
        <div className="pb" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
          {place.description || universe?.description || <span className="muted">The creator hasn’t written a description yet.</span>}
        </div>
      </section>
      {modal && <Modal title={modal.title} onClose={() => setModal(null)}><p style={{ margin: 0 }}>{modal.body}</p></Modal>}
    </Layout>
  );
}
