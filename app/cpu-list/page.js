'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Nav from '../Nav';

export default function CpuListPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [cpus, setCpus] = useState([]);
  const [userCpuRanking, setUserCpuRanking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) { router.push('/'); return null; }
      return r.json();
    }).then(d => {
      if (!d) return;
      setUsername(d.username);
    });

    Promise.all([
      fetch('/api/cpu').then(r => r.json()),
      fetch('/api/profile').then(r => r.json()),
    ]).then(([cpuData, profileData]) => {
      if (cpuData.cpus) setCpus(cpuData.cpus);
      if (profileData.cpuRanking) setUserCpuRanking(profileData.cpuRanking);
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
        <h1 className="page-title">CPU List</h1>
        <p className="page-subtitle">
          All supported processors ranked by performance tier
          {userCpuRanking && <> — your CPU is highlighted</>}
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
                    <th>Processor</th>
                    <th style={{ width: '120px', textAlign: 'right' }}>Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {cpus.map(cpu => {
                    const isUser = cpu.ranking === userCpuRanking;
                    return (
                      <tr key={cpu.name}>
                        <td>
                          <span className={`rank-badge ${isUser ? 'user' : ''}`}>
                            {cpu.ranking}
                          </span>
                        </td>
                        <td style={{ color: isUser ? 'var(--text)' : undefined }}>
                          {cpu.name}
                          {isUser && (
                            <span className="tag tag-green" style={{ marginLeft: '0.75rem', fontSize: '0.62rem' }}>
                              YOUR CPU
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                            {cpu.ranking <= 3 ? 'FLAGSHIP' : cpu.ranking <= 6 ? 'HIGH-END' : cpu.ranking <= 9 ? 'MID-RANGE' : 'ENTRY'}
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
          Lower rank number = more powerful CPU. Rank #1 is the most powerful.
          A game with minimum CPU Rank #8 can run on any CPU ranked 1–7.
        </div>
      </div>
    </div>
  );
}
