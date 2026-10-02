import axios from 'axios';

export const BASE_URL = (process.env.NEXT_PUBLIC_EXORIA_BASE_URL || '').replace(/\/+$/, '');
const API_FORMAT = process.env.NEXT_PUBLIC_EXORIA_API_FORMAT || '';
export const CURRENCY_NAME = process.env.NEXT_PUBLIC_EXORIA_CURRENCY_NAME || 'Exos';

/** Build a URL for one of the backend's API sites, e.g. apiUrl('games', '/v1/games/list'). */
export function apiUrl(site, path) {
  return API_FORMAT.replace(/\{0\}/g, site).replace(/\{1\}/g, path);
}

export function siteUrl(path) {
  return BASE_URL + (path.startsWith('/') ? path : '/' + path);
}

/** Error with a message that is safe to show to the user. */
export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const client = axios.create({ withCredentials: true, timeout: 15000, maxRedirects: 0 });
let csrfToken = '';

function toApiError(err) {
  if (!err.response) {
    return new ApiError('Could not reach Exoria. Check your connection and try again.', 0);
  }
  const { status, data } = err.response;
  const first = data && Array.isArray(data.errors) && data.errors[0];
  if (first && first.message) return new ApiError(first.message, status, first.code);
  if (status === 401) return new ApiError('You need to log in to do that.', 401);
  if (status === 403) return new ApiError("You don't have permission to do that.", 403);
  if (status === 404) return new ApiError("That page or item doesn't exist.", 404);
  if (status === 429) return new ApiError("You're doing that too fast. Wait a moment and try again.", 429);
  return new ApiError(`Something went wrong on our side (error ${status}). Try again shortly.`, status);
}

/**
 * Make a request to the backend. Handles the CSRF handshake the backend uses:
 * a 403 carrying an x-csrf-token header means "retry with this token".
 */
export async function request(method, url, data, { headers = {}, retried = false } = {}) {
  try {
    const res = await client.request({
      method,
      url,
      data,
      headers: { ...headers, ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) },
    });
    return res.data;
  } catch (err) {
    const res = err.response;
    if (res && res.status === 403 && res.headers['x-csrf-token'] && !retried) {
      csrfToken = res.headers['x-csrf-token'];
      return request(method, url, data, { headers, retried: true });
    }
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[exoria-api] ${method} ${url} failed`, res ? res.status : err.message);
    }
    throw toApiError(err);
  }
}

export const get = (url) => request('GET', url);
export const post = (url, data, opts) => request('POST', url, data, opts);
export const patch = (url, data) => request('PATCH', url, data);
