'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function Nav({ username }) {
  const router = useRouter();
  async function signOut() {
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/');
  }
  return (
    <nav className="nav">
      <Link href="/dashboard" className="nav-logo">PC<span>POWER</span></Link>
      <div className="nav-right">
        <span className="nav-username">{username}</span>
        <button className="btn btn-ghost btn-sm" onClick={signOut}>SIGN OUT</button>
      </div>
    </nav>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) { router.push('/'); return; }
      return r.json();
    }).then(d => d && setUsername(d.username));
  }, []);

  const tiles = [
    {
      num: '01',
      label: 'Search a Game',
      desc: 'Check if your PC can run it',
      href: '/search',
    },
    {
      num: '02',
      label: 'CPU List',
      desc: 'Browse all supported processors',
      href: '/cpu-list',
    },
    {
      num: '03',
      label: 'GPU List',
      desc: 'Browse all supported graphics cards',
      href: '/gpu-list',
    },
    {
      num: '04',
      label: 'Your Profile',
      desc: 'View and update your PC specs',
      href: '/profile',
    },
  ];

  return (
    <div className="page-wrapper">
      <Nav username={username} />
      <div className="content">
        <div style={{ marginBottom: '2.5rem' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Welcome back
          </p>
          <h1 className="page-title" style={{ fontSize: '2.4rem' }}>
            {username ? username.toUpperCase() : '—'}
          </h1>
          <p className="page-subtitle">What would you like to do?</p>
        </div>

        <div className="tile-grid">
          {tiles.map(t => (
            <Link key={t.href} href={t.href} className="tile">
              <div className="tile-number">{t.num}</div>
              <div className="tile-label">{t.label}</div>
              <div className="tile-desc">{t.desc}</div>
              <span className="tile-arrow">↗</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
