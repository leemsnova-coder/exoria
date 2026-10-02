import Link from 'next/link';
import Layout from '../components/Layout';

export default function NotFound() {
  return (
    <Layout title="Page not found">
      <div className="panel pb stack" style={{ maxWidth: 520, margin: '24px auto', textAlign: 'center' }}>
        <img src="/brand/icon.png" alt="" style={{ width: 96, margin: '0 auto' }} />
        <h1>Page not found</h1>
        <p style={{ margin: 0 }}>That page doesn’t exist, or it hasn’t been built in the new Exoria site yet.</p>
        <div><Link href="/" className="btn">Go home</Link></div>
      </div>
    </Layout>
  );
}
