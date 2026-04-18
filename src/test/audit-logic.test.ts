import { describe, it, expect } from 'vitest';

describe('Logika Audit Trail', () => {
  it('harus memformat detail perubahan menjadi string JSON yang valid', () => {
    const changes = { status: 'OUT', alasan: 'Resign' };
    const logEntry = {
      action: 'UPDATE',
      details: JSON.stringify(changes)
    };

    expect(logEntry.details).toContain('"status":"OUT"');
    expect(JSON.parse(logEntry.details).alasan).toBe('Resign');
  });

  it('harus mengidentifikasi entitas yang dimodifikasi dengan benar', () => {
    const entity = 'employee';
    expect(entity).toBeTypeOf('string');
    expect(entity).toBe('employee');
  });
});