import { describe, it, expect } from 'vitest'
import { hasPermission, PERMISSIONS, type Permission } from '@/lib/permissions'

// Menguji MATRIX ASLI di src/lib/permissions.ts — bukan salinan di file test.
// Guard server (auth-guard.ts) dan gating UI sama-sama membaca matrix ini, jadi
// perubahan tak sengaja di sana akan menjatuhkan test ini.
describe('RBAC — matrix permission', () => {
  it('hanya ADMIN yang boleh mengelola user', () => {
    expect(hasPermission('ADMIN', 'user_manage')).toBe(true)
    for (const role of ['HR_MANAGER', 'HR_STAFF', 'VIEWER']) {
      expect(hasPermission(role, 'user_manage')).toBe(false)
    }
  })

  it('VIEWER hanya boleh membaca data karyawan', () => {
    expect(hasPermission('VIEWER', 'employee_read')).toBe(true)
    const terlarang: Permission[] = [
      'employee_create', 'employee_update', 'employee_delete',
      'contract_create', 'import_data', 'export_data', 'upload_photo',
    ]
    for (const p of terlarang) expect(hasPermission('VIEWER', p)).toBe(false)
  })

  it('HR_STAFF boleh menambah & mengubah, tapi tidak menghapus', () => {
    expect(hasPermission('HR_STAFF', 'employee_create')).toBe(true)
    expect(hasPermission('HR_STAFF', 'employee_update')).toBe(true)
    expect(hasPermission('HR_STAFF', 'employee_delete')).toBe(false)
  })

  it('role tak dikenal, kosong, dan akun terhapus ditolak semua izin', () => {
    for (const role of ['__deleted__', 'SUPERADMIN', '', null, undefined]) {
      for (const p of Object.keys(PERMISSIONS) as Permission[]) {
        expect(hasPermission(role, p)).toBe(false)
      }
    }
  })

  it('semua role di matrix adalah role yang benar-benar ada', () => {
    const dikenal = new Set(['ADMIN', 'HR_MANAGER', 'HR_STAFF', 'VIEWER'])
    for (const roles of Object.values(PERMISSIONS)) {
      for (const r of roles) expect(dikenal.has(r)).toBe(true)
    }
  })
})
