import { readFile } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/dal';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> } // Gunakan Promise di sini
) {
  // 1. Unwrap params (Next.js 15 update)
  const { filename } = await params;

  // 2. Cek sesi: Hanya orang yang login yang bisa lihat dokumen
  try {
    await verifySession();
  } catch (e) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 3. Bangun path file
  const filePath = join(process.cwd(), 'uploads/documents', filename);
  
  try {
    const fileBuffer = await readFile(filePath);
    
    // Tentukan Content-Type secara otomatis
    const ext = filename.split('.').pop()?.toLowerCase();
    const contentType = ext === 'pdf' ? 'application/pdf' : 'image/jpeg';

    return new NextResponse(fileBuffer, {
      headers: { 
        'Content-Type': contentType,
        // Tambahkan header ini agar browser tidak langsung download (opsional)
        'Content-Disposition': 'inline' 
      }
    });
  } catch (e) {
    console.error("File Read Error:", e);
    return new NextResponse('File tidak ditemukan', { status: 404 });
  }
}