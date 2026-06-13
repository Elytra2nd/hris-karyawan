import { validateFile } from '@/lib/file-validator';
import { describe, it, expect } from 'vitest';

describe('File Validator Logic', () => {
  it('harus menolak file lebih dari 2MB', () => {
    const largeFile = new File([''], 'big.pdf', { type: 'application/pdf' });
    Object.defineProperty(largeFile, 'size', { value: 3 * 1024 * 1024 }); // 3MB

    const result = validateFile(largeFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('2MB');
  });

  it('harus menerima format PDF dan JPG', () => {
    const pdfFile = new File([''], 'test.pdf', { type: 'application/pdf' });
    const jpgFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    
    expect(validateFile(pdfFile).valid).toBe(true);
    expect(validateFile(jpgFile).valid).toBe(true);
  });

  it('harus menolak format selain PDF/JPG (misal: .exe atau .txt)', () => {
    const exeFile = new File([''], 'virus.exe', { type: 'application/x-msdownload' });
    expect(validateFile(exeFile).valid).toBe(false);
  });
});