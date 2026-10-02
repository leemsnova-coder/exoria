import { apiUrl, siteUrl, get, post, patch, ApiError } from './api';

const csv = (ids) => encodeURIComponent(ids.join(','));
const absolutize = (rows) => (rows || []).map((r) => (
  r.imageUrl && r.imageUrl.startsWith('/') ? { ...r, imageUrl: siteUrl(r.imageUrl) } : r
));

/* ---------- auth ---------- */
export function login({ username, password }) {
  const body = new URLSearchParams({ username, password }).toString();
  return post(siteUrl('/login'), body, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
}
export const logout = () => post(apiUrl('auth', '/v2/logout'), {});

/* ---------- users ---------- */
export const getMe = () => get(apiUrl('users', '/v1/users/authenticated'));
export const getUser = (userId) => get(apiUrl('users', `/v1/users/${encodeURIComponent(userId)}`));
export const getCurrency = (userId) => get(apiUrl('economy', `/v1/users/${encodeURIComponent(userId)}/currency`));
export const getFriends = (userId) => get(apiUrl('friends', `/v1/users/${encodeURIComponent(userId)}/friends`)).then((d) => d.data || []);
export const getFriendRequestCount = () => get(apiUrl('friends', '/v1/user/friend-requests/count')).then((d) => d.count || 0);

/* ---------- thumbnails ---------- */
export function getHeadshots(userIds, size = '150x150') {
  if (!userIds.length) return Promise.resolve({});
  return get(apiUrl('thumbnails', `/v1/users/avatar-headshot?userIds=${csv(userIds)}&size=${size}&format=png`))
    .then((d) => Object.fromEntries(absolutize(d.data).map((r) => [r.targetId, r.imageUrl])));
}
export async function getGameIcons(universeIds, size = '150x150') {
  const ids = [...new Set(universeIds)].filter(Boolean);
  const out = {};
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const d = await get(apiUrl('thumbnails', `/v1/games/icons?size=${size}&format=png&universeIds=${csv(chunk)}`));
    absolutize(d.data).forEach((r) => { out[r.targetId] = r.imageUrl; });
  }
  return out;
}

/* ---------- games ---------- */
export const getSorts = (context = 'GamesDefaultSorts') =>
  get(apiUrl('games', `/v1/games/sorts?gameSortsContext=${encodeURIComponent(context)}`)).then((d) => d.sorts || []);

export const getGameList = ({ sortToken = '', limit = 40, genre = 0, keyword = '' }) =>
  get(apiUrl('games', `/v1/games/list?sortToken=${encodeURIComponent(sortToken)}&maxRows=${limit}&genre=${genre}&keyword=${encodeURIComponent(keyword)}`))
    .then((d) => d.games || []);

export async function getPlace(placeId) {
  const places = await get(apiUrl('games', `/v1/games/multiget-place-details?placeIds=${encodeURIComponent(placeId)}`));
  const place = Array.isArray(places) ? places[0] : null;
  if (!place) throw new ApiError("That game doesn't exist or was removed.", 404);
  const universes = await get(apiUrl('games', `/v1/games?universeIds=${encodeURIComponent(place.universeId)}`));
  return { place, universe: (universes.data || [])[0] || null };
}

export const getVotes = (universeId) =>
  get(apiUrl('games', `/v1/games/votes?universeIds=${encodeURIComponent(universeId)}`)).then((d) => (d.data || [])[0] || null);

export const vote = (universeId, isUpvote) =>
  patch(apiUrl('games', `/v1/games/${encodeURIComponent(universeId)}/user-votes`), { vote: isUpvote });

export const getServers = (placeId, offset = 0) =>
  get(siteUrl(`/games/getgameinstancesjson?placeId=${encodeURIComponent(placeId)}&startIndex=${offset}`));

/** Ask the backend for a join ticket. Returns the ticket string, or null if none was issued. */
export async function getJoinTicket(placeId) {
  const data = await get(siteUrl(`/game/get-join-script?placeId=${encodeURIComponent(placeId)}`));
  if (typeof data === 'string') {
    const m = data.match(/ticket=([^&"']+)/);
    return m ? m[1] : null;
  }
  return null;
}

/** URL-safe slug for game page links. */
export const slug = (name) => String(name || 'game').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'game';
export const gameHref = (placeId, name) => `/games/${placeId}/${slug(name)}`;
