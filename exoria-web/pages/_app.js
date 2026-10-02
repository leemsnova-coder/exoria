import Head from 'next/head';
import '../styles/globals.css';
import { AuthProvider } from '../lib/auth';

export default function ExoriaApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </Head>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
