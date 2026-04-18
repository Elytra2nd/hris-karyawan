'use client';

import { useEffect, useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ContractPDF } from '@/components/contract-pdf';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';

interface PDFButtonProps {
  employee: any;
  contract: any;
}

export default function PDFButton({ employee, contract }: PDFButtonProps) {
  const [isClient, setIsClient] = useState(false);

  // Pastikan komponen hanya dirender di client
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <Button variant="ghost" size="sm" className="h-8 gap-2 text-slate-400 font-bold text-[10px] uppercase cursor-not-allowed">
        <FileDown className="w-3.5 h-3.5" />
        Loading...
      </Button>
    );
  }

  return (
    <PDFDownloadLink
      document={<ContractPDF employee={employee} contract={contract} />}
      fileName={`Kontrak_${employee.namaLengkap}_${contract.posisi}.pdf`}
    >
      {({ loading }) => (
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold text-[10px] uppercase"
          disabled={loading}
        >
          <FileDown className="w-3.5 h-3.5" />
          {loading ? 'Menyiapkan...' : 'Cetak'}
        </Button>
      )}
    </PDFDownloadLink>
  );
}