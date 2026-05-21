# HRIS Karyawan — Astra Project Context

## Project Overview
Sistem HRIS (Human Resource Information System) untuk manajemen data karyawan trainee PT Astra International. Dibangun dengan Next.js App Router, Prisma ORM, MySQL, dan shadcn/ui.

## Tech Stack
- **Framework:** Next.js 15 (App Router) dengan TypeScript
- **Database:** MySQL via Prisma ORM
- **Auth:** Custom session-based auth (bukan NextAuth)
- **UI:** shadcn/ui + Tailwind CSS v4
- **Font:** Satoshi
- **Deployment:** Local/ngrok untuk demo

## Database Schema
```
Employee   → data karyawan (ba, baCabang, region, cabang, namaLengkap, status, nik, noKtp, dll.)
Contract   → kontrak trainee (posisi, traineeSejak, traineeSelesai, contractPath)
User       → user sistem (username, password, role: ADMIN | VIEWER)
AuditLog   → audit trail semua perubahan (userId, action, entity, entityId, details)
```

## Folder Structure
```
src/
├── app/
│   ├── (protected)/          ← semua halaman butuh auth
│   │   ├── page.tsx          ← dashboard utama
│   │   ├── karyawan/         ← CRUD karyawan
│   │   │   ├── [id]/edit/    ← edit karyawan
│   │   │   ├── [id]/kontrak/ ← manajemen kontrak
│   │   │   └── tambah/       ← tambah karyawan baru
│   │   └── admin/
│   │       ├── users/        ← manajemen user (ADMIN only)
│   │       └── audit-log/    ← audit trail (ADMIN only)
│   ├── login/                ← halaman login
│   └── actions/              ← Server Actions (employee.ts, user.ts)
├── components/
│   ├── ui/                   ← shadcn components
│   ├── app-sidebar.tsx       ← sidebar navigasi
│   ├── employee-form.tsx     ← form karyawan
│   ├── export-excel-button.tsx
│   └── contract-pdf.tsx
└── lib/
    └── auth.ts               ← session management
```

## Role & Access
- **ADMIN:** Full access — CRUD karyawan, manajemen user, lihat audit log
- **VIEWER:** Read-only — hanya bisa lihat data karyawan

## Business Rules
- Setiap karyawan bisa punya banyak kontrak (one-to-many)
- Status karyawan: `AKTIF` | `TIDAK AKTIF`
- Semua perubahan data tercatat di AuditLog
- File upload: KTP, KK, foto, kontrak PDF disimpan di server
- Export data karyawan ke Excel tersedia

## Coding Conventions
- Gunakan **Server Actions** untuk semua mutasi data (bukan API route)
- Validasi di server side, bukan hanya client
- Gunakan `revalidatePath()` setelah setiap mutasi
- Komponen dengan `"use client"` hanya untuk interaktivitas
- Nama variabel bahasa Indonesia untuk domain bisnis (namaLengkap, bukan fullName)
- Error handling dengan try/catch, return `{ success, error }` object

## Design System
Lihat `desain.md` untuk detail lengkap design tokens, warna, dan komponen.

## Important Notes
- Database connection string ada di `.env` (jangan diubah)
- MySQL case-sensitive untuk nama tabel: gunakan `@@map()` di schema
- Auth session disimpan di cookie, bukan localStorage
- Prisma client harus di-generate ulang setelah schema berubah: `npx prisma generate`
