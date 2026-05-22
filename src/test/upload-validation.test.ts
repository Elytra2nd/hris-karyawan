import { describe, it, expect } from 'vitest'

const MAX_BYTES = 2 * 1024 * 1024  // 2 MB — matches src/app/actions/upload.ts

const validateUpload = (fileType: string, fileSize: number) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(fileType)) return 'INVALID_TYPE'
  if (fileSize > MAX_BYTES) return 'TOO_LARGE'
  return 'OK'
}

describe('Validasi Keamanan Upload Foto', () => {
  it('harus menolak file selain gambar (contoh: PDF)', () => {
    expect(validateUpload('application/pdf', 500_000)).toBe('INVALID_TYPE')
  })

  it('harus menolak file gambar yang melebihi 2MB', () => {
    expect(validateUpload('image/jpeg', 3 * 1024 * 1024)).toBe('TOO_LARGE')
  })

  it('harus menerima file gambar JPG di bawah 2MB', () => {
    expect(validateUpload('image/jpeg', 1 * 1024 * 1024)).toBe('OK')
  })

  it('harus menerima file WebP di batas 2MB', () => {
    expect(validateUpload('image/webp', MAX_BYTES)).toBe('OK')
  })

  it('harus menolak file persis di atas 2MB', () => {
    expect(validateUpload('image/png', MAX_BYTES + 1)).toBe('TOO_LARGE')
  })
})
