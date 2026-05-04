'use client';

import { useAuth } from '@/lib/auth';
import KanbanBoard from '@/components/KanbanBoard';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  if (loading) return null;
  if (!user)   return null;

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <KanbanBoard
      userId={user.id}
      userName={user.name}
      onLogout={handleLogout}
    />
  );
}
