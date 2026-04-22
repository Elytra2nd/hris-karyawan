'use client';

import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

// Registrasi font (opsional, menggunakan standar Helvetica jika tidak diset)
const styles = StyleSheet.create({
  page: { padding: 50, fontFamily: 'Helvetica', fontSize: 11 },
  header: { textAlign: 'center', marginBottom: 20 },
  title: { fontSize: 16, fontWeight: 'bold', textDecoration: 'underline', marginBottom: 5 },
  subTitle: { fontSize: 10, marginBottom: 20 },
  section: { marginBottom: 15 },
  label: { fontWeight: 'bold', marginBottom: 5 },
  row: { flexDirection: 'row', marginBottom: 3 },
  key: { width: 120 },
  value: { flex: 1 },
  bodyText: { textAlign: 'justify', lineHeight: 1.5, marginBottom: 10 },
  signatureArea: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 50 },
  sigBox: { textAlign: 'center', width: 200 },
  sigName: { marginTop: 60, fontWeight: 'bold', textDecoration: 'underline' }
});

export const ContractPDF = ({ employee, contract }: { employee: any, contract: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* KOP SURAT SEDERHANA */}
      <View style={styles.header}>
        <Text style={styles.title}>SURAT PERJANJIAN KERJA (TRAINEE)</Text>
        <Text style={styles.subTitle}>Nomor: {contract.id.substring(0, 8).toUpperCase()}/HRD-MM/{format(new Date(), 'yyyy')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.bodyText}>Yang bertanda tangan di bawah ini:</Text>
        <View style={styles.row}>
          <Text style={styles.key}>Nama Perusahaan</Text>
          <Text style={styles.value}>: PT. MULTI MAKMUR</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.key}>Cabang</Text>
          <Text style={styles.value}>: {employee.cabang} ({employee.ba})</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.bodyText}>Dengan ini memberikan persetujuan kerja kepada:</Text>
        <View style={styles.row}>
          <Text style={styles.key}>Nama Lengkap</Text>
          <Text style={styles.value}>: {employee.namaLengkap.toUpperCase()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.key}>NIK / No. KTP</Text>
          <Text style={styles.value}>: {employee.nik || '-'} / {employee.noKtp}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.key}>Jabatan</Text>
          <Text style={styles.value}>: {contract.posisi}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.bodyText}>
          Bahwa pihak kedua bersedia menjalankan masa Trainee terhitung sejak tanggal {format(new Date(contract.traineeSejak), 'dd MMMM yyyy', { locale: id })} sampai dengan {format(new Date(contract.traineeSelesai), 'dd MMMM yyyy', { locale: id })} sesuai dengan aturan yang berlaku di Astra Motor Kalimantan Barat.
        </Text>
      </View>

      {/* TANDA TANGAN */}
      <View style={styles.signatureArea}>
        <View style={styles.sigBox}>
          <Text>Pihak Pertama,</Text>
          <Text style={{ fontSize: 9, marginTop: 2 }}>(Astra Motor Kalimantan Barat)</Text>
          <Text style={styles.sigName}>Pimpinan Cabang</Text>
        </View>
        <View style={styles.sigBox}>
          <Text>Pihak Kedua,</Text>
          <Text style={{ fontSize: 9, marginTop: 2 }}>(Karyawan)</Text>
          <Text style={styles.sigName}>{employee.namaLengkap.toUpperCase()}</Text>
        </View>
      </View>
    </Page>
  </Document>
);