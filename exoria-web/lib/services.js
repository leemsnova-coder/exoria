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

/* ---------- signup ---------- */
/** Sign-up needs a Discord verification cookie first (backend anti-abuse). This URL starts that flow. */
export const discordVerifyUrl = () => siteUrl('/discordverify');

export async function signup({ username, password, birthday, gender }) {
  const body = new URLSearchParams({ username, password, birthday, gender: String(gender), context: 'Exoria' }).toString();
  try {
    return await post(siteUrl('/login/signup'), body, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  } catch (err) {
    if (err.status === 403) {
      throw new ApiError('Verify with Discord first (step 1), then try again. Each Discord account can make one Exoria account.', 403);
    }
    throw err;
  }
}

export const validateUsername = (username) =>
  get(apiUrl('auth', `/v1/usernames/validate?username=${encodeURIComponent(username)}&context=Signup`));

/* ---------- profiles ---------- */
export const getAvatars = (userIds, size = '420x420') => {
  if (!userIds.length) return Promise.resolve({});
  return get(apiUrl('thumbnails', `/v1/users/avatar?userIds=${csv(userIds)}&size=${size}&format=png`))
    .then((d) => Object.fromEntries(absolutize(d.data).map((r) => [r.targetId, r.imageUrl])));
};
export const getStatus = (userId) => get(apiUrl('users', `/v1/users/${encodeURIComponent(userId)}/status`)).then((d) => d.status || '');
export const getUserGames = (userId) =>
  get(apiUrl('games', `/v2/users/${encodeURIComponent(userId)}/games?cursor=`)).then((d) => d.data || []);
export const getCollectibles = (userId, limit = 24) =>
  get(apiUrl('inventory', `/v1/users/${encodeURIComponent(userId)}/assets/collectibles?cursor=&limit=${limit}&assetType=null`)).then((d) => d.data || []);
export const getFollowersCount = (userId) => get(apiUrl('friends', `/v1/users/${encodeURIComponent(userId)}/followers/count`)).then((d) => d.count || 0);

/* ---------- friends ---------- */
export const getFriendStatus = (meId, userId) =>
  get(apiUrl('friends', `/v1/users/${encodeURIComponent(meId)}/friends/statuses?userIds=${encodeURIComponent(userId)}`))
    .then((d) => ((d.data || [])[0] || {}).status || 'NotFriends');
export const getFriendRequests = (limit = 50) =>
  get(apiUrl('friends', `/v1/my/friends/requests?limit=${limit}&cursor=`)).then((d) => d.data || []);
const friendAction = (userId, action) => post(apiUrl('friends', `/v1/users/${encodeURIComponent(userId)}/${action}`), {});
export const sendFriendRequest = (id) => friendAction(id, 'request-friendship');
export const acceptFriendRequest = (id) => friendAction(id, 'accept-friend-request');
export const declineFriendRequest = (id) => friendAction(id, 'decline-friend-request');
export const unfriend = (id) => friendAction(id, 'unfriend');

/* ---------- catalog ---------- */
export const CATALOG_CATEGORIES = [
  { id: 'Featured', label: 'Featured' },
  { id: 'All', label: 'All items' },
  { id: 'Collectibles', label: 'Collectibles' },
  { id: 'Clothing', label: 'Clothing', subs: [['Shirts', 'Shirts'], ['Pants', 'Pants'], ['Tshirts', 'T-shirts']] },
  { id: 'Accessories', label: 'Accessories', subs: [['Hats', 'Hats'], ['HairAccessories', 'Hair'], ['FaceAccessories', 'Face'], ['NeckAccessories', 'Neck'], ['BackAccessories', 'Back']] },
  { id: 'BodyParts', label: 'Body parts', subs: [['Faces', 'Faces'], ['Heads', 'Heads']] },
  { id: 'Gear', label: 'Gear' },
];
export const CATALOG_SORTS = [
  ['0', 'Relevance'], ['3', 'Recently updated'], ['4', 'Price: low to high'], ['5', 'Price: high to low'], ['100', 'Most favorited'],
];

export async function searchCatalog({ category = 'Featured', subcategory = '', keyword = '', sort = '0', limit = 30, cursor = '' }) {
  let url = `/v1/search/items?category=${encodeURIComponent(category)}&limit=${limit}&sortType=${encodeURIComponent(sort)}`;
  if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
  if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
  if (subcategory) url += `&subcategory=${encodeURIComponent(subcategory)}`;
  const res = await get(apiUrl('catalog', url));
  const ids = (res.data || []).filter((r) => !r.itemType || r.itemType === 'Asset').map((r) => r.id);
  const items = await getItemDetails(ids);
  return { items, nextCursor: res.nextPageCursor || null };
}

export async function getItemDetails(ids) {
  if (!ids.length) return [];
  const res = await post(apiUrl('catalog', '/v1/catalog/items/details'), { items: ids.map((id) => ({ itemType: 'Asset', id })) });
  const byId = Object.fromEntries((res.data || []).map((d) => [d.id, d]));
  return ids.map((id) => byId[id]).filter(Boolean);
}

export async function getAssetThumbs(ids) {
  if (!ids.length) return {};
  const out = {};
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const d = await get(apiUrl('thumbnails', `/v1/assets?assetIds=${csv(chunk)}&format=png&size=420x420`));
    absolutize(d.data).forEach((r) => { out[r.targetId] = r.imageUrl; });
  }
  return out;
}

export const getProductInfo = (assetId) => get(apiUrl('api', `/marketplace/productinfo?assetId=${encodeURIComponent(assetId)}`));
export const getOwnedCopies = (userId, assetId) =>
  get(apiUrl('inventory', `/v1/users/${encodeURIComponent(userId)}/items/Asset/${encodeURIComponent(assetId)}`)).then((d) => d.data || []);

/** Buy an item from the creator. Currency 1 = the main currency. Returns { purchased, reason }. */
export const purchase = ({ productId, assetId, price, sellerId }) =>
  post(apiUrl('economy', `/v1/purchases/products/${encodeURIComponent(productId)}`), {
    assetId, expectedPrice: price, expectedSellerId: sellerId, userAssetId: null, expectedCurrency: 1,
  });

export const itemHref = (id, name) => `/catalog/${id}/${slug(name)}`;
