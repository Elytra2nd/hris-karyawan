/**
 * Format tampilan cabang & posisi — satu sumber kebenaran.
 *
 * Kode cabang (H720) dan nama daerah (PONTIANAK) sebelumnya ditampilkan
 * terpisah tergantung tempatnya: filter memakai nama saja, tabel memakai kode
 * saja. Akibatnya orang yang membaca laporan harus hafal pemetaannya sendiri.
 * Ditampilkan bersama supaya keduanya bisa dicocokkan tanpa menghafal.
 */

/** "H720 — PONTIANAK". Kalau salah satu kosong, tampilkan yang ada saja. */
export function formatBranch(code?: string | null, label?: string | null): string {
  const k = (code ?? '').trim()
  const n = (label ?? '').trim()
  if (k && n && k !== n) return `${k} — ${n}`
  return k || n || '-'
}
