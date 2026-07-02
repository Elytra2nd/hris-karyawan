import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { AuditDetail } from '@/components/audit-detail'

afterEach(cleanup)

describe('AuditDetail', () => {
  it('merender diff sebelum → sesudah dengan label field manusiawi', () => {
    const details = JSON.stringify({
      nama: 'Budi',
      changes: {
        status: { from: 'AKTIF', to: 'NON-AKTIF' },
        noHp: { from: '0811', to: '0822' },
      },
    })
    render(<AuditDetail details={details} />)
    expect(screen.getByText('Status:')).toBeInTheDocument()
    expect(screen.getByText('AKTIF')).toBeInTheDocument()
    expect(screen.getByText('NON-AKTIF')).toBeInTheDocument()
    expect(screen.getByText('No. HP:')).toBeInTheDocument()
  })

  it('menampilkan "Tidak ada perubahan" saat changes kosong', () => {
    render(<AuditDetail details={JSON.stringify({ changes: {} })} />)
    expect(screen.getByText('Tidak ada perubahan nilai')).toBeInTheDocument()
  })

  it('meringkas entri arsip massal', () => {
    render(<AuditDetail details={JSON.stringify({ jenis: 'arsip_massal', jumlah: 5 })} />)
    expect(screen.getByText('Arsip massal: 5 trainee')).toBeInTheDocument()
  })

  it('meringkas entri arsip tunggal', () => {
    render(<AuditDetail details={JSON.stringify({ jenis: 'arsip', namaTerhapus: 'Siti' })} />)
    expect(screen.getByText('Arsipkan: Siti')).toBeInTheDocument()
  })

  it('meringkas pembuatan akun user', () => {
    render(<AuditDetail details={JSON.stringify({ username: 'admin2', role: 'HR_STAFF' })} />)
    expect(screen.getByText('Akun admin2 (HR_STAFF)')).toBeInTheDocument()
  })

  it('fallback ke key: value bila bentuk tak dikenal (bukan JSON mentah)', () => {
    render(<AuditDetail details={JSON.stringify({ foo: 'bar', angka: 3 })} />)
    expect(screen.getByText('foo: bar · angka: 3')).toBeInTheDocument()
  })

  it('menampilkan teks apa adanya bila details bukan JSON', () => {
    render(<AuditDetail details="teks biasa" />)
    expect(screen.getByText('teks biasa')).toBeInTheDocument()
  })

  it('menampilkan em dash saat details null', () => {
    render(<AuditDetail details={null} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
