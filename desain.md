# Design System — HRIS Karyawan Astra Motor Kalbar

> File ini adalah panduan desain permanen. Setiap perubahan UI HARUS mengacu ke sini.
> Referensi visual: KantorKu/Dealls HRIS — clean SaaS, data-first, profesional.

---

## Prinsip Desain

- **Profesional & bersih** — sistem HR perusahaan, bukan startup
- **Data-first** — tabel dan form mudah dibaca, bukan sekadar cantik
- **Konsisten** — satu komponen, satu cara penulisan, di seluruh codebase
- **Minimal ornamen** — tidak ada animasi berlebihan, gradient data, atau shadow dramatis

---

## Font

| Penggunaan | Font |
|---|---|
| Semua teks | **Satoshi** (Variable) |
| Fallback | `ui-sans-serif, system-ui, sans-serif` |
| Kode / data teknis | `Geist Mono` |

File: `/public/fonts/Satoshi-Variable.woff2`
Defined in: `globals.css` via `@font-face`

---

## Palet Warna

Gunakan CSS variables — **jangan hardcode hex langsung**.

### Primary — Astra Blue
```
--primary:            oklch(0.379 0.191 264)   /* #1e40af  biru-800 */
--primary-foreground: oklch(0.985 0 0)          /* putih */
--accent:             oklch(0.951 0.026 264)    /* #eff6ff  biru-50  */
--accent-foreground:  oklch(0.379 0.191 264)    /* biru-800 */
--ring:               oklch(0.379 0.191 264)    /* biru-800 */
```

> Astra Red `#E21E29` HANYA dipakai di: logo, ilustrasi brand.
> Jangan dipakai sebagai primary button atau aksen UI.

### Neutral
```
--background:         oklch(1 0 0)              /* putih */
--foreground:         oklch(0.145 0 0)          /* slate-900 */
--muted:              oklch(0.97 0 0)           /* gray-50 */
--muted-foreground:   oklch(0.556 0 0)          /* gray-500 */
--border:             oklch(0.922 0 0)          /* gray-200 */
```

### Sidebar
```css
--sidebar:            #f8fafc    /* slate-50, sedikit biru */
--sidebar-foreground: #1e293b    /* slate-800 */
--sidebar-primary:    #1e40af    /* biru-800, teks & icon aktif */
--sidebar-accent:     #eff6ff    /* biru-50, hover bg */
--sidebar-border:     #e2e8f0    /* slate-200 */
```

### Status & Chart
```
chart-1 (primary)   oklch(0.546 0.245 264.376) /* biru cerah */
chart-2 (teal)      oklch(0.488 0.163 200)     /* teal */
chart-3 (hijau)     oklch(0.627 0.194 131)     /* hijau */
chart-4 (kuning)    oklch(0.769 0.188 85)      /* kuning */
chart-5 (merah)     oklch(0.645 0.246 27)      /* merah-oranye */
```

---

## Typography Scale

| Elemen | Class Tailwind |
|---|---|
| Page title (H1) | `text-2xl font-bold text-gray-900` |
| Section heading (H2) | `text-lg font-semibold text-gray-800` |
| Card title | `text-base font-semibold text-gray-800` |
| Body default | `text-sm text-gray-700` |
| Label form | `text-sm font-medium text-gray-700` |
| Caption / teks sekunder | `text-xs text-muted-foreground` |
| Section header sidebar | `text-xs font-semibold text-gray-400 uppercase tracking-wider` |

---

## Border Radius

| Token | Nilai | Dipakai untuk |
|---|---|---|
| `rounded-sm` | ~3px | Badge kecil |
| `rounded-md` | ~8px | Input, Button |
| `rounded-lg` | 8px (base) | Card, Dropdown |
| `rounded-xl` | ~11px | Modal, Panel besar |

---

## Spacing

| Konteks | Class |
|---|---|
| Padding halaman | `p-6` (desktop) / `p-4` (mobile) |
| Jarak antar section | `space-y-6` |
| Jarak antar form field | `space-y-4` |
| Padding card | `p-6` |
| Gap grid | `gap-4` atau `gap-6` |

---

## Komponen Standar

### Button

```tsx
// Primary — aksi utama
<Button>Simpan</Button>
// → bg biru-800, text putih, hover biru-900

// Outline-primary — aksi sekunder
<Button variant="outline">Batal</Button>
// → border biru-800, text biru-800, hover bg biru-50

// Ghost — navigasi / icon
<Button variant="ghost" size="icon">
  <Icon size={16} />
</Button>

// Destructive — hapus
<Button variant="destructive">Hapus</Button>
```

### Card

```tsx
<Card>               // border border-gray-200 shadow-sm rounded-lg
  <CardHeader>
    <CardTitle>Judul</CardTitle>
    <CardDescription>Keterangan singkat</CardDescription>
  </CardHeader>
  <CardContent>
    {/* isi */}
  </CardContent>
</Card>
```

Gunakan class `.card-standard` untuk card sederhana tanpa shadcn.

### Form Input

```tsx
<div className="space-y-2">
  <Label htmlFor="nama">Nama Lengkap</Label>
  <Input id="nama" placeholder="Masukkan nama..." />
  {/* Error state: */}
  <p className="text-xs text-destructive">Nama wajib diisi</p>
</div>
```

### Status Chip / Badge

Gunakan utility class dari `globals.css`:

```tsx
// Kontrak aktif / karyawan aktif
<span className="chip-aktif">Aktif</span>

// Mendekati habis
<span className="chip-warning">14 Hari</span>

// Expired
<span className="chip-expired">Berakhir</span>

// Tidak aktif / resign
<span className="chip-nonaktif">Tidak Aktif</span>

// Trainee / magang
<span className="chip-trainee">Trainee</span>

// Role Admin
<span className="chip-admin">Admin</span>

// Role Viewer
<span className="chip-viewer">Viewer</span>
```

Atau pakai shadcn `<Badge>`:
```tsx
<Badge>AKTIF</Badge>               // primary / biru
<Badge variant="secondary">...</Badge>  // abu
<Badge variant="destructive">...</Badge> // merah
<Badge variant="outline">...</Badge>
```

### Tabel

Header standar pakai class `.th-standard`:
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead className="th-standard">Nama</TableHead>
      <TableHead className="th-standard">Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow className="hover:bg-gray-50">
      <TableCell>Budi Santoso</TableCell>
      <TableCell><span className="chip-aktif">Aktif</span></TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Alert / Peringatan Kontrak

Untuk warning kontrak mendekati habis (≤30 hari):
```tsx
// Warning banner
<div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
  <div>
    <p className="text-sm font-semibold text-amber-800">Kontrak Segera Berakhir</p>
    <p className="text-sm text-amber-700">3 karyawan memiliki kontrak ≤14 hari</p>
  </div>
</div>

// Baris tabel kritis (≤7 hari)
<TableRow className="bg-red-50/50 hover:bg-red-50">
```

---

## Layout & Struktur

### Sidebar (lebar: `w-64`)
- Background: `--sidebar` (#f8fafc)
- Struktur: Logo → Module Switcher → Nav Sections → Footer branding
- Nav section header: `text-xs font-semibold text-gray-400 uppercase tracking-wider`
- Active item: `bg-[--sidebar-accent] text-[--sidebar-primary] font-medium`
- Hover item: `hover:bg-[--sidebar-accent] hover:text-[--sidebar-primary]`
- Sub-menu: indented 12px, border-left 2px biru

### Header Atas (`h-16`)
- Background: white, `border-b border-gray-200`
- Isi: Search global → spacer → Bell → User avatar + nama + role

### Konten Utama
- `flex-1 overflow-y-auto`
- `max-w-7xl mx-auto` untuk konten lebar
- Page header: nama halaman + breadcrumb + action buttons (kanan)

---

## Icon

Library: **Lucide React** (sudah terinstall)

| Konteks | Ukuran |
|---|---|
| Inline dalam teks | `size={14}` atau `h-3.5 w-3.5` |
| Dalam Button | `size={16}` atau `h-4 w-4` |
| Standalone / sidebar | `size={18}` atau `h-5 w-5` (tidak diubah warna otomatis) |
| Header section | `size={20}` atau `h-5 w-5` |

Selalu gunakan `strokeWidth={2}` secara konsisten.

---

## Aturan ANTI-SLOP

### ❌ JANGAN
- Hardcode hex: `bg-[#1e40af]` → pakai `bg-primary`
- Shadow berlebihan: `shadow-xl shadow-blue-500/20`
- Gradient di form / tabel / card data
- Font size tidak konsisten antar halaman
- Buat komponen baru kalau shadcn sudah ada

### ✅ HARUS
- Gunakan `text-muted-foreground` untuk teks sekunder
- Gunakan `border` (CSS var `oklch(0.922 0 0)`) bukan `border-gray-200` hardcode
- `space-y-4` untuk form field, `space-y-6` untuk section
- Loading state: `<Skeleton>` dari shadcn
- Empty state: icon `SearchX` + teks `text-muted-foreground` + deskripsi singkat
- Error state inline di bawah input, bukan alert dialog

---

## Referensi Warna Astra

- **Astra Red**: `#E21E29` — logo & branding saja, **bukan UI element**
- **Astra Blue**: `#1e40af` — primary button, active nav, link
- **Astra Blue Light**: `#eff6ff` — hover background, chip background
