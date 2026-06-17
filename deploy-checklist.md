# Panduan Deployment HRIS Karyawan ke cPanel Jagoan Hosting

Dokumen ini berisi panduan langkah demi langkah untuk melakukan deployment aplikasi **Next.js 16** (TMS) ke paket **SUPERSTAR Jagoan Hosting** menggunakan domain: **http://astratraineemonitoringsystem.com** (Direkomendasikan redirect ke **https://astratraineemonitoringsystem.com**).

---

## Ringkasan Alur Deployment

```mermaid
graph TD
    A[Build Aplikasi di Lokal] --> B[Zip File Proyek Tanpa node_modules]
    B --> C[Setup Database & User di cPanel]
    C --> D[Setup Node.js App di cPanel]
    D --> E[Upload & Extract ZIP di File Manager]
    E --> F[Setup Environment Variables]
    F --> G[Install & Migrasi Database di Terminal cPanel]
    G --> H[Restart Node.js App & Verifikasi]
```

---

## Langkah 1: Build Aplikasi di Lokal (Komputer Anda)

RAM paket SUPERSTAR adalah 1 GB. Membangun (*build*) Next.js membutuhkan memori 500MB - 1.5GB, sehingga **WAJIB di-build di komputer lokal Anda** untuk menghindari server crash/hang.

1. Buka Terminal lokal di folder `hris-karyawan`.
2. Jalankan perintah build:
   ```bash
   npm run build
   ```
3. Pastikan proses build selesai tanpa error dan menghasilkan folder `.next/`.

---

## Langkah 2: Buat Archive ZIP Proyek Anda

Buat file ZIP berisi file dan folder proyek Anda **TANPA** folder `node_modules` dan folder `.git` (untuk menghemat space upload).

Pilihlah file/folder berikut untuk di-ZIP:
* `.next/` (Hasil build dari Langkah 1)
* `prisma/` (Berisi `schema.prisma` dan folder migrations/seeds)
* `public/` (Asset statis gambar, logo, dll)
* `src/` (Source code lengkap, diperlukan untuk Dynamic Server Actions Next.js)
* `server.js` (Custom server entry point untuk cPanel)
* `package.json`
* `package-lock.json`
* `next.config.ts` (atau `.mjs` jika ada)
* `tsconfig.json`
* `prisma.config.ts`

*Catatan: Beri nama file ZIP tersebut, misal `deploy-hris.zip`.*

---

## Langkah 3: Setup Database MySQL di cPanel

1. Login ke cPanel Jagoan Hosting Anda.
2. Cari menu **Databases** → klik **MySQL® Databases**.
3. **Buat Database Baru:**
   * Masukkan nama database, misalnya: `astra_hris` (nama lengkap menjadi `cpaneluser_astra_hris`).
   * Klik **Create Database**.
4. **Buat User Database Baru:**
   * Di bagian *MySQL Users*, masukkan username, misalnya: `astra_user` (nama lengkap menjadi `cpaneluser_astra_user`).
   * Masukkan password yang kuat dan aman. Catat username dan password ini.
   * Klik **Create User**.
5. **Hubungkan User ke Database:**
   * Di bagian *Add User To Database*, pilih User dan Database yang baru saja dibuat.
   * Klik **Add**.
   * Centang **ALL PRIVILEGES** dan klik **Make Changes**.

---

## Langkah 4: Setup Node.js App di cPanel

1. Di halaman utama cPanel, cari menu **Software** → klik **Setup Node.js App**.
2. Klik tombol **Create Application**.
3. Isi kolom sebagai berikut:
   * **Node.js version**: Pilih versi **22.x** (atau versi tertinggi yang tersedia seperti **20.x** jika 22 belum didukung).
   * **Application mode**: Pilih **Production**.
   * **Application root**: Isi dengan folder root tempat Anda meng-upload file nanti, misal: `hris-karyawan`.
   * **Application URL**: Pilih domain utama `astratraineemonitoringsystem.com`.
   * **Application startup file**: Isi dengan `server.js`.
4. Klik **Create** di pojok kanan atas.
5. Setelah aplikasi dibuat, akan muncul perintah **"Enter to the virtual environment"** di bagian atas (seperti: `source /home/username/nodevenv/hris-karyawan/...`). **Salin/copy teks perintah tersebut**.

---

## Langkah 5: Upload dan Ekstrak File ZIP

1. Masuk ke **cPanel → File Manager**.
2. Masuk ke direktori yang Anda tentukan di *Application root* (misal: `/home/username/hris-karyawan/`).
3. Jika ada file bawaan cPanel di dalam folder tersebut, hapus saja.
4. Klik **Upload**, lalu pilih file `deploy-hris.zip` yang Anda buat pada Langkah 2.
5. Setelah proses upload selesai, kembali ke File Manager, klik kanan pada file ZIP tersebut, lalu pilih **Extract**.

---

## Langkah 6: Konfigurasi Environment Variables di cPanel

Kembali ke menu **Setup Node.js App** → klik tombol **Edit** (ikon pensil) pada aplikasi Anda.
Scroll ke bawah ke bagian **Environment variables**, lalu klik **Add Variable** satu per satu untuk menambahkan konfigurasi berikut:

| Nama Variable | Nilai / Value |
|---|---|
| `DATABASE_URL` | `mysql://cpaneluser_astra_user:PASSWORD_ANDA@localhost:3306/cpaneluser_astra_hris` |
| `DB_HOST` | `localhost` |
| `DB_PORT` | `3306` |
| `DB_USER` | `cpaneluser_astra_user` |
| `DB_PASSWORD` | `PASSWORD_ANDA` |
| `DB_NAME` | `cpaneluser_astra_hris` |
| `NEXTAUTH_SECRET` | *(Buat string acak yang kuat, misal: `AstraTMSSuperSecretKey2026!`)* |
| `NEXTAUTH_URL` | `https://astratraineemonitoringsystem.com` |
| `NODE_ENV` | `production` |

*Tips: Jangan lupa klik **Save** setelah menambahkan variabel.*

---

## Langkah 7: Install Dependencies dan Inisialisasi Database

1. Buka menu **Advanced** di cPanel utama → klik **Terminal**.
2. Paste perintah **Virtual Environment** yang Anda salin dari Langkah 4, lalu tekan **Enter**.
3. Berpindah ke direktori proyek:
   ```bash
   cd ~/hris-karyawan
   ```
4. Install dependencies (hanya menginstall dependencies production untuk menghemat RAM dan storage):
   ```bash
   npm install --production
   ```
5. Generate Prisma Client khusus untuk server production:
   ```bash
   npx prisma generate
   ```
6. Dorong skema database ke database cPanel yang baru:
   ```bash
   npx prisma db push
   ```
7. Jalankan data seed untuk memasukkan data awal (User Admin, data cabang, dan departemen):
   ```bash
   npx tsx prisma/seed.ts
   ```

---

## Langkah 8: Buat Folder Upload Dokumen

Buat direktori privat agar folder upload memiliki permission yang tepat sehingga Next.js bisa menulis file foto/dokumen biner secara aman.

Di dalam **Terminal cPanel** (yang masih dalam virtual environment & folder `~/hris-karyawan`), jalankan:
```bash
mkdir -p private_uploads/profiles
mkdir -p private_uploads/documents
chmod 755 private_uploads
```

---

## Langkah 9: Restart dan Verifikasi Website

1. Kembali ke halaman **Setup Node.js App** di cPanel.
2. Klik tombol **Restart** pada aplikasi Anda untuk memuat ulang environment variables dan perubahan server baru.
3. Buka browser dan kunjungi: **https://astratraineemonitoringsystem.com**
4. Test login menggunakan akun Admin bawaan:
   * **Username**: `admin` (atau sesuai konfigurasi seed file Anda)
   * **Password**: *(sesuai password seed)*
5. Lakukan uji coba fitur:
   * Tambah & edit karyawan
   * Upload foto profil karyawan (pastikan biner terupload dan tampil)
   * Upload file KTP / KK / dokumen kontrak
   * Export excel
