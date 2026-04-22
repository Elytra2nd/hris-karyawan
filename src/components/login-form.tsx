'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, User, Shield, ArrowRight, AlertCircle } from 'lucide-react';

const F = "'Satoshi', 'Inter', system-ui, sans-serif";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try {
      const res = await signIn('credentials', {
        redirect: false,
        username,
        password,
      });

      if (res?.error) {
        setError('Username atau password salah.');
        setLoading(false);
      } else if (res?.ok) {
        // Force full page navigation with cookie refresh
        window.location.replace('/');
      }
    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: 420, fontFamily: F }}>

      {/* BRANDING */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <img src="/astra-logo.png" alt="Astra" style={{ height: 48, objectFit: 'contain' }} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0, letterSpacing: '-0.02em' }}>
          HRIS Karyawan
        </h1>
        <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4, fontWeight: 500 }}>
          Astra Motor Kalimantan Barat
        </p>
      </div>

      {/* CARD */}
      <div style={{
        background: '#fff', borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        border: '1px solid #E2E8F0',
      }}>
        {/* Accent line */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, #1E293B 0%, #3B82F6 50%, #1E293B 100%)' }} />

        <div style={{ padding: '32px 28px' }}>
          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1E293B', margin: 0 }}>
              Masuk ke Sistem
            </h2>
            <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>
              Masukkan kredensial untuk mengakses database
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6, letterSpacing: '0.02em' }}>
                Username
              </label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '0 14px', height: 46, borderRadius: 10,
                border: `1.5px solid ${focused === 'user' ? '#3B82F6' : '#E2E8F0'}`,
                background: focused === 'user' ? '#fff' : '#F8FAFC',
                transition: 'all 0.15s',
                boxShadow: focused === 'user' ? '0 0 0 3px rgba(59,130,246,0.1)' : 'none',
              }}>
                <User size={16} color={focused === 'user' ? '#3B82F6' : '#94A3B8'} style={{ transition: 'color 0.15s' }} />
                <input
                  name="username"
                  type="text"
                  placeholder="Masukkan username"
                  required
                  disabled={loading}
                  autoComplete="username"
                  onFocus={() => setFocused('user')}
                  onBlur={() => setFocused(null)}
                  style={{
                    flex: 1, border: 'none', outline: 'none', background: 'transparent',
                    fontSize: 14, fontWeight: 500, color: '#1E293B', fontFamily: F,
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6, letterSpacing: '0.02em' }}>
                Password
              </label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '0 14px', height: 46, borderRadius: 10,
                border: `1.5px solid ${focused === 'pass' ? '#3B82F6' : '#E2E8F0'}`,
                background: focused === 'pass' ? '#fff' : '#F8FAFC',
                transition: 'all 0.15s',
                boxShadow: focused === 'pass' ? '0 0 0 3px rgba(59,130,246,0.1)' : 'none',
              }}>
                <Lock size={16} color={focused === 'pass' ? '#3B82F6' : '#94A3B8'} style={{ transition: 'color 0.15s' }} />
                <input
                  name="password"
                  type="password"
                  placeholder="Masukkan password"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  onFocus={() => setFocused('pass')}
                  onBlur={() => setFocused(null)}
                  style={{
                    flex: 1, border: 'none', outline: 'none', background: 'transparent',
                    fontSize: 14, fontWeight: 500, color: '#1E293B', fontFamily: F,
                  }}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 10, marginBottom: 18,
                background: '#FEF2F2', border: '1px solid #FECACA',
                fontSize: 13, fontWeight: 500, color: '#DC2626',
              }}>
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', height: 48, borderRadius: 10, border: 'none',
                background: loading ? '#94A3B8' : '#1E293B',
                color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
                fontFamily: F, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.15s', boxShadow: '0 2px 8px rgba(30,41,59,0.15)',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#334155'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#1E293B'; }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Memverifikasi...
                </>
              ) : (
                <>
                  Masuk
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Security note */}
          <div style={{
            marginTop: 24, padding: '12px 0', borderTop: '1px solid #F1F5F9',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontSize: 11, color: '#CBD5E1', fontWeight: 500,
          }}>
            <Lock size={10} />
            Koneksi terenkripsi · Sesi aman
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 4px 0', fontSize: 11, color: '#CBD5E1', fontWeight: 500,
      }}>
        <span>&copy; 2026 Astra Motor Kalimantan Barat</span>
        <span>HRIS v2.1</span>
      </div>
    </div>
  );
}