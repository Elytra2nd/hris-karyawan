'use client';

import { useState, useEffect } from 'react';
import { addMonths, format } from 'date-fns';
import { Info } from 'lucide-react';

const F = "'Satoshi', 'Inter', system-ui, sans-serif";

export function EmployeeForm({ action }: { action: (formData: FormData) => void }) {
  const [posisi, setPosisi] = useState<string>('');
  const [tglMulai, setTglMulai] = useState<string>('');
  const [tglSelesai, setTglSelesai] = useState<string>('');

  useEffect(() => {
    if (posisi && tglMulai) {
      const startDate = new Date(tglMulai);
      const monthsToAdd = posisi === 'ADMINISTRASI' ? 3 : 6;
      const endDate = addMonths(startDate, monthsToAdd);
      setTglSelesai(format(endDate, 'yyyy-MM-dd'));
    }
  }, [posisi, tglMulai]);

  return (
    <form action={action} style={{ fontFamily: F }}>
      {/* A. DATA OPERASIONAL */}
      <SectionHeader letter="A" title="Data Operasional" color="#3B82F6" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
        <Field label="BA (Branch Code)" name="ba" placeholder="Contoh: H730" required />
        <Field label="BA Cabang" name="baCabang" placeholder="Contoh: SAMBAS" required />
        <SelectField label="Region" name="region" required options={["PONTIANAK", "KALIMANTAN", "SUMATERA", "JAWA", "SULAWESI", "PAPUA"]} />
        <SelectField label="Cabang" name="cabang" required options={["SAMBAS", "PONTIANAK", "SINGKAWANG", "KETAPANG", "SINTANG", "SAMPIT", "BANJARMASIN"]} />
      </div>

      {/* B. IDENTITAS KARYAWAN */}
      <SectionHeader letter="B" title="Identitas Karyawan" color="#10B981" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
        <Field label="Nama Lengkap (sesuai KTP)" name="namaLengkap" placeholder="Nama lengkap" required />
        <Field label="NIK Karyawan" name="nik" placeholder="Diisi oleh HO" />
        <Field label="No KTP" name="noKtp" placeholder="16 digit" required />
        <Field label="Tanggal Lahir" name="tglLahir" type="date" required />
        <Field label="Nama Ibu Kandung" name="namaIbu" placeholder="Sesuai KTP" required />
        <Field label="No HP / WhatsApp" name="noHp" placeholder="08xxx" required />
        <Field label="No Jamsostek" name="noJamsostek" placeholder="Opsional" />
        <SelectField label="Form Consent" name="formConsent" required options={["ADA", "TIDAK ADA"]} />
      </div>

      {/* C. KONTRAK PERTAMA */}
      <SectionHeader letter="C" title="Kontrak Pertama" color="#F97316" />
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Posisi / Jabatan</label>
        <select name="posisi" required onChange={e => setPosisi(e.target.value)} value={posisi} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Pilih Jabatan</option>
          <option value="SALESMAN">SALESMAN (6 Bulan)</option>
          <option value="ADMINISTRASI">ADMINISTRASI (3 Bulan)</option>
          <option value="SUPERVISOR">SUPERVISOR (6 Bulan)</option>
          <option value="MANAGER">MANAGER (6 Bulan)</option>
          <option value="STAFF IT">STAFF IT (6 Bulan)</option>
          <option value="TEKNISI">TEKNISI (6 Bulan)</option>
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
        <div>
          <label style={labelStyle}>Mulai Kontrak (Trainee Sejak)</label>
          <input name="traineeSejak" type="date" required onChange={e => setTglMulai(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Akhir Kontrak (Otomatis)</label>
          <input name="traineeSelesai" type="date" value={tglSelesai} readOnly required style={{ ...inputStyle, background: '#F1F5F9', color: '#3B82F6', fontWeight: 600 }} />
        </div>
      </div>

      {/* INFO */}
      {posisi && (
        <div style={{ padding: '12px 16px', background: '#EFF6FF', borderRadius: 10, marginBottom: 20, fontSize: 13, color: '#1D4ED8', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Info size={16} color="#3B82F6" />
          <span>Jabatan <strong>{posisi}</strong> otomatis kontrak <strong>{posisi === 'ADMINISTRASI' ? '3' : '6'} bulan</strong> dari tanggal mulai.</span>
        </div>
      )}

      {/* SUBMIT */}
      <button type="submit" style={{
        width: '100%', height: 48, fontSize: 15, fontWeight: 700, color: '#fff',
        background: '#1E293B', border: 'none', borderRadius: 10, cursor: 'pointer',
        fontFamily: F, letterSpacing: '0.02em',
      }}>
        Simpan Data Karyawan
      </button>
    </form>
  );
}

/* ============ FORM COMPONENTS ============ */

function SectionHeader({ letter, title, color }: { letter: string; title: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #F1F5F9' }}>
      <div style={{ width: 24, height: 24, borderRadius: 6, background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{letter}</div>
      <span style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{title}</span>
    </div>
  );
}

function Field({ label, name, placeholder, type = 'text', required }: { label: string; name: string; placeholder?: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label style={labelStyle}>{label} {required && <span style={{ color: '#DC2626' }}>*</span>}</label>
      <input name={name} type={type} placeholder={placeholder} required={required} style={inputStyle} />
    </div>
  );
}

function SelectField({ label, name, required, options }: { label: string; name: string; required?: boolean; options: string[] }) {
  return (
    <div>
      <label style={labelStyle}>{label} {required && <span style={{ color: '#DC2626' }}>*</span>}</label>
      <select name={name} required={required} style={{ ...inputStyle, cursor: 'pointer' }}>
        <option value="">Pilih...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6,
  textTransform: 'uppercase', letterSpacing: '0.03em',
};

const inputStyle: React.CSSProperties = {
  width: '100%', height: 40, padding: '0 12px', fontSize: 14, color: '#1E293B',
  border: '1px solid #E2E8F0', borderRadius: 8, outline: 'none', background: '#fff',
  fontFamily: "'Satoshi', 'Inter', system-ui, sans-serif",
};