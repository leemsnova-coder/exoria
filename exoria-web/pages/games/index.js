import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import GameCard from '../../components/GameCard';
import { getSorts, getGameList, getGameIcons } from '../../lib/services';

export default function Games() {
  const router = useRouter();
  const keyword = typeof router.query.keyword === 'string' ? router.query.keyword : '';
  const sortParam = typeof router.query.sort === 'string' ? router.query.sort : '';

  const [sorts, setSorts] = useState([]);
  const [games, setGames] = useState(null);
  const [icons, setIcons] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (!router.isReady) return;
    getSorts('GamesDefaultSorts').then(setSorts).catch(() => setSorts([]));
  }, [router.isReady]);

  const active = sortParam || (sorts[0] && sorts[0].token) || '';

  useEffect(() => {
    if (!router.isReady) return;
    if (!keyword && !active) return;
    let live = true;
    setGames(null);
    setError('');
    getGameList({ sortToken: keyword ? '' : active, keyword, limit: 60 })
      .then(async (list) => {
        if (!live) return;
        setGames(list);
        const ic = await getGameIcons(list.map((g) => g.universeId));
        if (live) setIcons(ic);
      })
      .catch((err) => live && (setGames([]), setError(err.message)));
    return () => { live = false; };
  }, [router.isReady, keyword, active]);

  const pick = (token) => router.push({ pathname: '/games', query: { sort: token } }, undefined, { shallow: true });

  return (
    <Layout title={keyword ? `“${keyword}” · Games` : 'Games'}>
      <div className="pagehead">
        <h1>Games</h1>
        {keyword && (
          <span className="muted">
            Results for “{keyword}” · <a href="/games" onClick={(e) => { e.preventDefault(); router.push('/games'); }}>Clear search</a>
          </span>
        )}
      </div>
      {!keyword && sorts.length > 0 && (
        <div className="tabs" role="tablist">
          {sorts.map((s) => (
            <button key={s.token} type="button" role="tab" aria-selected={s.token === active} className={s.token === active ? 'on' : ''} onClick={() => pick(s.token)}>
              {s.displayName || s.name}
            </button>
          ))}
        </div>
      )}
      {error && <div className="notice error" style={{ marginBottom: 12 }}>Games couldn’t load: {error}</div>}
      {games == null && !error && <div className="skeleton" style={{ minHeight: 240 }} />}
      {games && games.length === 0 && !error && (
        <div className="notice">{keyword ? 'No games match that search. Try a shorter word.' : 'No games in this list yet.'}</div>
      )}
      {games && games.length > 0 && (
        <div className="cards">{games.map((g) => <GameCard key={g.placeId} game={g} icon={icons[g.universeId]} />)}</div>
      )}
    </Layout>
  );
}
