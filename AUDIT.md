# AUDIT MENYELURUH — HRIS Karyawan Astra

> Tanggal audit: 2026-06-03
> Cakupan: Design System, Security, Code Quality, Performance, Accessibility, Data Layer, Config/DX, Dokumentasi, Testing.
> Status: **LIST REKOMENDASI** — belum ada yang dieksekusi. Item ✅ = sudah baik, ⬜ = perlu dikerjakan.

---

## 🆕 REQUEST CLIENT — Rebranding & UI Corporate (2026-06-11)

> Batch permintaan client: rebrand HRIS → TMS, login corporate, rampingkan sidebar sesuai scope.

### R1. Form input data di-tengahin ✅
- **Masalah:** Container form `max-w-xl` rata-kiri — terasa kosong di kanan pada layar lebar.
- **Lokasi:** `src/app/(protected)/karyawan/tambah/page.tsx:38` (`<div className="max-w-xl ...">`) — tambahkan `mx-auto`. Cek juga form edit `karyawan/[id]/edit`.
- **Fix:** `max-w-xl mx-auto` (atau `max-w-2xl mx-auto` biar lebih lega), header halaman ikut center bila perlu.

### R2. Rename "HRIS" → "Trainee Monitoring System (TMS)" ✅
- **Scope:** semua label UI yang menyebut "HRIS".
- **Lokasi (11 titik):**
  - `app/layout.tsx:7` — metadata `title`
  - `components/app-sidebar.tsx:96` (module switcher), `:117` (logo app name), `:298` (footer branding)
  - `components/layout-wrapper.tsx:55` — header "HRIS Karyawan Trainee"
  - `components/login-form.tsx:53` ("HRIS Karyawan"), `:154` ("HRIS v2.1")
  - `admin/audit-log/page.tsx:60`, `admin/users/page.tsx:54`, `create-user-modal.tsx:53` — "sistem HRIS"
  - `export-excel-button.tsx:77,83` — filename & judul report (opsional ganti ke TMS)
- **Fix:** brand utama jadi **"Trainee Monitoring System"** dengan singkatan **TMS**. Sidebar app name → "TMS", subtitle tetap "Kalimantan Barat".

### R3. Login jadi corporate split-screen ✅
- **Referensi:** mockup 2 panel — kiri panel branding (gradient biru Astra + greeting "Selamat Datang" + logo + tagline), kanan form login (email/username, password, remember me).
- **Lokasi:** `components/login-form.tsx` + `app/login/page.tsx` (sekarang form tunggal di tengah).
- **Fix:** layout `lg:grid-cols-2` — panel kiri brand (hidden di mobile, form full-width di mobile), panel kanan form. Pakai warna `--primary` (Astra Blue), bukan hardcode. "Sign up" TIDAK dipakai (registrasi via admin saja).

### R4. Hapus modul ATS + sidebar "Waktu" ke bawah ✅
- **Alasan:** di luar scope client (cuma monitoring trainee).
- **Lokasi:** `components/app-sidebar.tsx`
  - Hapus tombol **ATS** (`:98-104`) — module switcher tinggal 1, bisa dihapus seluruhnya atau jadikan label brand "TMS"
  - Hapus 3 section disabled: **Waktu** (`:215-223`), **Keuangan** (`:225-233`), **Kinerja** (`:235-243`)
  - Bersihkan: komponen `SectionHeaderDisabled` & `NavItemDisabled` + icon imports tak terpakai (`CalendarBlank, Clock, AirplaneTilt, Money, Receipt, HandCoins, Target, Star, ChatCircleText, Lock`)
- **Fix:** sidebar tersisa: Umum (Dashboard) · Karyawan · Administrasi.

### R5. Jam aktif (live clock) di dashboard ✅
- **Alasan:** sentuhan corporate — tampilkan waktu real-time.
- **Lokasi:** `app/(protected)/page.tsx` header dashboard (dekat greeting + tanggal).
- **Fix:** komponen client baru `live-clock.tsx` — `HH:mm:ss` update tiap detik + tanggal lengkap (locale ID). Pakai `useEffect` + `setInterval`, guard hydration (mounted state).

**Prioritas:** R2 & R4 cepat (rename + hapus) · R1 trivial · R3 & R5 butuh komponen baru.

---

## 🎯 P0 — PERMINTAAN USER (belum dikerjakan)

### A1. Kembalikan warna ke Astra Blue (revert dari Cyan) ✅
- **Masalah:** `globals.css` `:root` sekarang memakai **Cyan** sebagai primary, tapi `desain.md` (panduan desain permanen) menetapkan **Astra Blue**. Light mode & dark mode pun tidak konsisten — dark mode sudah biru, light mode cyan.
- **Lokasi:** `src/app/globals.css:65-107`
  - `--primary: oklch(0.72 0.13 215)` (cyan) → **harus** `oklch(0.379 0.191 264)` (Astra Blue `#1e40af`)
  - `--secondary: oklch(0.78 0.12 290)` (lavender) → kembalikan ke abu netral
  - `--accent: oklch(0.96 0.04 215)` (cyan pastel) → `oklch(0.951 0.026 264)` (biru-50 `#eff6ff`)
  - `--accent-foreground`, `--ring`, `--sidebar-primary`, `--sidebar-accent*`, `--chart-1` → semua ikut ke biru
  - Chart palette diselaraskan dengan `desain.md` (biru/teal/hijau/kuning/merah), bukan lavender/mint/peach/pink
- **Plus:** bersihkan hardcoded warna cyan yang tersebar (lihat A3) — ini bagian dari revert yang sama.
- **Catatan:** referensi nilai final sudah ada lengkap di `desain.md` bagian "Palet Warna → Primary — Astra Blue".

### A2. Tebalkan & gelapkan font (hitam lebih jelas/bold) ✅
- **Masalah:** `--foreground: oklch(0.18 0.025 240)` itu slate kebiruan, bukan hitam pekat. Teks terasa kurang tegas.
- **Lokasi:** `src/app/globals.css:57`
  - `--foreground` → gelapkan ke `oklch(0.145 0 0)` (slate-900 netral, sesuai `desain.md`) agar hitam lebih kuat
  - `--card-foreground`, `--popover-foreground` ikut diselaraskan
- **Bobot huruf:** heading saat ini mayoritas `font-bold` (sudah baik), tapi body/label banyak `font-medium`. Rekomendasi: naikkan label form & heading sekunder dari `font-medium` → `font-semibold`, dan H1 dari `font-bold` → `font-extrabold` bila ingin lebih tegas. Disepakati di `desain.md` Typography Scale agar konsisten satu sumber.
- **Catatan:** hindari menebalkan semua teks sekaligus (kontras berlebih). Fokus: foreground lebih hitam + heading/label naik satu tingkat bobot.

---

## 🎨 DESIGN SYSTEM & BRANDING

### A3. Hardcoded warna melanggar aturan ANTI-SLOP ✅
`desain.md` melarang hardcode warna — wajib pakai token (`bg-primary`, `text-primary`, `bg-accent`). Ditemukan banyak pelanggaran:
- `src/app/(protected)/page.tsx:132,133,316` — `bg-cyan-50`, `text-cyan-600`, `bg-cyan-500`
- `src/app/(protected)/karyawan/page.tsx:287,625,640,822,831` — `bg-cyan-50/text-cyan-600`, `text-blue-600/text-amber-600`
- `src/components/stat-cards.tsx:18,20,32,44,61` — `border-l-blue-600`, `text-blue-600`, `bg-slate-900`
- `src/components/pdf-button.tsx:41`, `create-user-modal.tsx:107`, `activity-timeline.tsx:37`
- **Fix:** ganti ke token semantik. Ini sekaligus menyelesaikan revert ke Astra Blue (A1) karena warna ikut token `--primary`.

### A4. Micro-typography berlebihan ⬜
`stat-cards.tsx` penuh `text-[9px]`/`text-[10px]` + `uppercase tracking-widest/tighter` + `font-black`. Bertentangan dengan prinsip `desain.md` ("clean SaaS, data-first, minimal ornamen"). Rekomendasi: pakai Typography Scale resmi (`text-xs font-semibold` untuk label), kurangi gradasi ukuran mikro.

### A5. Konsistensi `desain.md` vs implementasi ⬜
Chart palette di `globals.css` (lavender/mint/peach/pink) beda dari `desain.md` (teal/hijau/kuning/merah). Setelah A1, selaraskan agar satu sumber kebenaran.

---

## 🔒 SECURITY (mayoritas sudah kuat)

- ✅ Password bcrypt, JWT 8 jam, `useSecureCookies` di production
- ✅ Rate limit login 10/15mnt (`auth.ts:37`)
- ✅ Upload divalidasi **magic-byte** (bukan `file.type`), max 2MB (`upload.ts:21-41`)
- ✅ File serving auth-gated + proteksi path traversal (`api/files/[...path]/route.ts`)
- ✅ Security headers (`X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`)
- ✅ `.env` tidak ter-track git
- ✅ RBAC matrix terpusat (`auth-guard.ts`)

### S1. Tambahkan CSP & HSTS ⬜
- **Lokasi:** `next.config.ts:3-8` — belum ada `Content-Security-Policy` dan `Strict-Transport-Security`.
- **Fix:** tambah CSP (minimal `default-src 'self'`) + HSTS untuk production.

### S2. Penguatan guard path traversal ⬜
- **Lokasi:** `api/files/[...path]/route.ts:34` — `filePath.startsWith(PRIVATE_BASE)` bisa lolos untuk folder sibling berprefix sama (mis. `private_uploads_x`).
- **Fix:** gunakan `PRIVATE_BASE + path.sep` saat pengecekan prefix.

### S3. `departmentId` tidak lewat validasi Zod ⬜
- **Lokasi:** `employee.ts:53,106` — diambil dari `raw['departmentId']` mentah, di luar schema.
- **Fix:** masukkan ke `createEmployeeSchema`/`updateEmployeeSchema` (optional, cuid). Risiko rendah (FK constraint), tapi konsisten.

### S4. Rate limiter in-memory ⬜ (sudah didokumentasikan)
- **Lokasi:** `auth.ts:33` — single-instance. Untuk deploy multi-instance/serverless pindah ke Redis/Upstash.

---

## 🧱 CODE QUALITY & ARCHITECTURE

### Q1. Hilangkan `as any` (11 kemunculan) ⬜
- **Lokasi utama:** `auth-guard.ts:83,90` — `fail(...) as any` pada `guardAdmin`/`guardPermission`. Beri tipe return eksplisit (`ActionResult<never>`), buang cast.
- `employee.ts:202` — `catch (error: any)` → `catch (error: unknown)` lalu narrow.

### Q2. Sisa `console.*` ⬜
- 1 pemakaian `console.*` tersisa — ganti ke `logger` sesuai konvensi CLAUDE.md.

### Q3. Drift dokumentasi CLAUDE.md vs kode ⬜
- CLAUDE.md menyebut peran **hanya ADMIN & VIEWER**, tapi kode punya 4 peran: `ADMIN, HR_MANAGER, HR_STAFF, VIEWER` (`validation/index.ts:40`, `auth-guard.ts:8-33`).
- CLAUDE.md `Design System` masih tertulis Astra Blue padahal CSS cyan — akan sinkron otomatis setelah A1.
- **Fix:** update CLAUDE.md (roles, design tokens) agar tidak menyesatkan.

### Q4. `tglLahir` bertipe String ⬜
- **Lokasi:** `schema.prisma` (Employee) — `tglLahir String`. Tanggal lain pakai `DateTime`. Pertimbangkan migrasi ke `@db.Date` untuk konsistensi & validasi.

---

## ⚡ PERFORMANCE

### P1. Bungkus session dengan React `cache()` ⬜
- **Lokasi:** `dal.ts:6` — `getServerSession` dipanggil berulang per request (dal + file route + tiap guard). Bungkus `verifySession` dengan `cache()` agar dedupe dalam satu render pass.

### P2. Pagination karyawan masih client-side ⬜
- **Lokasi:** `getEmployees` (`employee.ts:225`) mengambil **semua** baris; `karyawan/page.tsx:145` baru `slice` di client. Dengan ~1000 karyawan, tiap load tarik 1000 row.
- **Fix:** server-side `take`/`skip` + hitung total via `count()`. Selaras dengan temuan UX_AUDIT (audit-log juga belum paginasi).

### P3. `target: ES2017` ⬜ (minor)
- **Lokasi:** `tsconfig.json` — engine Node 22, bisa naik ke `ES2022` untuk output lebih ringkas.

---

## ♿ ACCESSIBILITY

- ✅ Focus-visible ring global + fallback (`globals.css:213-230`)
- ✅ Tidak ada `<div onClick>` non-keyboard (clickable pakai elemen semantik)

### X1. Kontras warna teks kecil ⬜
- `text-cyan-600` di atas `bg-cyan-50` untuk teks `text-[10px]` berisiko gagal WCAG AA. Revert ke Astra Blue (A1) memperbaiki sebagian besar; tetap verifikasi pasangan chip status.

---

## 🗄️ DATA LAYER (Prisma) — sudah baik

- ✅ Index lengkap (`status`, `cabang`, `status+cabang`, `namaLengkap`, FK)
- ✅ Cascade delete kontrak, `SetNull` department
- ✅ Singleton client + adapter MariaDB, `connectionLimit: 5`
- Catatan: lihat Q4 (`tglLahir`).

---

## ⚙️ CONFIG / DX / CI — sudah baik

- ✅ CI lengkap: lint → typecheck → test → build (artifact) (`.github/workflows/ci.yml`)
- ✅ `tsconfig` `strict: true`
- ✅ `xlsx` dari tarball resmi CDN (menghindari CVE versi npm)
- ✅ Prettier + plugin tailwind, ESLint next
- ✅ `.nvmrc`, `engines` Node ≥22

---

## 🧪 TESTING

- ✅ 13 file test (validasi, auth-role, kontrak, akumulasi, import-parsing, password, dll.)
- ⬜ Belum ada test integrasi server action (jsdom-only) — opsional; pertimbangkan test alur RBAC end-to-end.

---

## 📋 RINGKASAN PRIORITAS

| Prio | Item | Effort | Status |
|------|------|--------|--------|
| **P0** | A1 Revert warna ke Astra Blue | Sedang | ✅ |
| **P0** | A2 Tebalkan/gelapkan font | Kecil | ✅ |
| P1 | A3 Bersihkan hardcoded warna | Sedang | ✅ |
| P1 | S1 CSP + HSTS | Kecil | ✅ |
| P1 | Q3 Sinkron CLAUDE.md (roles/design) | Kecil | ✅ |
| P1 | P1 `cache()` session | Kecil | ✅ |
| P1 | P2 Server-side pagination + contractFilter | Sedang | ✅ |
| P2 | S2 Guard path traversal | Kecil | ✅ |
| P2 | S3 Validasi departmentId | Kecil | ✅ |
| P2 | Q1 Buang `as any` | Kecil | ✅ |
| P2 | A4/A5 Konsistensi typografi & chart | Sedang | ✅ |
| P3 | Q2 (console.error di error boundary — intentional), Q4, P3, S4, X1, test integrasi | Bervariasi | ⬜ P3 ✅ |

> Untuk audit khusus UX/workflow (drill-down, filter, empty state), lihat `UX_AUDIT.md` yang sudah ada — saling melengkapi, tidak duplikat.
