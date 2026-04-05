import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import Link from 'next/link';
import { id as localeID } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default async function EmployeeTable() {
  const employees = await prisma.employee.findMany({
    include: {
      contracts: {
        orderBy: { traineeSejak: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="rounded-md border bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="font-bold text-slate-700">NIK</TableHead>
            <TableHead className="font-bold text-slate-700">Nama Karyawan</TableHead>
            <TableHead className="font-bold text-slate-700">Cabang</TableHead>
            <TableHead className="font-bold text-slate-700">Posisi</TableHead>
            <TableHead className="font-bold text-slate-700">Akhir Kontrak</TableHead>
            <TableHead className="font-bold text-slate-700 text-center">Status</TableHead>
            <TableHead className="font-bold text-slate-700 text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center h-32 text-slate-500">
                Belum ada data karyawan. Silakan tambah data baru.
              </TableCell>
            </TableRow>
          ) : (
            employees.map((emp) => {
              const latestContract = emp.contracts[0];
              
              return (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.nik || '-'}</TableCell>
                  <TableCell>{emp.namaLengkap}</TableCell>
                  <TableCell>{emp.cabang}</TableCell>
                  <TableCell>{latestContract?.posisi || '-'}</TableCell>
                  <TableCell>
                    {latestContract 
                      ? format(new Date(latestContract.traineeSelesai), 'dd MMM yyyy', { locale: localeID }) 
                      : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={emp.status === 'AKTIF' ? 'default' : 'destructive'}>
                      {emp.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Link href={`/karyawan/${emp.id}`}>
                      <Button variant="outline" size="sm">Detail</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}