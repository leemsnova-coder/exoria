import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import RequireAuth from '../components/RequireAuth';
import { useAuth } from '../lib/auth';

function ToMyProfile() {
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => { router.replace(`/users/${user.id}`); }, [user.id, router]);
  return <div className="skeleton" />;
}

export default function Profile() {
  return <Layout title="Profile"><RequireAuth><ToMyProfile /></RequireAuth></Layout>;
}
