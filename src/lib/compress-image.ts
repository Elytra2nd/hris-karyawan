/**
 * Kompres gambar di sisi client menggunakan Canvas API.
 * Tidak memerlukan library tambahan — berjalan murni di browser.
 *
 * Mengembalikan `CompressedImage` yang berisi `blob` dan `name`, bukan `File`.
 * Gunakan `formData.append('file', result.blob, result.name)` untuk menghindari
 * masalah serialisasi `new File([blob], ...)` pada Next.js Server Actions.
 */

export interface CompressedImage {
  /** Blob hasil kompresi (atau blob file asli jika kompresi tidak menguntungkan). */
  blob: Blob
  /** Tipe MIME hasil output. */
  type: string
  /** Nama file output (ekstensi disesuaikan dengan tipe output). */
  name: string
  /** Ukuran blob dalam byte. */
  size: number
}

export async function compressImage(
  file: File,
  maxPx = 1200,
  quality = 0.82,
): Promise<CompressedImage> {
  // PNG tetap PNG (lossless), JPEG & WEBP dikonversi ke JPEG untuk kompresi optimal.
  const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
  const ext = outputMime === 'image/png' ? 'png' : 'jpg'
  const baseName = file.name.replace(/\.[^.]+$/, '')
  const outputName = `${baseName}.${ext}`

  const fallback: CompressedImage = {
    blob: file,
    type: file.type,
    name: file.name,
    size: file.size,
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { width, height } = img

      // Skala proporsional agar tidak melebihi maxPx di salah satu sisi.
      if (width > maxPx || height > maxPx) {
        if (width >= height) {
          height = Math.round((height * maxPx) / width)
          width = maxPx
        } else {
          width = Math.round((width * maxPx) / height)
          height = maxPx
        }
      }

      // Guard: jika dimensi tidak valid, fallback ke file asli.
      if (width <= 0 || height <= 0) {
        resolve(fallback)
        return
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(fallback)
        return
      }

      // Aktifkan image smoothing untuk downscale berkualitas tinggi.
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          // Blob null atau kosong → fallback ke file asli.
          if (!blob || blob.size === 0) {
            resolve(fallback)
            return
          }
          // Hanya pakai versi kompres jika ukurannya benar-benar lebih kecil.
          if (blob.size < file.size) {
            resolve({ blob, type: outputMime, name: outputName, size: blob.size })
          } else {
            resolve(fallback)
          }
        },
        outputMime,
        quality,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(fallback)
    }

    img.src = objectUrl
  })
}
