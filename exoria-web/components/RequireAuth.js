import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth';

/** Renders children only for signed-in users; sends everyone else to /login and back afterwards. */
export default function RequireAuth({ children }) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.status === 'out') {
      router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
    }
  }, [auth.status, router]);

  if (auth.status !== 'in') return <div className="skeleton" aria-busy="true" aria-label="Loading" />;
  return children;
}
