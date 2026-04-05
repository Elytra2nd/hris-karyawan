'use client';

import { useState, useEffect } from "react";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, LayoutPanelTop } from "lucide-react";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // Mencegah Hydration Error dengan memastikan komponen sudah terpasang di browser
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="animate-pulse bg-slate-100 h-32 rounded-xl mb-6" />;
  }

  return (
    <Collapsible defaultOpen className="space-y-4 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutPanelTop className="w-4 h-4 text-slate-500" />
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Ringkasan Panel
          </h2>
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="animate-in fade-in slide-in-from-top-2 duration-300">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}