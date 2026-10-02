import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout, { Coin } from '../../../components/Layout';
import Modal from '../../../components/Modal';
import { useAuth } from '../../../lib/auth';
import { CURRENCY_NAME } from '../../../lib/api';
import { getProductInfo, getAssetThumbs, getOwnedCopies, purchase } from '../../../lib/services';

const PLACEHOLDER = '/brand/avatar-placeholder.svg';

const PURCHASE_REASONS = {
  InsufficientFunds: `You don't have enough ${CURRENCY_NAME}.`,
  AlreadyOwned: 'You already own this item.',
  NotForSale: 'This item is no longer for sale.',
  PriceChanged: 'The price changed. Refresh the page and try again.',
};

export default function ItemPage() {
  const router = useRouter();
  const auth = useAuth();
  const assetId = Number(router.query.assetId);
  const [info, setInfo] = useState(null);
  const [thumb, setThumb] = useState(undefined);
  const [owned, setOwned] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(null); // null | 'confirm' | 'buying' | { done } | { failed }

  const loadOwned = useCallback(() => {
    if (auth.status !== 'in' || !Number.isInteger(assetId)) return;
    getOwnedCopies(auth.user.id, assetId).then((c) => setOwned(c.length > 0)).catch(() => {});
  }, [auth.status, auth.user, assetId]);

  useEffect(() => {
    if (!router.isReady) return undefined;
    if (!Number.isInteger(assetId) || assetId <= 0) { setError("That item doesn't exist."); return undefined; }
    let live = true;
    getProductInfo(assetId).then((d) => live && setInfo(d)).catch((err) => live && setError(err.message));
    getAssetThumbs([assetId]).then((t) => live && setThumb(t[assetId] || null)).catch(() => live && setThumb(null));
    return () => { live = false; };
  }, [router.isReady, assetId]);

  useEffect(() => { loadOwned(); }, [loadOwned]);

  if (error) return <Layout title="Item not found"><div className="notice error">{error} <Link href="/catalog">Back to the catalog</Link></div></Layout>;
  if (!info) return <Layout title="Item"><div className="skeleton" style={{ minHeight: 320 }} /></Layout>;

  const price = info.PriceInRobux ?? 0;
  const forSale = info.IsForSale || info.IsPublicDomain;
  const limited = info.IsLimited || info.IsLimitedUnique;
  const creator = info.Creator || {};
  const balance = auth.balance;
  const canAfford = balance == null || balance >= price;

  const buy = async () => {
    setStep('buying');
    try {
      const res = await purchase({ productId: info.ProductId, assetId, price, sellerId: creator.Id });
      if (res && res.purchased === false) {
        setStep({ failed: PURCHASE_REASONS[res.reason] || res.errorMsg || 'The purchase didn’t go through. Try again.' });
        return;
      }
      setStep({ done: true });
      setOwned(true);
      auth.refresh();
    } catch (err) {
      setStep({ failed: err.message });
    }
  };

  const startBuy = () => {
    if (auth.status !== 'in') { router.push(`/login?next=${encodeURIComponent(router.asPath)}`); return; }
    setStep('confirm');
  };

  let buyButton;
  if (owned && !limited) buyButton = <button className="btn" disabled>You own this</button>;
  else if (!forSale) buyButton = <button className="btn" disabled>Off sale</button>;
  else buyButton = <button className="btn" onClick={startBuy}>{price === 0 ? 'Get it free' : 'Buy'}</button>;

  return (
    <Layout title={info.Name}>
      <div className="pagehead">
        <h1 style={{ overflowWrap: 'anywhere' }}>{info.Name}</h1>
        <Link href="/catalog">Back to the catalog</Link>
      </div>
      <div className="cols item-cols">
        <div className="panel">
          {thumb === undefined
            ? <div className="skeleton" style={{ aspectRatio: '1' }} />
            : <img src={thumb || PLACEHOLDER} alt={info.Name} style={{ width: '100%', aspectRatio: '1', display: 'block', background: 'var(--panel-head)' }} />}
        </div>
        <div className="stack">
          <section className="panel pb stack">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {limited && <span className="tag red">{info.IsLimitedUnique ? 'Limited U' : 'Limited'}</span>}
              {owned && <span className="tag green">Owned</span>}
            </div>
            <div>
              <div className="stat"><span>Price</span>{forSale ? (price === 0 ? <b>Free</b> : <Coin amount={price} />) : <b>Off sale</b>}</div>
              <div className="stat"><span>Creator</span>{creator.Id ? <Link href={`/users/${creator.Id}`}>{creator.Name}</Link> : <b>{creator.Name || '–'}</b>}</div>
              {info.Sales != null && <div className="stat"><span>Sold</span><b>{Number(info.Sales).toLocaleString()}</b></div>}
              {info.Updated && <div className="stat"><span>Updated</span><b>{new Date(info.Updated).toLocaleDateString()}</b></div>}
              {limited && info.Remaining != null && <div className="stat"><span>Remaining</span><b>{Number(info.Remaining).toLocaleString()}</b></div>}
              {auth.status === 'in' && <div className="stat"><span>Your balance</span><Coin amount={balance} /></div>}
            </div>
            <div>{buyButton}</div>
          </section>
          <section className="panel">
            <div className="ph">Description</div>
            <div className="pb" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
              {info.Description || <span className="muted">No description.</span>}
            </div>
          </section>
        </div>
      </div>

      {step === 'confirm' && (
        <Modal title="Confirm purchase" onClose={() => setStep(null)} actions={[
          { label: 'Cancel', kind: 'grey', onClick: () => setStep(null) },
          { label: price === 0 ? 'Get it' : 'Buy now', onClick: buy, disabled: !canAfford },
        ]}>
          {canAfford ? (
            <p style={{ margin: 0 }}>
              {price === 0 ? <>Add <b>{info.Name}</b> to your inventory for free?</>
                : <>Buy <b>{info.Name}</b> for <Coin amount={price} />? You’ll have <Coin amount={balance == null ? null : balance - price} /> left.</>}
            </p>
          ) : (
            <p style={{ margin: 0 }}>This costs <Coin amount={price} /> and you have <Coin amount={balance} />.</p>
          )}
        </Modal>
      )}
      {step === 'buying' && <Modal title="Buying…" onClose={() => {}} actions={[{ label: 'Please wait', kind: 'grey', onClick: () => {}, disabled: true }]}><p style={{ margin: 0 }}>Completing your purchase.</p></Modal>}
      {step && step.done && <Modal title="Purchase complete" onClose={() => setStep(null)}><p style={{ margin: 0 }}><b>{info.Name}</b> is now in your inventory.</p></Modal>}
      {step && step.failed && <Modal title="Purchase failed" onClose={() => setStep(null)}><p style={{ margin: 0 }}>{step.failed}</p></Modal>}
    </Layout>
  );
}
