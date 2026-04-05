// src/components/risk-alert.tsx
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, ChevronRight } from "lucide-react";

export function RiskAlert({ count }: { count: number }) {
  return (
    <Card className={`border-none shadow-sm overflow-hidden ${count > 0 ? 'bg-red-50 border-l-4 border-l-red-500' : 'bg-green-50 border-l-4 border-l-green-500'}`}>
      <CardContent className="p-3 flex items-center justify-between h-full">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${count > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Mitigasi Risiko</p>
            <h3 className={`text-sm font-bold ${count > 0 ? 'text-red-900' : 'text-green-900'}`}>
              {count > 0 ? `${count} Kontrak Segera Habis` : 'Semua Kontrak Aman'}
            </h3>
            <p className="text-[9px] text-slate-500 mt-0.5 tracking-tight">Estimasi jatuh tempo dalam 30 hari</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}