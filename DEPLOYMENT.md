# Panduan Deployment Pertama Kali - HRIS Karyawan
**Trainee Monitoring System (TMS) — Astra Motor Kalbar**

Dokumen ini berisi panduan lengkap untuk melakukan deployment pertama kali maupun pembaruan (*update*) aplikasi HRIS Karyawan ke server **cPanel Jagoan Hosting** (Paket SUPERSTAR, 1GB RAM) dengan domain **https://astratraineemonitoringsystem.com**.

---

## 🏛️ Ringkasan Alur Deployment

```mermaid
graph TD
    A[Build Aplikasi di Lokal] --> B[ZIP File Proyek tanpa node_modules & .env]
    B --> C[Setup Database & User di cPanel]
    C --> D[Setup Node.js App di cPanel]
    D --> E[Upload & Extract ZIP di File Manager]
    E --> F[Inisialisasi Database & Seeding]
    F --> G[Setup Folder private_uploads]
    G --> H[Restart Node.js App & Verifikasi]
```

---

## 💻 Langkah 1: Persiapan & Build di Lokal (Komputer Anda)

Karena RAM server hosting terbatas (1 GB), proses *compiling/building* Next.js **wajib** dilakukan di komputer lokal Anda untuk menghindari kehabisan memori (*out of memory / hang*) di server hosting.

1. Buka terminal di folder root project `hris-karyawan`.
2. Jalankan build produksi menggunakan Webpack (bukan Turbopack):
   ```bash
   npm run build
   ```
   *Catatan: Script ini akan menjalankan `next build --webpack` untuk menghasilkan kompilasi yang stabil bagi server hosting.*
3. Pastikan folder `.next/` berhasil dibuat di lokal Anda tanpa adanya pesan error.

---

## 📦 Langkah 2: Membuat Archive ZIP untuk Upload

Buat file archive ZIP (misal: `deploy-hris.zip`) yang berisi file-file proyek Anda. 

> [!WARNING]
> * **JANGAN** memasukkan folder `node_modules` atau folder `.git` karena ukurannya sangat besar.
> * **JANGAN** memasukkan file `.env` lokal Anda ke dalam ZIP agar tidak menimpa kredensial database asli milik server cPanel saat di-ekstrak nanti.

**Daftar file/folder yang WAJIB dimasukkan ke dalam ZIP:**
* `.next/` (Hasil build dari Langkah 1)
* `prisma/` (Skema database & seeding)
* `public/` (Asset statis gambar & ikon)
* `src/` (Source code lengkap, dibutuhkan untuk Server Actions Next.js)
* `server.js` (Entry point server untuk cPanel)
* `package.json` & `package-lock.json`
* Config files (`next.config.ts`, `tsconfig.json`, `tailwind.config.ts` / `postcss.config.mjs`)

---

## 🗄️ Langkah 3: Setup Database MySQL di cPanel

1. Login ke cPanel Jagoan Hosting Anda.
2. Cari menu **Databases** → klik **MySQL® Databases**.
3. **Buat Database Baru**:
   * Masukkan nama database, contoh: `astra_hris` (nama akhir akan menjadi `usernamecpanel_astra_hris`).
4. **Buat User Database**:
   * Di bagian *MySQL Users*, buat user baru (contoh: `astra_user` / `usernamecpanel_astra_user`).
   * Buat password yang kuat dan aman. **Catat password ini**.
5. **Hubungkan User ke Database**:
   * Di bagian *Add User To Database*, hubungkan user ke database tersebut.
   * Centang **ALL PRIVILEGES** dan simpan perubahan.

---

## 🚀 Langkah 4: Setup Node.js App di cPanel

1. Di dashboard cPanel, cari menu **Software** → klik **Setup Node.js App**.
2. Klik tombol **Create Application** dan isi konfigurasi berikut:
   * **Node.js version**: Pilih versi **22.x** (atau versi tertinggi yang tersedia).
   * **Application mode**: Pilih **Production**.
   * **Application root**: Isi dengan folder root aplikasi Anda, misal: `hris-karyawan`.
   * **Application URL**: Pilih domain utama `astratraineemonitoringsystem.com` (pastikan menggunakan protokol `https://`).
   * **Application startup file**: Isi dengan `server.js`.
3. Klik **Create** di pojok kanan atas.
4. Setelah berhasil dibuat, salin perintah **Virtual Environment** yang muncul di bagian atas halaman (contoh: `source /home/astratra/nodevenv/...`).

---

## 📂 Langkah 5: Upload & Extract File ZIP

1. Masuk ke **cPanel → File Manager**.
2. Buka folder aplikasi Anda (`/home/astratra/hris-karyawan`).
3. Hapus file-file bawaan cPanel yang tidak digunakan di dalam folder tersebut.
4. Klik **Upload**, lalu pilih file `deploy-hris.zip` yang telah Anda buat di Langkah 2.
5. Setelah selesai upload, kembali ke File Manager, klik kanan pada file ZIP tersebut, lalu pilih **Extract**.

---

## ⚙️ Langkah 6: Konfigurasi Environment Variables

Buka kembali menu **Setup Node.js App** → pilih aplikasi Anda dan klik tombol **Edit** (ikon pensil). Gulir ke bawah ke bagian **Environment variables**, lalu klik **Add Variable** satu per satu:

| Nama Variable | Nilai / Value | Keterangan |
|---|---|---|
| `DATABASE_URL` | `mysql://user_db:password_db@localhost:3306/nama_db` | URL koneksi MariaDB cPanel Anda |
| `DB_HOST` | `localhost` | Host database (cPanel umumnya `localhost`) |
| `DB_PORT` | `3306` | Port default MySQL/MariaDB |
| `DB_USER` | `usernamecpanel_astra_user` | User database cPanel Anda |
| `DB_PASSWORD` | `PASSWORD_DATABASE_ANDA` | Password database cPanel Anda |
| `DB_NAME` | `usernamecpanel_astra_hris` | Nama database cPanel Anda |
| `NEXTAUTH_SECRET` | *(String acak panjang, misal: `AstraTMSSuperSecretKey2026!`)* | Secret key enkripsi token NextAuth |
| `NEXTAUTH_URL` | `https://astratraineemonitoringsystem.com` | URL domain utama website (wajib HTTPS) |
| `NODE_ENV` | `production` | Mode jalannya aplikasi |

> [!IMPORTANT]
> **Hindari Konflik File `.env.production`**:
> Next.js memiliki aturan prioritas pemuatan file environment. Jika di folder server terdapat file `.env.production` yang berisi data *placeholder* (default/belum diubah), Next.js akan mendahulukan nilai tersebut daripada variabel di menu cPanel atau file `.env`. 
> **Solusi terbaik**: Hapus atau ubah nama file `.env.production` di server (misal menjadi `.env.production.bak`) agar Next.js membaca file `.env` utama atau environment cPanel secara bersih.

---

## 💻 Langkah 7: Install Dependencies & Jalankan Seeding

1. Buka **Terminal cPanel** (bisa ditemukan di menu *Advanced* dashboard utama cPanel).
2. Tempelkan perintah **Virtual Environment** yang Anda salin pada Langkah 4, lalu tekan Enter:
   ```bash
   source /home/astratra/nodevenv/hris-karyawan/24/bin/activate && cd /home/astratra/hris-karyawan
   ```
3. Pasang semua pustaka dependency produksi (tanpa development tools untuk menghemat ruang disk):
   ```bash
   npm install --production --ignore-scripts
   ```
4. Generate Prisma Client khusus untuk server:
   ```bash
   npx prisma generate
   ```
5. Sinkronkan skema database ke database cPanel Anda:
   ```bash
   npx prisma db push
   ```
6. Masukkan data dummy awal dan akun admin utama:
   ```bash
   npx tsx --env-file=.env prisma/seed.ts
   ```
   *Catatan: Akun admin default yang terbuat adalah:*
   * *Username*: `admin`
   * *Password*: `admin123`

---

## 📁 Langkah 8: Setup Folder Upload Dokumen

Di dalam **Terminal cPanel** yang sama, buat direktori privat untuk penyimpanan file foto profil dan dokumen kontrak karyawan agar aplikasi Next.js memiliki izin menulis biner secara aman:

```bash
mkdir -p private_uploads/profiles
mkdir -p private_uploads/documents
chmod 755 private_uploads
```

---

## 🔄 Langkah 9: Restart & Verifikasi Aplikasi

1. Buka kembali halaman **Setup Node.js App** di cPanel, lalu klik tombol **Restart** pada aplikasi Anda.
   *(Atau lewat Terminal cPanel, jalankan perintah: `touch tmp/restart.txt`)*.
2. Buka browser Anda dan akses **https://astratraineemonitoringsystem.com**.
3. Coba login menggunakan kredensial default admin:
   * **Username**: `admin`
   * **Password**: `admin123`
4. Lakukan verifikasi fungsionalitas aplikasi:
   * Tambah & edit karyawan
   * Coba upload foto profil (pastikan tersimpan dan muncul gambarnya)
   * Uji coba export data excel

---

## 🛠️ Panduan Troubleshooting Cepat

### 1. Stuck di Halaman Login / Error 401 (Unauthorized) di Console
* **Penyebab**: 
  * `NEXTAUTH_URL` salah konfigurasi atau file `.env` di-overwrite oleh kredensial lokal.
  * Terdapat konflik file `.env.production` di server yang menimpa konfigurasi database asli di `.env`. NextAuth mendeteksi kegagalan koneksi database ini lalu mengembalikan status `401 Unauthorized` ke browser.
* **Solusi**:
  1. Hapus atau ganti nama file `.env.production` di server menjadi `.env.production.bak` lewat File Manager cPanel.
  2. Periksa kembali isi file `.env` server, pastikan database dan `NEXTAUTH_URL` berisi domain asli Anda (`https://astratraineemonitoringsystem.com`).
  3. Lakukan restart aplikasi dengan perintah `touch tmp/restart.txt`.
* **Script Diagnosa Database**:
  Jika Anda ingin mengetes apakah server Node.js cPanel Anda benar-benar bisa terhubung ke database atau tidak, jalankan perintah ini di **Terminal cPanel** (pastikan virtual environment aktif):
  ```bash
  node --env-file=.env -e "
  const { PrismaClient } = require('@prisma/client');
  const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
  const adapter = new PrismaMariaDb({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hris_karyawan',
  });
  const prisma = new PrismaClient({ adapter });
  console.log('Menghubungkan ke database:', process.env.DB_NAME);
  prisma.user.findFirst()
    .then(user => {
      if (user) {
        console.log('✅ KONEKSI BERHASIL! Ditemukan user pertama:', user.username);
      } else {
        console.log('⚠️ KONEKSI BERHASIL, tetapi tabel user KOSONG.');
      }
    })
    .catch(err => {
      console.error('❌ KONEKSI GAGAL:', err.message);
    })
    .finally(() => prisma.\$disconnect());
  "
  ```

### 2. Error "Internal Server Error" (500) Saat Membuka Website
* **Penyebab**: Terjadi crash saat inisialisasi modul database Prisma Client karena ketidaksesuaian runtime build.
* **Solusi**: Jalankan `npx prisma generate` kembali di terminal cPanel dan pastikan Anda melakukan restart aplikasi Node.js.

### 3. Folder Upload Tidak Bisa Menyimpan File
* **Penyebab**: Permisi (*permission*) folder `private_uploads` belum diset ke `755`.
* **Solusi**: Jalankan perintah `chmod 755 private_uploads` lewat terminal atau atur *permission* folder tersebut melalui klik kanan di cPanel File Manager.
