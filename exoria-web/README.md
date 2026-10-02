# Exoria Web

The Exoria website frontend: an original design with its own styles, icons and branding. It runs on top of the Exoria backend (`Roblox/Roblox.Website`, from BubbaBLOX), and uses the same API endpoints as the old `2016-roblox-main` frontend.

## Run it

```bash
cd exoria-web
cp .env.example .env.local    # fill in your backend URLs
npm install
npm run dev                   # http://localhost:3001
```

For production: `npm run build && npm start`. Put it behind the same domain as the backend (for example with nginx), so the backend's session cookie and CSRF token work.

## Settings (`.env.local`)

| Variable | What it is |
| --- | --- |
| `NEXT_PUBLIC_EXORIA_BASE_URL` | Backend base URL, no trailing slash |
| `NEXT_PUBLIC_EXORIA_API_FORMAT` | API URL pattern, `{0}` = API site, `{1}` = path |
| `NEXT_PUBLIC_EXORIA_CURRENCY_NAME` | Currency name shown in the UI (default `Exos`) |

The build stops with an error if either URL is missing.

## Pages built so far

| Page | Path |
| --- | --- |
| Landing | `/` |
| Log in | `/login` (only redirects back to paths on this site) |
| Sign up | `/signup` (Discord verification step, live username check, 13+ age check) |
| Home dashboard | `/home` (character card, balance, friends, game sorts) |
| Games | `/games` (sort tabs, keyword search) |
| Game page | `/games/:placeId/:slug` (Play, like and dislike, stats, description) |
| Profile | `/profile` goes to `/users/:id` (avatar, status, bio, stats, add or unfriend, games, friends, collectibles tabs) |
| Friends | `/friends` (accept or decline requests, filter friends) |
| Catalog | `/catalog` (categories and subcategories, search, sort, "Show more" paging) |
| Item page | `/catalog/:assetId/:slug` (price, creator, limited info, owned check, buy with confirmation) |

Still to come: inventory, avatar editor, forum, groups, messages, trades, settings, develop, and the info pages.

## Play button

Play asks the backend for a join ticket, then opens `exoria-player://join?place=…&ticket=…`. That scheme belongs to the Exoria player app you ship, which is separate from this site.

## Brand assets

- `public/brand/wordmark.png`: header wordmark
- `public/brand/icon.png`: round E logo (also used for `favicon.ico`)
