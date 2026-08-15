import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return null;
  }
  return session;
}

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return session;
}
