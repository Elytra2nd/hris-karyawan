# HRIS Karyawan — Astra Project Context

## Project Overview
Sistem HRIS untuk manajemen data karyawan trainee PT Astra Motor Kalimantan Barat. Dibangun dengan Next.js App Router, Prisma ORM, MySQL/MariaDB, shadcn/ui.

## Tech Stack
- **Framework:** Next.js 16 (App Router, Turbopack) dengan TypeScript
- **Database:** MariaDB via Prisma 7.x (`@prisma/adapter-mariadb`)
- **Auth:** NextAuth v4 (CredentialsProvider, JWT strategy, 8-jam session)
- **Validation:** Zod v4 — gunakan `.issues` (bukan `.errors`), `{ message: '' }` untuk enum errors
- **UI:** shadcn/ui + COSS UI primitives (Cal.com) + Tailwind CSS v4
- **COSS primitives in use:** Combobox (searchable select), Calendar+Popover (date picker), Pagination, Drawer, Spinner. Install via `npx shadcn@latest add @coss/<name>`
- **Charts:** Recharts v3 (sudah terpasang, dipakai di dashboard)
- **Font:** Satoshi (via `@font-face` di globals.css)
- **Deployment:** Local/ngrok

## Auth Boundary (PENTING)
Tidak ada middleware/proxy global. Otorisasi ditegakkan di dua lapis:
1. **Navigasi halaman:** `(protected)/layout.tsx` memanggil `verifySession()` → redirect `/login` bila belum login. Tiap halaman admin cek role sendiri (`hasPermission`/`session.role`).
2. **Server Actions:** SETIAP action (termasuk read seperti `getEmployees`, `getContracts`) WAJIB memanggil guard (`requireAuth`/`requirePermission`/`requireAdmin`) di baris pertama. Action = endpoint publik; tanpa guard = kebocoran data walau halaman terlindungi.

## Design System
- Primary: Astra Blue `oklch(0.379 0.191 264)` (`#1e40af`)
- Lihat `desain.md` untuk detail tokens, chip status, form label patterns

## Folder Structure
```
src/
├── app/
│   ├── (protected)/        ← halaman butuh auth (dilindungi proxy.ts)
│   │   ├── page.tsx        ← dashboard (charts, alerts, stats)
│   │   ├── karyawan/       ← CRUD karyawan
│   │   └── admin/          ← users + audit-log (ADMIN only)
│   ├── login/              ← halaman login
│   └── actions/            ← Server Actions (employee.ts, user.ts)
├── components/
│   ├── ui/                 ← shadcn components
│   ├── app-sidebar.tsx
│   ├── employee-form.tsx   ← form tambah karyawan (toast.error on throw)
│   ├── edit-karyawan-form.tsx
│   ├── contract-form.tsx
│   ├── contract-list.tsx
│   ├── employee-chart.tsx  ← bar chart posisi (Recharts client component)
│   ├── contract-status-chart.tsx ← donut chart status kontrak
│   └── export-excel-button.tsx
└── lib/
    ├── validation/index.ts ← Zod v4 schemas
    ├── result.ts           ← ActionResult<T> type (ok/fail helpers)
    ├── auth-guard.ts       ← requireAdmin() — throws if not ADMIN
    ├── logger.ts           ← structured logger (JSON in prod)
    ├── audit.ts            ← createAuditLog()
    ├── dal.ts              ← verifySession() — server-only
    └── auth.ts             ← NextAuth authOptions
```

## Role & Access
- **ADMIN:** Full access — CRUD karyawan, manajemen user, audit log, departments
- **HR_MANAGER:** CRUD karyawan + kontrak, lihat audit log, export/import. Tidak bisa manajemen user.
- **HR_STAFF:** Tambah & edit karyawan, buat kontrak, upload foto. Tidak bisa delete atau manajemen user.
- **VIEWER:** Read-only — hanya bisa lihat data karyawan

Permission matrix lengkap: `src/lib/auth-guard.ts` (PERMISSIONS object)

## Business Rules
- Setiap karyawan bisa punya banyak kontrak (one-to-many)
- Durasi kontrak: ADMINISTRASI → 3 bulan, semua lainnya → 6 bulan (auto-calculated)
- Status karyawan: `AKTIF` | `NON-AKTIF`
- **Soft delete:** `deleteEmployee` menandai `Employee.deletedAt` (bukan hapus permanen). Semua query list/stats/detail WAJIB filter `deletedAt: null`. Arsip dipulihkan via `restoreEmployee`; hard delete (`permanentlyDeleteEmployee`) hanya ADMIN & hanya untuk data yang sudah diarsipkan. Halaman: `/karyawan/arsip`. Re-import KTP yang terarsip otomatis memulihkannya.
- **Aksi massal:** `bulkArchiveEmployees` & `bulkUpdateEmployeeStatus` (`employee.ts`) pakai `updateMany` dengan guard `deletedAt: null` (tak menyentuh data terarsip), dibatasi `MAX_BULK=500`. UI: checkbox per-halaman di tabel karyawan + `BulkActionBar`; seleksi di-reset saat ganti halaman/filter.
- Semua mutasi tercatat di AuditLog
- Login rate limit: 10 percobaan / 15 menit — per-IP DAN per-username (in-memory, single instance)

## Coding Conventions
- Server Actions untuk semua mutasi (`'use server'`)
- Validasi di server dengan Zod v4 + `formDataToObject()`
- Actions return `ActionResult<T>` via `ok()/fail()` — atau `throw + redirect()` untuk form navigasi
- Form components (client): wrap `await action()` in try/catch, `toast.error(err.message)` on error
- `revalidatePath()` setelah setiap mutasi
- Error handling: `logger.error()` bukan `console.error()`
- Import `cn()` dari `@/lib/utils`

## Important Notes
- Database: `.env` → variabel `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (lihat `src/lib/prisma.ts`). Bukan `DATABASE_URL`.
- Prisma: `postinstall` otomatis jalankan `prisma generate`. Jalankan manual kalau schema berubah tanpa `npm install`. `npx prisma db push` untuk sync schema ke DB.
- Lint: `npm run lint` = `eslint src`. Test: `npm test`. Typecheck: `npx tsc --noEmit`.
- Zod v4: `parsed.error.issues` (bukan `.errors`), enum: `{ message: 'text' }` bukan `{ errorMap: ... }`
- Rate limit login: per-IP + per-username, 10/15mnt (`auth.ts`, in-memory single-instance)
- JWT role di-refresh dari DB tiap 5 menit; akun dihapus ditandai role `__deleted__` (ditolak `requireAuth`)
