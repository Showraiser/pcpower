'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Nav from '../Nav';

function EditModal({ title, onClose, onSave, children, loading, error, success }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">{title}</div>
        {error && <div className="banner banner-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        {success && <div className="banner banner-success" style={{ marginBottom: '1rem' }}>{success}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {children}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button className="btn btn-primary" onClick={onSave} disabled={loading} style={{ flex: 1 }}>
            {loading ? <span className="spinner" /> : 'SAVE CHANGES'}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>CANCEL</button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cpuList, setCpuList] = useState([]);
  const [gpuList, setGpuList] = useState([]);

  // Modal state
  const [modal, setModal] = useState(null); // 'username' | 'password' | 'cpu' | 'gpu' | 'ram'
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  // Modal form values
  const [currentPassword, setCurrentPassword] = useState('');
  const [newValue, setNewValue] = useState('');
  const [confirmValue, setConfirmValue] = useState('');

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) { router.push('/'); return null; }
      return r.json();
    });

    loadProfile();
    fetch('/api/cpu').then(r => r.json()).then(d => d.cpus && setCpuList(d.cpus));
    fetch('/api/gpu').then(r => r.json()).then(d => d.gpus && setGpuList(d.gpus));
  }, []);

  function loadProfile() {
    setLoading(true);
    fetch('/api/profile').then(r => r.json()).then(d => {
      setProfile(d);
      setLoading(false);
    });
  }

  function openModal(type) {
    setModal(type);
    setCurrentPassword('');
    setNewValue('');
    setConfirmValue('');
    setModalError('');
    setModalSuccess('');
  }

  function closeModal() {
    setModal(null);
  }

  async function handleSave() {
    if (!currentPassword) { setModalError('Current password is required.'); return; }
    if (!newValue) { setModalError('Please enter a new value.'); return; }
    if (modal === 'password' && newValue !== confirmValue) {
      setModalError('Passwords do not match.'); return;
    }

    setModalLoading(true);
    setModalError('');

    const res = await fetch('/api/profile/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field: modal, currentPassword, newValue }),
    });
    const data = await res.json();
    setModalLoading(false);

    if (!res.ok) { setModalError(data.error); return; }

    setModalSuccess('Updated successfully!');
    loadProfile();
    setTimeout(() => closeModal(), 1200);
  }

  const fields = [
    { key: 'username', label: 'Username', value: profile?.username },
    { key: 'password', label: 'Password', value: '••••••••' },
    { key: 'cpu', label: 'CPU', value: profile ? `${profile.cpuName} (Rank #${profile.cpuRanking})` : '—' },
    { key: 'gpu', label: 'GPU', value: profile ? `${profile.gpuName} (Rank #${profile.gpuRanking})` : '—' },
    { key: 'ram', label: 'RAM', value: profile ? `${profile.ram} GB` : '—' },
  ];

  return (
    <div className="page-wrapper">
      <Nav username={profile?.username} />
      <div className="content">
        <div style={{ marginBottom: '0.5rem' }}>
          <Link href="/dashboard" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
            ← Back
          </Link>
        </div>
        <h1 className="page-title">Your Profile</h1>
        <p className="page-subtitle">Manage your account and PC specs</p>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}><span className="spinner" /></div>
        ) : (
          <div className="card">
            <div className="card-header">
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Account Details
              </div>
            </div>
            <div className="card-body" style={{ padding: '0 1.5rem' }}>
              {fields.map(f => (
                <div key={f.key} className="profile-row">
                  <div>
                    <div className="profile-field">{f.label}</div>
                    <div className="profile-value">{f.value || '—'}</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => openModal(f.key)}>
                    EDIT
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {modal && (
        <EditModal
          title={`Change ${modal.charAt(0).toUpperCase() + modal.slice(1)}`}
          onClose={closeModal}
          onSave={handleSave}
          loading={modalLoading}
          error={modalError}
          success={modalSuccess}
        >
          <div className="input-group">
            <label className="input-label">Current Password</label>
            <input className="input" type="password" placeholder="Enter current password"
              value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
          </div>

          {modal === 'username' && (
            <div className="input-group">
              <label className="input-label">New Username</label>
              <input className="input" type="text" placeholder="New username"
                value={newValue} onChange={e => setNewValue(e.target.value)} />
            </div>
          )}

          {modal === 'password' && (
            <>
              <div className="input-group">
                <label className="input-label">New Password</label>
                <input className="input" type="password" placeholder="New password"
                  value={newValue} onChange={e => setNewValue(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Confirm Password</label>
                <input className="input" type="password" placeholder="Confirm new password"
                  value={confirmValue} onChange={e => setConfirmValue(e.target.value)} />
              </div>
            </>
          )}

          {modal === 'cpu' && (
            <div className="input-group">
              <label className="input-label">New CPU</label>
              <select className="input" value={newValue} onChange={e => setNewValue(e.target.value)}>
                <option value="">Select CPU...</option>
                {cpuList.map(c => (
                  <option key={c.name} value={c.name}>{c.name} (Rank #{c.ranking})</option>
                ))}
              </select>
            </div>
          )}

          {modal === 'gpu' && (
            <div className="input-group">
              <label className="input-label">New GPU</label>
              <select className="input" value={newValue} onChange={e => setNewValue(e.target.value)}>
                <option value="">Select GPU...</option>
                {gpuList.map(g => (
                  <option key={g.name} value={g.name}>{g.name} (Rank #{g.ranking})</option>
                ))}
              </select>
            </div>
          )}

          {modal === 'ram' && (
            <div className="input-group">
              <label className="input-label">New RAM (GB)</label>
              <input className="input" type="number" min="1" max="512" placeholder="e.g. 32"
                value={newValue} onChange={e => setNewValue(e.target.value)} />
            </div>
          )}
        </EditModal>
      )}
    </div>
  );
}
