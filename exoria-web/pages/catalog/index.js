import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout, { Coin } from '../../components/Layout';
import { searchCatalog, getAssetThumbs, itemHref, CATALOG_CATEGORIES, CATALOG_SORTS } from '../../lib/services';

const PLACEHOLDER = '/brand/avatar-placeholder.svg';
const str = (v, d = '') => (typeof v === 'string' ? v : d);

function ItemCard({ item, thumb }) {
  const limited = (item.itemRestrictions || []).some((r) => /Limited/.test(r));
  const unique = (item.itemRestrictions || []).includes('LimitedUnique');
  const price = item.lowestPrice ?? item.price;
  return (
    <Link href={itemHref(item.id, item.name)} className="card">
      <img src={thumb || PLACEHOLDER} alt="" className="thumb" loading="lazy" />
      <span className="cb">
        <span className="t">{item.name}</span>
        {price != null && price > 0 ? <Coin amount={price} /> : <span className="small muted">{item.isOffSale === false || price === 0 ? 'Free' : 'Off sale'}</span>}
        <span className="small muted">By {item.creatorName}</span>
        {limited && <span><span className="tag red">{unique ? 'Limited U' : 'Limited'}</span></span>}
      </span>
    </Link>
  );
}

export default function Catalog() {
  const router = useRouter();
  const category = str(router.query.category, 'Featured');
  const subcategory = str(router.query.sub);
  const keyword = str(router.query.keyword);
  const sort = str(router.query.sort, '0');

  const [items, setItems] = useState(null);
  const [thumbs, setThumbs] = useState({});
  const [cursor, setCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => { setQ(keyword); }, [keyword]);

  useEffect(() => {
    if (!router.isReady) return undefined;
    let live = true;
    setItems(null); setError(''); setCursor(null);
    searchCatalog({ category, subcategory, keyword, sort })
      .then(async ({ items: list, nextCursor }) => {
        if (!live) return;
        setItems(list);
        setCursor(nextCursor);
        const t = await getAssetThumbs(list.map((i) => i.id)).catch(() => ({}));
        if (live) setThumbs(t);
      })
      .catch((err) => live && (setItems([]), setError(err.message)));
    return () => { live = false; };
  }, [router.isReady, category, subcategory, keyword, sort]);

  const go = (patch) => {
    const next = { category, sub: subcategory, keyword, sort, ...patch };
    Object.keys(next).forEach((k) => { if (!next[k] || (k === 'sort' && next[k] === '0')) delete next[k]; });
    router.push({ pathname: '/catalog', query: next }, undefined, { shallow: true });
  };

  const more = async () => {
    setLoadingMore(true);
    try {
      const { items: list, nextCursor } = await searchCatalog({ category, subcategory, keyword, sort, cursor });
      setItems((prev) => [...prev, ...list]);
      setCursor(nextCursor);
      const t = await getAssetThumbs(list.map((i) => i.id)).catch(() => ({}));
      setThumbs((prev) => ({ ...prev, ...t }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <Layout title="Catalog">
      <div className="pagehead">
        <h1>Catalog</h1>
        <form className="inline-form" onSubmit={(e) => { e.preventDefault(); go({ keyword: q.trim() }); }} role="search">
          <input id="cat-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search items" aria-label="Search items" maxLength={80} />
          <select id="cat-sort" value={sort} onChange={(e) => go({ sort: e.target.value })} aria-label="Sort items">
            {CATALOG_SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button className="btn">Search</button>
        </form>
      </div>
      <div className="cols">
        <nav className="panel side" aria-label="Categories">
          <div className="ph">Category</div>
          {CATALOG_CATEGORIES.map((c) => (
            <div key={c.id}>
              <button type="button" className={`cat ${c.id === category && !subcategory ? 'on' : ''}`} onClick={() => go({ category: c.id, sub: '' })}>{c.label}</button>
              {c.subs && c.id === category && c.subs.map(([id, label]) => (
                <button key={id} type="button" className={`cat sub-cat ${id === subcategory ? 'on' : ''}`} onClick={() => go({ category: c.id, sub: id })}>{label}</button>
              ))}
            </div>
          ))}
        </nav>
        <div className="stack">
          {keyword && <div className="muted">Results for “{keyword}” · <button type="button" className="linkish link" onClick={() => go({ keyword: '' })}>Clear search</button></div>}
          {error && <div className="notice error">The catalog couldn’t load: {error}</div>}
          {items == null && <div className="skeleton" style={{ minHeight: 300 }} />}
          {items && items.length === 0 && !error && <div className="notice">Nothing here yet. Try another category or a shorter search.</div>}
          {items && items.length > 0 && <div className="cards">{items.map((i) => <ItemCard key={i.id} item={i} thumb={thumbs[i.id]} />)}</div>}
          {cursor && <div style={{ textAlign: 'center' }}><button className="btn grey" onClick={more} disabled={loadingMore}>{loadingMore ? 'Loading…' : 'Show more'}</button></div>}
        </div>
      </div>
    </Layout>
  );
}
