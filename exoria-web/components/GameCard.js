import Link from 'next/link';
import { gameHref } from '../lib/services';

/** Placeholder art for games with no icon yet: colored blocks seeded by the game id. */
export function FallbackArt({ seed, className = 'thumb' }) {
  const palette = ['#0B6FBE', '#E0141C', '#2F9E3F', '#F2C230', '#7A4FB3', '#E58A2B'];
  let s = Number(seed) || 1;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const blocks = Array.from({ length: 6 }, (_, i) => {
    const h = 15 + rnd() * 45;
    return <rect key={i} x={rnd() * 130} y={110 - h} width={14 + rnd() * 26} height={h} fill={palette[Math.floor(rnd() * palette.length)]} />;
  });
  return (
    <svg viewBox="0 0 160 150" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="160" height="150" fill="#BFE3FA" />
      {blocks}
      <rect y="110" width="160" height="40" fill="#4FA34F" />
    </svg>
  );
}

export default function GameCard({ game, icon }) {
  const playing = game.playerCount ?? game.playing ?? 0;
  const up = game.totalUpVotes ?? 0;
  const down = game.totalDownVotes ?? 0;
  const liked = up + down > 0 ? Math.round((up / (up + down)) * 100) : null;
  return (
    <Link href={gameHref(game.placeId, game.name)} className="card">
      {icon ? <img src={icon} alt="" className="thumb" loading="lazy" /> : <FallbackArt seed={game.placeId} />}
      <span className="cb">
        <span className="t">{game.name}</span>
        <span className="muted small">
          {playing.toLocaleString()} playing{liked != null ? ` · ${liked}% liked` : ''}
        </span>
      </span>
    </Link>
  );
}
