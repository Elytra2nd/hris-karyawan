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
- **Proxy:** `src/proxy.ts` — Next.js 16 renamed middleware → proxy
- **Deployment:** Local/ngrok

## Design System
- Primary: Astra Blue `oklch(0.379 0.191 264)` (`#1e40af`)
- Lihat `desain.md` untuk detail tokens, chip status, form label patterns

## Folder Structure
```
src/
├── proxy.ts                ← Route guard + rate limiting (Next.js 16 proxy)
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
- **ADMIN:** Full access — CRUD karyawan, manajemen user, lihat audit log
- **VIEWER:** Read-only — hanya bisa lihat data karyawan

## Business Rules
- Setiap karyawan bisa punya banyak kontrak (one-to-many)
- Durasi kontrak: ADMINISTRASI → 3 bulan, semua lainnya → 6 bulan (auto-calculated)
- Status karyawan: `AKTIF` | `NON-AKTIF`
- Semua mutasi tercatat di AuditLog
- Login rate limit: 10 percobaan / 15 menit per IP (in-memory, single instance)

## Coding Conventions
- Server Actions untuk semua mutasi (`'use server'`)
- Validasi di server dengan Zod v4 + `formDataToObject()`
- Actions return `ActionResult<T>` via `ok()/fail()` — atau `throw + redirect()` untuk form navigasi
- Form components (client): wrap `await action()` in try/catch, `toast.error(err.message)` on error
- `revalidatePath()` setelah setiap mutasi
- Error handling: `logger.error()` bukan `console.error()`
- Import `cn()` dari `@/lib/utils`

## Important Notes
- Database: `.env` → `DATABASE_URL` (jangan ubah)
- Prisma: `npx prisma generate` setelah schema berubah, `npx prisma db push` untuk sync
- Zod v4: `parsed.error.issues` (bukan `.errors`), enum: `{ message: 'text' }` bukan `{ errorMap: ... }`
- Proxy: `withAuth` dari `next-auth/middleware` dipakai di `proxy.ts`
