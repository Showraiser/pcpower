'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Nav from '../Nav';

export default function GpuListPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [gpus, setGpus] = useState([]);
  const [userGpuRanking, setUserGpuRanking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) { router.push('/'); return null; }
      return r.json();
    }).then(d => d && setUsername(d.username));

    Promise.all([
      fetch('/api/gpu').then(r => r.json()),
      fetch('/api/profile').then(r => r.json()),
    ]).then(([gpuData, profileData]) => {
      if (gpuData.gpus) setGpus(gpuData.gpus);
      if (profileData.gpuRanking) setUserGpuRanking(profileData.gpuRanking);
      setLoading(false);
    });
  }, []);

  return (
    <div className="page-wrapper">
      <Nav username={username} />
      <div className="content">
        <div style={{ marginBottom: '0.5rem' }}>
          <Link href="/dashboard" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
            ← Back
          </Link>
        </div>
        <h1 className="page-title">GPU List</h1>
        <p className="page-subtitle">
          All supported graphics cards ranked by performance tier
          {userGpuRanking && <> — your GPU is highlighted</>}
        </p>

        <div className="card">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <span className="spinner" />
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Rank</th>
                    <th>Graphics Card</th>
                    <th style={{ width: '120px', textAlign: 'right' }}>Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {gpus.map(gpu => {
                    const isUser = gpu.ranking === userGpuRanking;
                    return (
                      <tr key={gpu.name}>
                        <td>
                          <span className={`rank-badge ${isUser ? 'user' : ''}`}>
                            {gpu.ranking}
                          </span>
                        </td>
                        <td style={{ color: isUser ? 'var(--text)' : undefined }}>
                          {gpu.name}
                          {isUser && (
                            <span className="tag tag-green" style={{ marginLeft: '0.75rem', fontSize: '0.62rem' }}>
                              YOUR GPU
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                            {gpu.ranking <= 3 ? 'FLAGSHIP' : gpu.ranking <= 6 ? 'HIGH-END' : gpu.ranking <= 10 ? 'MID-RANGE' : 'ENTRY'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ marginTop: '1rem', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Lower rank number = more powerful GPU. Rank #1 is the most powerful.
        </div>
      </div>
    </div>
  );
}
