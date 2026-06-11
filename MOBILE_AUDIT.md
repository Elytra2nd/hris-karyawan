# AUDIT MOBILE RESPONSIVE + SISA YANG KURANG

> Tanggal: 2026-06-04 · Status: **LIST REKOMENDASI** (belum dieksekusi)
> Breakpoint Tailwind: `sm`=640px · `md`=768px · `lg`=1024px · `xl`=1280px

---

## ✅ SUDAH BAIK (mobile)

- **Sidebar** → pakai `Sheet` drawer di mobile (`isMobile` → `openMobile`, lebar 18rem) + hamburger `SidebarTrigger` di header. (`sidebar.tsx:199`)
- **Form tambah/edit** → `grid-cols-1 sm:grid-cols-2`, stack rapi di mobile. (`employee-form.tsx`)
- **List karyawan** → tabel desktop (`hidden sm:block`) + card view mobile (`sm:hidden`) terpisah. (`karyawan/page.tsx`)
- **Riwayat kontrak** → tabel desktop + timeline mobile. (`contract-list.tsx`)
- **Audit log** → tabel desktop + card mobile. (`audit-log/page.tsx`)
- **Detail karyawan** → grid responsif, header `flex-col sm:flex-row`. (`karyawan/[id]/page.tsx`)
- **SidebarInset** → `overflow-x-hidden` + `max-w-[1400px] mx-auto` mencegah overflow horizontal global.

---

## 🔴 MASALAH MOBILE

### M1. Tabel Admin Users tanpa mobile view — P1 ✅
- **File:** `src/app/(protected)/admin/users/page.tsx`
- **Masalah:** `<table>` 4 kolom (Pengguna/Role/Dibuat/Aksi) **tanpa** `overflow-x-auto` & **tanpa** card mobile → kolom terjepit di <640px. Stat cards `grid-cols-3` (3 kolom) terlalu sempit di HP.
- **Fix:** tambah card view `md:hidden` + ubah stat cards ke `grid-cols-1 sm:grid-cols-3`.

### M2. Department Manager tanpa mobile view — P1 ✅
- **File:** `src/components/department-manager.tsx`
- **Masalah:** tabel 4 kolom tanpa `overflow-x-auto`/card mobile. Header (judul + search input + tombol Tambah) `flex` tanpa wrap → di mobile search & tombol berdesakan/overflow. Layout `grid-cols-1 lg:grid-cols-3` (form di bawah, OK).
- **Fix:** header `flex-wrap` atau stack vertical; tabel kasih `overflow-x-auto` atau card mobile.

### M3. Touch target < 44px — P2 ✅ (a11y + mobile)
- **Sebaran:** 13× `h-7 w-7` (28px), 11× `h-8 w-8` (32px), 3× `size-7`, 4× `size-8` — tombol aksi (Eye/Pencil/Trash) di tabel & toolbar.
- **Standar:** iOS HIG & WCAG 2.5.5 = min **44×44px**; WCAG 2.5.8 (AA) = min 24px.
- **Fix:** action button yang sering ditekan (lihat/edit/hapus di list, hamburger) naik ke min `h-9 w-9` (36px) atau perbesar tap-area via padding di mobile.

### M4. Font terlalu kecil + risiko iOS auto-zoom — P2 ✅
- **Sebaran:** 34× `text-[10px]`, 25× `text-[11px]`, 6× `text-[9px]`.
- **Masalah utama:** input form pakai `text-sm` (14px). **iOS Safari auto-zoom** saat focus input dengan font <16px → UX jelek di iPhone.
- **Fix:** input mobile ke 16px (`text-base sm:text-sm` atau `text-[16px] sm:text-sm`); label minimal naik ke `text-xs` (12px); hindari `text-[9px]`.

### M5. Karyawan list header — 3 tombol berjejer overflow — P2 ✅
- **File:** `src/app/(protected)/karyawan/page.tsx:233` — Export + Import + "Tambah Karyawan" dalam `flex items-center gap-2` tanpa wrap → overflow horizontal di <400px.
- **Fix:** `flex-wrap`, atau icon-only di mobile, atau gabung ke dropdown "Aksi".

### M6. Viewport meta tidak eksplisit — P3 ✅
- **File:** `src/app/layout.tsx` — tidak ada `export const viewport`.
- **Catatan:** Next.js menambah default, tapi best practice deklarasi eksplisit untuk kontrol `themeColor`, `initialScale`, dll.
- **Fix:** `export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#1e40af' }`.

### M7. Range tablet (640–960px) dapat tabel scroll — P3
- **File:** `karyawan/page.tsx` desktop table `min-w-[960px]`; card mobile aktif hanya `<640px` (`sm:hidden`).
- **Masalah:** HP landscape / tablet potret (640–960px) dapat tabel yang horizontal-scroll, bukan card.
- **Fix (opsional):** naikkan breakpoint card ke `md:hidden` / `hidden md:block` agar 640–768px tetap dapat card.

### M8. Dashboard di mobile — sebagian besar OK — P3
- Charts `ResponsiveContainer` (height 220) & grid `lg:grid-cols-2` stack di mobile = baik.
- Tabel sebaran cabang `min-w-[540px]` di-wrap `overflow-x-auto` = baik (scroll, tidak overflow halaman).
- Tidak ada aksi wajib; biarkan.

---

## 🟡 SISA YANG MASIH KURANG (non-mobile, dari AUDIT.md & UX_AUDIT.md)

### Workflow / UX
- **UX 1.2** — Chart "Distribusi Posisi" & "Sebaran Cabang" belum interaktif (klik → filter). ⬜
- **UX 3.2** — Belum ada quick-action "Perpanjang / Hentikan kontrak" di tiap row contract-list. ⬜
- **UX 6.1** — Department belum bisa di-**edit/rename** (cuma delete). ⬜
- **UX 7.1** — Form belum validate **on-blur** (validasi hanya saat submit). ⬜
- **UX 7.2** — Edit form tanpa peringatan **unsaved changes** sebelum pindah halaman. ⬜
- **UX 7.3** — Ubah status ke NON-AKTIF tanpa **konfirmasi** (AlertDialog). ⬜
- **UX 8.1** — Back dari detail karyawan **menghilangkan filter** sebelumnya. ⬜
- **UX 9.1** — Notification bell tanpa **search**. ⬜
- **UX 9.2** — Notifikasi tanpa **mark-as-read** (badge selalu muncul). ⬜
- **UX 10.2** — Image upload tanpa **progress indicator** jelas untuk file besar. ⬜

### Teknis / Best-practice (dari AUDIT.md)
- **Q4** — `tglLahir` bertipe `String` (bukan `DateTime`) — butuh migrasi DB. ⬜
- **S4** — Rate limiter login in-memory (single-instance) → Redis untuk multi-instance. ⬜
- **Test** — Belum ada test integrasi server action (RBAC end-to-end). ⬜

---

## 📋 PRIORITAS MOBILE

| Prio | Item | Effort |
|------|------|--------|
| **P1** | M1 Users mobile card + stat grid | Sedang |
| **P1** | M2 Department mobile card + header wrap | Sedang |
| **P2** | M3 Touch target ≥36–44px | Kecil |
| **P2** | M4 Input 16px (anti iOS zoom) + label ≥12px | Kecil |
| **P2** | M5 Karyawan header tombol wrap | Kecil |
| **P3** | M6 Viewport eksplisit | Kecil |
| **P3** | M7 Breakpoint card tablet | Kecil |

> Rekomendasi urutan eksekusi: **M1 → M2 → M5 → M3 → M4 → M6**. M7/M8 opsional.
