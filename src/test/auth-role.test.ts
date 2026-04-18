import { describe, it, expect } from 'vitest';

// Simulasi logika otorisasi
const checkPermission = (role: string, action: 'CREATE' | 'READ' | 'DELETE') => {
  const permissions: Record<string, string[]> = {
    ADMIN: ['CREATE', 'READ', 'DELETE'],
    VIEWER: ['READ'],
  };
  return permissions[role]?.includes(action) || false;
};

describe('Sistem Otorisasi (RBAC)', () => {
  it('harus mengizinkan ADMIN untuk menghapus data', () => {
    expect(checkPermission('ADMIN', 'DELETE')).toBe(true);
  });

  it('harus menolak VIEWER untuk membuat data baru', () => {
    expect(checkPermission('VIEWER', 'CREATE')).toBe(false);
  });

  it('harus mengizinkan semua role untuk membaca data', () => {
    expect(checkPermission('ADMIN', 'READ')).toBe(true);
    expect(checkPermission('VIEWER', 'READ')).toBe(true);
  });
});