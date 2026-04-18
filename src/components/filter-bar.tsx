'use client';

import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Search, MapPin, Filter } from "lucide-react";

export function FilterBar({ onSearch, onFilterCabang, onFilterStatus }: any) {
  return (
    <div className="flex flex-col md:flex-row gap-3 mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-100 font-sans">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Cari Nama atau NIK..." 
          className="pl-10 h-10 border-slate-200 focus:ring-blue-500"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      {/* Filter Cabang - Sangat Penting untuk Kalbar */}
      <div className="w-full md:w-48">
        <Select onValueChange={onFilterCabang}>
          <SelectTrigger className="h-10 border-slate-200">
            <MapPin className="w-4 h-4 mr-2 text-blue-500" />
            <SelectValue placeholder="Semua Cabang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Cabang</SelectItem>
            <SelectItem value="A. YANI PTK">A. Yani PTK</SelectItem>
            <SelectItem value="PATTIMURA">Pattimura</SelectItem>
            <SelectItem value="SUI RAYA">Sui Raya</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filter Status */}
      <div className="w-full md:w-40">
        <Select onValueChange={onFilterStatus}>
          <SelectTrigger className="h-10 border-slate-200">
            <Filter className="w-4 h-4 mr-2 text-emerald-500" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Status</SelectItem>
            <SelectItem value="AKTIF">Aktif</SelectItem>
            <SelectItem value="RESIGN">Resign</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}