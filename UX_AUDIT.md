# UX Audit — HRIS Karyawan

Audit detail UX yang kelewat / belum optimal di seluruh aplikasi.
Tanggal audit: 2026-05-25

---

## SUDAH DIPERBAIKI (Sprint UX-5.5)

### Dashboard → Filter Karyawan
- [x] **Alert banner 14 hari** → kini link ke `/karyawan?filter=expiring14`
- [x] **Alert banner 30 hari** → kini link ke `/karyawan?filter=expiring30`
- [x] **"Lihat semua X kontrak"** → kini link ke `/karyawan?filter=expiring90`
- [x] **Stat card "Total Trainee"** → clickable, ke `/karyawan`
- [x] **Stat card "Aktif"** → clickable, ke `/karyawan?status=AKTIF`
- [x] **Stat card "Kontrak ≤ 30 hari"** → clickable, ke `/karyawan?filter=expiring30`
- [x] **Stat card "Non-Aktif"** → clickable, ke `/karyawan?status=NON-AKTIF`
- [x] **Notification bell "Lihat semua"** → kini link ke `/karyawan?filter=expiring90`
- [x] **Filter banner** muncul di halaman karyawan saat filter aktif (dengan tombol "Hapus Filter")

---

## PRIORITAS TINGGI (Workflow Gaps)

### 1. Dashboard → Drill-Down Belum Lengkap

#### 1.1 Tabel "Sebaran Cabang" tidak clickable
- **File:** `src/app/(protected)/page.tsx:358-387`
- **Masalah:** Row tabel pakai `hover:bg-muted/50` tapi tidak ada `href`/`onClick`
- **Fix:** Bungkus dengan `<Link href={`/karyawan?cabang=${ba.baCabang}`}>` agar user bisa drill-down ke karyawan per cabang

#### 1.2 Chart "Distribusi Posisi" dan "Sebaran Cabang" tidak interaktif
- **File:** `src/app/(protected)/page.tsx:287-300, 303-332`
- **Masalah:** Klik bar/segment tidak filter karyawan
- **Fix:** Tambahkan `onClick` ke chart Recharts untuk navigate ke list dengan filter

### 2. Karyawan List → Status Chip Tidak Filter

#### 2.1 Status chip tidak clickable
- **File:** `src/app/(protected)/karyawan/page.tsx:198-228`
- **Masalah:** Chip "Aktif" / "Segera Habis" / "Expired" hanya visual
- **Fix:** `onClick={() => updateParams({ filter: status })}` agar auto-filter

#### 2.2 Stat cards di halaman karyawan tidak clickable
- **File:** `src/app/(protected)/karyawan/page.tsx:254-282`
- **Masalah:** StatCard component tidak menerima href
- **Fix:** Update `StatCard` untuk support `href` prop, wrap dengan Link

### 3. Karyawan Detail → Kontrak Empty State

#### 3.1 Empty state tanpa CTA button
- **File:** `src/components/contract-list.tsx:26-42`
- **Masalah:** Hanya teks "Tambahkan kontrak pertama karyawan ini" tanpa tombol
- **Fix:** Tambahkan `<Button asChild><Link href={`/karyawan/${employee.id}/kontrak`}>Buat Kontrak Pertama</Link></Button>`

#### 3.2 Tidak ada quick-action "Perpanjang Kontrak"
- **File:** `src/components/contract-list.tsx` (kontrak yang masih running)
- **Masalah:** Untuk kontrak yang segera habis, user harus navigate manual ke /kontrak
- **Fix:** Tambah dropdown action di tiap row: "Perpanjang", "Hentikan", "Lihat PDF"

---

## PRIORITAS MENENGAH (Admin Pages)

### 4. Admin → Audit Log

#### 4.1 Tidak ada search/filter UI
- **File:** `src/app/(protected)/admin/audit-log/page.tsx:1-242`
- **Masalah:** 200 logs tanpa pencarian — tidak bisa cari aktivitas user tertentu
- **Fix:** Tambah search input + filter action (CREATE/UPDATE/DELETE) + filter entity + date range

#### 4.2 Tidak ada pagination
- **File:** `src/app/(protected)/admin/audit-log/page.tsx`
- **Masalah:** Semua log dimuat sekaligus (max 200 dari DB tapi tetap berat)
- **Fix:** Server-side pagination dengan `?page=` & `?limit=`

#### 4.3 Filter state tidak persist di URL
- **File:** `src/app/(protected)/admin/audit-log/page.tsx:14-17`
- **Masalah:** Refresh = state hilang
- **Fix:** Pakai `useSearchParams` pattern seperti `karyawan/page.tsx`

### 5. Admin → Users

#### 5.1 Stat cards Total/Admin/Pemirsa tidak clickable
- **File:** `src/app/(protected)/admin/users/page.tsx:47-77`
- **Masalah:** Tidak bisa drill-down ke user dengan role tertentu
- **Fix:** `<Link href="/admin/users?role=ADMIN">` wrap stat card

#### 5.2 Tidak ada search user
- **File:** `src/app/(protected)/admin/users/page.tsx:88-174`
- **Masalah:** Cari user harus visual scan
- **Fix:** Tambah search input by username + filter dropdown by role

### 6. Admin → Departments

#### 6.1 Tidak bisa edit department
- **File:** `src/components/department-manager.tsx:95-110`
- **Masalah:** Hanya tombol delete; tidak bisa rename
- **Fix:** Tambah tombol Edit (icon Pencil) + modal/inline edit

#### 6.2 Delete tidak warning kalau dept punya karyawan
- **File:** `src/components/department-manager.tsx:55-70`
- **Masalah:** Bisa delete dept yang in-use tanpa peringatan
- **Fix:** Query count karyawan dulu; tampilkan "X karyawan tergabung" sebelum confirm

#### 6.3 Create dept pakai window.location.reload()
- **File:** `src/components/department-manager.tsx:43-44`
- **Masalah:** Full page reload — jarring UX, context hilang
- **Fix:** Optimistic update — `setDepts(prev => [...prev, newDept])` lalu revalidatePath

#### 6.4 Tidak ada search department
- **File:** `src/components/department-manager.tsx:72-110`
- **Masalah:** List panjang harus scroll manual
- **Fix:** Tambah search input client-side filter by name/code

---

## PRIORITAS RENDAH (Polish)

### 7. Form UX

#### 7.1 Form tidak validate on blur
- **File:** `src/components/employee-form.tsx`, `edit-karyawan-form.tsx`
- **Masalah:** Validation hanya saat submit — NIK/tanggal salah baru kelihatan setelah submit
- **Fix:** Tambah `onBlur` validation untuk critical fields (NIK, tanggal lahir)

#### 7.2 Edit form tidak indicate unsaved changes
- **File:** `src/components/edit-karyawan-form.tsx`
- **Masalah:** User bisa klik away tanpa peringatan
- **Fix:** Track form dirty state; tombol "Simpan" disabled sampai ada perubahan; warning before navigate

#### 7.3 Status change tidak konfirmasi
- **File:** `src/components/edit-karyawan-form.tsx` (field status)
- **Masalah:** Ubah karyawan ke "NON-AKTIF" langsung tanpa konfirmasi
- **Fix:** AlertDialog konfirmasi: "Yakin set non-aktif? Aksi ini menghentikan tracking kontrak."

### 8. Navigation

#### 8.1 Back button hilangkan filter context
- **File:** `src/app/(protected)/karyawan/[id]/page.tsx:60-71`
- **Masalah:** User dari `?filter=expiring90` → klik karyawan → back = filter hilang
- **Fix:** Pakai `router.back()` instead of `<Link href="/karyawan">`, atau simpan filter di sessionStorage

#### 8.2 Breadcrumb di /kontrak page tidak lengkap
- **File:** `src/app/(protected)/karyawan/[id]/kontrak/page.tsx:37-46`
- **Masalah:** Breadcrumb hanya ke employee detail, tidak ke /karyawan
- **Fix:** Full breadcrumb: Dashboard › Karyawan › [Nama] › Kelola Kontrak

### 9. Notifications

#### 9.1 Notification bell tidak ada search
- **File:** `src/components/notification-bell.tsx:80-127`
- **Masalah:** Banyak kontrak → susah cari karyawan tertentu
- **Fix:** Tambah search input di atas list (client-side filter by namaLengkap)

#### 9.2 Notification tidak ada "Mark as Read"
- **File:** `src/components/notification-bell.tsx`
- **Masalah:** Notifikasi yang sama muncul terus tiap visit
- **Fix:** Tambah state read/unread di backend; badge count hanya unread

### 10. Toast/Feedback

#### 10.1 Contract form tidak ada success toast
- **File:** `src/components/contract-form.tsx:40-50`
- **Masalah:** Error → toast.error; sukses → redirect tanpa konfirmasi
- **Fix:** `toast.success('Kontrak berhasil dibuat')` sebelum redirect

#### 10.2 Image upload feedback tidak konsisten dengan form lain
- **File:** `src/components/image-upload.tsx`
- **Masalah:** Sudah pakai toast tapi tidak ada progress indicator untuk file besar
- **Fix:** Tambah progress bar atau spinner overlay yang lebih jelas

---

## METRIK IMPLEMENTASI

| Kategori | Total | Selesai | Tersisa |
|----------|-------|---------|---------|
| Workflow Gaps (Prioritas Tinggi) | 7 | 2 | 5 |
| Admin Pages (Menengah) | 9 | 0 | 9 |
| Form/Nav/Toast (Polish) | 9 | 0 | 9 |
| **TOTAL** | **25** | **2** | **23** |

---

## REKOMENDASI SPRINT BERIKUTNYA

**Sprint UX-6 (Drill-Down & Filter):** 
- Status chip clickable
- Tabel sebaran cabang clickable
- Chart interaktif
- Back button preserve filter

**Sprint UX-7 (Admin Robustness):**
- Audit log search + pagination
- User management search & filter
- Department edit + warning before delete

**Sprint UX-8 (Form Polish):**
- onBlur validation
- Unsaved changes warning
- Confirmation dialog untuk destructive action
- Konsistensi toast feedback
