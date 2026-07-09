import { NextRequest, NextResponse } from 'next/server'
import { uploadEmployeePhoto, uploadEmployeeDocument } from '@/app/actions/upload'
import { verifySession } from '@/lib/dal'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    // Validasi session terlebih dahulu untuk API route
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ success: false, message: 'Sesi kedaluwarsa, silakan login kembali' }, { status: 401 })
    }

    const formData = await req.formData()
    const action = req.nextUrl.searchParams.get('action')

    // Cetak log mentah untuk debug di stderr.log
    logger.error('API Upload Route triggered:', {
      action,
      username: session.username,
      keys: Array.from(formData.keys()),
      hasFile: formData.has('file'),
      employeeId: formData.get('employeeId')
    })

    let result
    if (action === 'photo') {
      result = await uploadEmployeePhoto(formData)
    } else if (action === 'document') {
      result = await uploadEmployeeDocument(formData)
    } else {
      return NextResponse.json({ success: false, message: 'Aksi tidak dikenal' }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    logger.error('API Upload Route crash:', { error: error?.message || String(error) })
    return NextResponse.json(
      { success: false, message: 'Gagal memproses unggahan: ' + (error?.message || String(error)) },
      { status: 500 }
    )
  }
}
