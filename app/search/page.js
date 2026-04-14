'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Nav from '../Nav';

export default function SearchPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) { router.push('/'); return; }
      return r.json();
    }).then(d => d && setUsername(d.username));
  }, []);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResults(null);

    const res = await fetch(`/api/games/search?name=${encodeURIComponent(query.trim())}`);
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'Game not found.');
      return;
    }
    setResults(data.games);
  }

  return (
    <div className="page-wrapper">
      <Nav username={username} />
      <div className="content">
        <div style={{ marginBottom: '0.5rem' }}>
          <Link href="/dashboard" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
            ← Back
          </Link>
        </div>
        <h1 className="page-title">Search a Game</h1>
        <p className="page-subtitle">Check compatibility with your current PC specs</p>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
          <input
            className="input"
            type="text"
            placeholder="e.g. Cyberpunk 2077, Minecraft..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : 'SEARCH'}
          </button>
        </form>

        {error && (
          <div className="banner banner-error">{error}</div>
        )}

        {results && results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {results.map((game, i) => (
              <GameResult key={i} game={game} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GameResult({ game }) {
  const { name, size, cpuRanking, gpuRanking, minRam, link, canRun, compatibility } = game;
  const { cpuOk, gpuOk, ramOk } = compatibility;

  return (
    <div className="game-result">
      <div className="game-result-header">
        <div>
          <div className="game-result-title">{name}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {size} GB
          </div>
        </div>
        <div>
          {canRun ? (
            <span className="tag tag-green">✓ COMPATIBLE</span>
          ) : (
            <span className="tag tag-red">✗ INCOMPATIBLE</span>
          )}
        </div>
      </div>

      <div className="game-result-body">
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
          Minimum Requirements
        </div>
        <div className="compat-grid">
          <div className="compat-cell">
            <div className="compat-cell-label">CPU Tier</div>
            <div className="compat-cell-value" style={{ color: cpuOk ? 'var(--green)' : 'var(--red)' }}>
              Rank #{cpuRanking}
              <div style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {cpuOk ? '✓ Your CPU qualifies' : '✗ CPU too weak'}
              </div>
            </div>
          </div>
          <div className="compat-cell">
            <div className="compat-cell-label">GPU Tier</div>
            <div className="compat-cell-value" style={{ color: gpuOk ? 'var(--green)' : 'var(--red)' }}>
              Rank #{gpuRanking}
              <div style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {gpuOk ? '✓ Your GPU qualifies' : '✗ GPU too weak'}
              </div>
            </div>
          </div>
          <div className="compat-cell">
            <div className="compat-cell-label">RAM</div>
            <div className="compat-cell-value" style={{ color: ramOk ? 'var(--green)' : 'var(--red)' }}>
              {minRam} GB
              <div style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {ramOk ? '✓ Sufficient RAM' : '✗ Not enough RAM'}
              </div>
            </div>
          </div>
        </div>

        {canRun && link && (
          <div style={{ marginTop: '1.25rem' }}>
            <a href={link} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
              GET THE GAME ↗
            </a>
          </div>
        )}

        {!canRun && (
          <div style={{ marginTop: '1.25rem', padding: '0.75rem 1rem', background: '#1a0a0a', border: '1px solid #3a1a1a', borderRadius: '4px', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            Your PC doesn't meet the minimum requirements for this game.
            Consider upgrading the components marked in red.
          </div>
        )}
      </div>
    </div>
  );
}
