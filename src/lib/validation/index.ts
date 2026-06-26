import { z } from 'zod'

// ─── Konstanta ────────────────────────────────────────────────────────────────
export const POSISI_VALID = [
  'SALES EXECUTIVE',
  'SALESGIRL',
  'COUNTER SALES',
  'MECHANIC',
  'TEAM LEADER',
  'ADMINISTRATOR',
] as const

export const CABANG_OPTIONS = [
  { code: 'H720', label: 'REGION PONTIANAK' },
  { code: 'H721', label: 'KETAPANG' },
  { code: 'H722', label: 'PATTIMURA' },
  { code: 'H723', label: 'SINGKAWANG' },
  { code: 'H724', label: 'SANGGAU' },
  { code: 'H725', label: 'IMAM BONJOL' },
  { code: 'H726', label: 'NDS.AYANI' },
  { code: 'H727', label: 'BENUA KAYONG' },
  { code: 'H728', label: 'SINTANG' },
  { code: 'H729', label: 'PUTUSSIBAU' },
  { code: 'H730', label: 'SAMBAS' },
] as const

export const CABANG_VALID = ['H720', 'H721', 'H722', 'H723', 'H724', 'H725', 'H726', 'H727', 'H728', 'H729', 'H730'] as const
export const STATUS_VALID = ['AKTIF', 'NON-AKTIF'] as const

// Helper: get label dari kode cabang
export function getCabangLabel(code: string): string {
  return CABANG_OPTIONS.find(c => c.code === code)?.label ?? code
}

// Roles - in ascending privilege order
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
  // Cabang divalidasi terhadap tabel Branch (dinamis), bukan daftar statis.
  // Keberadaan kode cabang dijamin oleh foreign key Employee.cabang -> Branch.code.
  cabang: z.string().min(1, 'Cabang wajib dipilih').max(20),
  namaLengkap: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama terlalu panjang'),
  nik: z.string().max(20).optional().nullable(),
  noKtp: z.string()
    .length(16, 'No KTP harus 16 digit')
    .regex(/^\d+$/, 'No KTP hanya boleh angka'),
  tglLahir: z.string()
    .min(1, 'Tanggal lahir wajib diisi')
    .refine((d) => !isNaN(Date.parse(d)), 'Format tanggal lahir tidak valid'),
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
  departmentId: z.string().min(1).optional().nullable(),
})

// ─── Employee Schema (Update - tanpa posisi + traineeSejak, tambah status) ────
export const updateEmployeeSchema = createEmployeeSchema
  .omit({ posisi: true, traineeSejak: true })
  .extend({
    status: z.enum(STATUS_VALID, { message: 'Status tidak valid' }),
  })

// ─── Contract Schema ──────────────────────────────────────────────────────────
export const createContractSchema = z.object({
  posisi: z.enum(POSISI_VALID, { message: 'Pilih salah satu jabatan yang tersedia' }),
  traineeSejak: z.string()
    .min(1, 'Tanggal mulai kontrak wajib diisi')
    .refine((d) => !isNaN(Date.parse(d)), 'Format tanggal tidak valid — gunakan kalender untuk memilih'),
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

// ─── Department Schema ────────────────────────────────────────────────────────
export const departmentSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  code: z.string().min(1, 'Kode wajib diisi').max(20).regex(/^[A-Z0-9_-]+$/, 'Kode hanya huruf kapital, angka, dan strip'),
})

// ─── Branch Schema ────────────────────────────────────────────────────────────
export const branchSchema = z.object({
  code: z.string().min(1, 'Kode cabang wajib diisi').max(20).regex(/^[A-Z0-9_.-]+$/, 'Kode hanya huruf kapital, angka, titik, dan strip'),
  label: z.string().min(2, 'Nama cabang minimal 2 karakter').max(100),
})

// ─── Change Password Schema ──────────────────────────────────────────────────
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password saat ini wajib diisi'),
  newPassword: z
    .string()
    .min(8, 'Password baru minimal 8 karakter')
    .max(72, 'Password maksimal 72 karakter')
    .regex(/[A-Z]/, 'Password harus mengandung minimal 1 huruf kapital')
    .regex(/[0-9]/, 'Password harus mengandung minimal 1 angka'),
  confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Konfirmasi password tidak cocok',
  path: ['confirmPassword'],
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
