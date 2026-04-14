'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Nav({ username }) {
  const router = useRouter();
  async function signOut() {
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/');
  }
  return (
    <nav className="nav">
      <Link href="/dashboard" className="nav-logo">PC<span>POWER</span></Link>
      <div className="nav-right">
        {username && <span className="nav-username">{username}</span>}
        <button className="btn btn-ghost btn-sm" onClick={signOut}>SIGN OUT</button>
      </div>
    </nav>
  );
}
