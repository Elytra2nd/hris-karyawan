import { z } from 'zod'

// ─── Konstanta ────────────────────────────────────────────────────────────────
export const POSISI_VALID = ['SALESMAN', 'ADMINISTRASI', 'SUPERVISOR', 'MANAGER', 'STAFF IT', 'TEKNISI'] as const
export const REGION_VALID = ['PONTIANAK', 'KALIMANTAN', 'SUMATERA', 'JAWA', 'SULAWESI', 'PAPUA'] as const
export const CABANG_VALID = ['SAMBAS', 'PONTIANAK', 'SINGKAWANG', 'KETAPANG', 'SINTANG', 'SAMPIT', 'BANJARMASIN'] as const
export const STATUS_VALID = ['AKTIF', 'NON-AKTIF'] as const

// Roles — in ascending privilege order
// VIEWER       : read-only
// HR_STAFF     : add/edit employees, no delete, no user management
// HR_MANAGER   : full employee CRUD + contracts, no user management
// ADMIN        : everything (user management, audit log, departments)
export const ROLE_VALID = ['ADMIN', 'HR_MANAGER', 'HR_STAFF', 'VIEWER'] as const
export type AppRole = (typeof ROLE_VALID)[number]

// ─── Employee Schema (Create) ─────────────────────────────────────────────────
export const createEmployeeSchema = z.object({
  ba: z.string().min(1, 'Kode BA wajib diisi').max(20),
  baCabang: z.string().min(1, 'BA Cabang wajib diisi').max(100),
  region: z.enum(REGION_VALID, { message: 'Region tidak valid' }),
  cabang: z.enum(CABANG_VALID, { message: 'Cabang tidak valid' }),
  namaLengkap: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama terlalu panjang'),
  nik: z.string().max(20).optional().nullable(),
  noKtp: z.string()
    .length(16, 'No KTP harus 16 digit')
    .regex(/^\d+$/, 'No KTP hanya boleh angka'),
  tglLahir: z.string().min(1, 'Tanggal lahir wajib diisi'),
  namaIbu: z.string().min(2, 'Nama ibu minimal 2 karakter').max(100),
  noHp: z.string()
    .min(10, 'No HP minimal 10 digit')
    .max(15, 'No HP maksimal 15 digit')
    .regex(/^08\d+$/, 'No HP harus diawali 08'),
  noJamsostek: z.string().max(30).optional().nullable(),
  formConsent: z.enum(['ADA', 'TIDAK ADA'] as const, { message: 'Form consent tidak valid' }),
  posisi: z.enum(POSISI_VALID, { message: 'Jabatan tidak valid' }),
  traineeSejak: z.string()
    .min(1, 'Tanggal mulai wajib diisi')
    .refine((d) => !isNaN(Date.parse(d)), 'Format tanggal tidak valid'),
})

// ─── Employee Schema (Update — tanpa posisi + traineeSejak, tambah status) ────
export const updateEmployeeSchema = createEmployeeSchema
  .omit({ posisi: true, traineeSejak: true })
  .extend({
    status: z.enum(STATUS_VALID, { message: 'Status tidak valid' }),
  })

// ─── Contract Schema ──────────────────────────────────────────────────────────
export const createContractSchema = z.object({
  posisi: z.enum(POSISI_VALID, { message: 'Jabatan tidak valid' }),
  traineeSejak: z.string()
    .min(1, 'Tanggal mulai wajib diisi')
    .refine((d) => !isNaN(Date.parse(d)), 'Format tanggal tidak valid'),
})

// ─── User Schema ──────────────────────────────────────────────────────────────
export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username minimal 3 karakter')
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh huruf, angka, dan underscore'),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .max(100)
    .regex(/[A-Z]/, 'Password harus mengandung minimal 1 huruf kapital')
    .regex(/[0-9]/, 'Password harus mengandung minimal 1 angka'),
  role: z.enum(ROLE_VALID, { message: 'Role tidak valid' }),
})

// ─── Helper: parse FormData ke plain object ───────────────────────────────────
export function formDataToObject(formData: FormData): Record<string, string | null> {
  const obj: Record<string, string | null> = {}
  formData.forEach((value, key) => {
    const str = value.toString().trim()
    obj[key] = str === '' ? null : str
  })
  return obj
}
