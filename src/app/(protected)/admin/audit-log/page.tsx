import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { History, User, Activity, Database } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default async function AuditLogPage() {
  // Ambil 100 log terbaru
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4 sticky top-0 z-10 font-sans">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex items-center gap-2 font-black text-slate-900 uppercase tracking-tighter">
          <History className="w-5 h-5 text-blue-600" />
          <span>Riwayat Aktivitas Sistem</span>
        </div>
      </header>

      <main className="p-6 space-y-6 font-sans bg-slate-50 min-h-screen">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-45 font-bold text-slate-700">WAKTU</TableHead>
                <TableHead className="w-37.5 font-bold text-slate-700">PENGGUNA</TableHead>
                <TableHead className="w-30 font-bold text-slate-700 text-center">AKSI</TableHead>
                <TableHead className="font-bold text-slate-700">DETAIL PERUBAHAN</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-40 text-center text-slate-400 italic">
                    Belum ada aktivitas yang tercatat.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log: typeof logs[number]) => (
                  <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="text-[11px] font-medium text-slate-500">
                      {format(new Date(log.createdAt), "dd MMM yyyy, HH:mm:ss", { locale: localeID })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-slate-100 rounded-md">
                          <User className="w-3 h-3 text-slate-600" />
                        </div>
                        <span className="text-[11px] font-black uppercase text-slate-900 tracking-tighter">
                          {log.userName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`text-[9px] font-bold shadow-none ${
                        log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        log.action === 'UPDATE' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        'bg-red-50 text-red-700 border-red-100'
                      }`} variant="outline">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                          <Database className="w-3 h-3" /> {log.entity} ID: {log.entityId.substring(0, 8)}...
                        </div>
                        <div className="bg-slate-50 p-2 rounded border border-slate-100 text-[11px] font-mono text-slate-600 break-all">
                          {log.details}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </>
  );
}