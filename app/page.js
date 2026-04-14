'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cpuList, setCpuList] = useState([]);
  const [gpuList, setGpuList] = useState([]);

  // Sign in form state
  const [siUsername, setSiUsername] = useState('');
  const [siPassword, setSiPassword] = useState('');

  // Sign up form state
  const [suUsername, setSuUsername] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suConfirm, setSuConfirm] = useState('');
  const [suCpu, setSuCpu] = useState('');
  const [suGpu, setSuGpu] = useState('');
  const [suRam, setSuRam] = useState('');

  useEffect(() => {
    // Check if already logged in
    fetch('/api/auth/me').then(r => {
      if (r.ok) router.push('/dashboard');
    });
    // Load CPU/GPU lists for signup
    fetch('/api/cpu').then(r => r.json()).then(d => {
      if (d.cpus) setCpuList(d.cpus);
    });
    fetch('/api/gpu').then(r => r.json()).then(d => {
      if (d.gpus) setGpuList(d.gpus);
    });
  }, []);

  async function handleSignIn(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: siUsername, password: siPassword }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    router.push('/dashboard');
  }

  async function handleSignUp(e) {
    e.preventDefault();
    if (suPassword !== suConfirm) { setError('Passwords do not match.'); return; }
    if (!suCpu) { setError('Please select a CPU.'); return; }
    if (!suGpu) { setError('Please select a GPU.'); return; }
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: suUsername, password: suPassword,
        cpuName: suCpu, gpuName: suGpu, ram: parseInt(suRam),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    router.push('/dashboard');
  }

  return (
    <div className="login-page">
      {/* Left panel */}
      <div className="login-left">
        <div>
          <div className="login-big-title">
            PC<br /><span>POW</span><br />ER
          </div>
        </div>
        <div>
          <div className="login-tagline">
            Enter your specs. Search any game. Know in seconds if your rig can handle it.
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Powered by a graph database.
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="login-right">
        <div style={{ maxWidth: '360px', width: '100%', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              PCPOWER
            </div>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
              {tab === 'signin' ? 'Welcome back' : 'Create account'}
            </h2>
          </div>

          <div className="login-tabs">
            <button className={`login-tab ${tab === 'signin' ? 'active' : ''}`} onClick={() => { setTab('signin'); setError(''); }}>
              SIGN IN
            </button>
            <button className={`login-tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => { setTab('signup'); setError(''); }}>
              SIGN UP
            </button>
          </div>

          {error && <div className="banner banner-error" style={{ marginBottom: '1rem' }}>{error}</div>}

          {tab === 'signin' ? (
            <form onSubmit={handleSignIn} className="form-stack">
              <div className="input-group">
                <label className="input-label">Username</label>
                <input className="input" type="text" required autoComplete="username"
                  value={siUsername} onChange={e => setSiUsername(e.target.value)} placeholder="your_username" />
              </div>
              <div className="input-group">
                <label className="input-label">Password</label>
                <input className="input" type="password" required autoComplete="current-password"
                  value={siPassword} onChange={e => setSiPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
                {loading ? <span className="spinner" /> : 'SIGN IN →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="form-stack">
              <div className="input-group">
                <label className="input-label">Username</label>
                <input className="input" type="text" required
                  value={suUsername} onChange={e => setSuUsername(e.target.value)} placeholder="choose_username" />
              </div>
              <div className="input-group">
                <label className="input-label">Password</label>
                <input className="input" type="password" required
                  value={suPassword} onChange={e => setSuPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="input-group">
                <label className="input-label">Confirm Password</label>
                <input className="input" type="password" required
                  value={suConfirm} onChange={e => setSuConfirm(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="input-group">
                <label className="input-label">CPU</label>
                <select className="input" required value={suCpu} onChange={e => setSuCpu(e.target.value)}>
                  <option value="">Select CPU...</option>
                  {cpuList.map(c => (
                    <option key={c.name} value={c.name}>{c.name} (Rank #{c.ranking})</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">GPU</label>
                <select className="input" required value={suGpu} onChange={e => setSuGpu(e.target.value)}>
                  <option value="">Select GPU...</option>
                  {gpuList.map(g => (
                    <option key={g.name} value={g.name}>{g.name} (Rank #{g.ranking})</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">RAM (GB)</label>
                <input className="input" type="number" required min="1" max="512"
                  value={suRam} onChange={e => setSuRam(e.target.value)} placeholder="e.g. 16" />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
                {loading ? <span className="spinner" /> : 'CREATE ACCOUNT →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
