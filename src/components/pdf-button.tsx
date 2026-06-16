'use client';

import { useEffect, useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ContractPDF } from '@/components/contract-pdf';
import { Button } from '@/components/ui/button';
import { FileArrowDownIcon } from '@phosphor-icons/react';
import type { Employee, ContractListItem } from '@/types';

interface PDFButtonProps {
  employee: Employee;
  contract: ContractListItem;
}

export default function PDFButton({ employee, contract }: PDFButtonProps) {
  const [isClient, setIsClient] = useState(false);

  // Pastikan komponen hanya dirender di client
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <Button variant="ghost" size="sm" className="h-8 gap-2 text-muted-foreground/70 font-bold text-xs uppercase cursor-not-allowed">
        <FileArrowDownIcon className="w-3.5 h-3.5" />
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
          className="h-8 gap-2 text-primary hover:text-primary/80 hover:bg-accent font-bold text-xs uppercase"
          disabled={loading}
        >
          <FileArrowDownIcon className="w-3.5 h-3.5" />
          {loading ? 'Menyiapkan...' : 'Cetak'}
        </Button>
      )}
    </PDFDownloadLink>
  );
}