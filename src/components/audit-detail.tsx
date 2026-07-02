import { ArrowRight } from '@phosphor-icons/react/ssr'

// Label field karyawan (kunci teknis → label manusiawi).
const FIELD_LABELS: Record<string, string> = {
  cabang: 'Cabang',
  namaLengkap: 'Nama',
  nik: 'NIK',
  noKtp: 'No. KTP',
  tglLahir: 'Tgl Lahir',
  namaIbu: 'Nama Ibu',
  noHp: 'No. HP',
  noJamsostek: 'No. Jamsostek',
  formConsent: 'Form Consent',
  gender: 'Gender',
  status: 'Status',
}

type Changes = Record<string, { from: string; to: string }>

function parse(details: string | null): Record<string, unknown> | null {
  if (!details) return null
  try {
    const obj = JSON.parse(details)
    return obj && typeof obj === 'object' ? obj : null
  } catch {
    return null
  }
}

/** Ringkasan satu baris untuk entri non-diff (arsip, status massal, user, dll). */
function summarize(d: Record<string, unknown>): string | null {
  const jenis = d.jenis as string | undefined
  if (jenis === 'arsip' && d.namaTerhapus) return `Arsipkan: ${d.namaTerhapus}`
  if (jenis === 'permanen' && d.namaTerhapus) return `Hapus permanen: ${d.namaTerhapus}`
  if (jenis === 'restore' && d.namaDipulihkan) return `Pulihkan: ${d.namaDipulihkan}`
  if (jenis === 'arsip_massal') return `Arsip massal: ${d.jumlah} trainee`
  if (jenis === 'status_massal') return `Status massal → ${d.statusBaru}: ${d.jumlah} trainee`
  if (d.action === 'change_password') return 'Ubah password'
  if (d.username && d.role) return `Akun ${d.username} (${d.role})`
  if (d.posisiBaru) return `Kontrak baru: ${d.posisiBaru}`
  if (d.source === 'bulk_import') return `Import: ${d.nama ?? ''}`.trim()
  return null
}

/**
 * Render kolom "Detail" audit log: diff sebelum→sesudah bila ada, atau
 * ringkasan manusiawi, atau fallback teks mentah (bukan JSON kasar).
 */
export function AuditDetail({ details, compact = false }: { details: string | null; compact?: boolean }) {
  const d = parse(details)
  if (!d) {
    return <span className="text-xs text-muted-foreground">{details || '—'}</span>
  }

  const changes = d.changes as Changes | undefined
  if (changes && typeof changes === 'object') {
    const entries = Object.entries(changes)
    if (entries.length === 0) {
      return <span className="text-xs text-muted-foreground">Tidak ada perubahan nilai</span>
    }
    return (
      <div className={compact ? 'flex flex-wrap gap-1.5' : 'flex flex-col gap-1'}>
        {entries.map(([field, { from, to }]) => (
          <div key={field} className="flex items-center gap-1.5 text-xs">
            <span className="font-medium text-foreground/80">{FIELD_LABELS[field] ?? field}:</span>
            <span className="text-muted-foreground line-through decoration-rose-400/70">{from}</span>
            <ArrowRight size={11} className="text-muted-foreground/60 shrink-0" />
            <span className="font-medium text-emerald-600 dark:text-emerald-400">{to}</span>
          </div>
        ))}
      </div>
    )
  }

  const summary = summarize(d)
  if (summary) {
    return <span className="text-xs text-muted-foreground">{summary}</span>
  }

  // Fallback: key: value ringkas (bukan JSON mentah).
  const pairs = Object.entries(d)
    .filter(([, v]) => v != null && typeof v !== 'object')
    .map(([k, v]) => `${k}: ${v}`)
  return <span className="text-xs text-muted-foreground">{pairs.join(' · ') || '—'}</span>
}
