'use client';

import { useState, useEffect } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { CaretDown, Layout } from "@phosphor-icons/react";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // Mencegah Hydration Error dengan memastikan komponen sudah terpasang di browser
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="animate-pulse bg-muted h-32 rounded-xl mb-6" />;
  }

  return (
    <Collapsible defaultOpen className="space-y-4 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layout className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Ringkasan Panel
          </h2>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <CaretDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
          </TooltipTrigger>
          <TooltipContent side="left">
            Sembunyikan/Tampilkan
          </TooltipContent>
        </Tooltip>
      </div>
      <CollapsibleContent className="animate-in fade-in slide-in-from-top-2 duration-300">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}