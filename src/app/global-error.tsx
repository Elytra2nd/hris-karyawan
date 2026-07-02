'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/logger'

// global-error menggantikan root layout saat terjadi error fatal, jadi harus
// merender <html>/<body> sendiri dan tidak bisa mengandalkan globals.css.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Global error boundary', { digest: error.digest, error: String(error) })
  }, [error])

  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#f8fafc',
          color: '#0f172a',
          padding: '1rem',
        }}
      >
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
            Terjadi Kesalahan Sistem
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 1.5rem' }}>
            Aplikasi mengalami gangguan yang tidak terduga. Silakan muat ulang halaman.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: '#1e40af',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.625rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Muat Ulang
          </button>
        </div>
      </body>
    </html>
  )
}
