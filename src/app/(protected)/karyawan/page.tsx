'use client';

import { useState, useEffect, useMemo } from 'react';
import { getEmployees, deleteEmployee } from '@/app/actions/employee';
import {
  Loader2, Eye, Pencil, FileClock, Trash2, Search,
  SlidersHorizontal, ArrowUpDown, Plus, MoreVertical,
  ChevronLeft, ChevronRight, User, ChevronDown,
} from "lucide-react";
import Link from 'next/link';
import { useSidebar } from "@/components/ui/sidebar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { differenceInDays } from 'date-fns';
import { ExportExcelButton } from '@/components/export-excel-button';

const F = "'Satoshi', 'Inter', system-ui, sans-serif";
const PER_PAGE = 10;

type SortKey = 'namaLengkap' | 'nik' | 'posisi' | 'cabang' | 'traineeSelesai' | '';

export default function DataKaryawanPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [cabang, setCabang] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState(0);
  const [sortCol, setSortCol] = useState<SortKey>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showFilter, setShowFilter] = useState(false);

  const { role } = useSidebar();
  const isAdmin = role === 'ADMIN';

  const fetchData = async () => {
    setLoading(true);
    const data = await getEmployees({ search, cabang, status: statusFilter });
    setEmployees(data);
    setLoading(false);
    setPage(1);
  };
  useEffect(() => { fetchData(); }, [search, cabang, statusFilter]);

  // Unique cabang values for filter
  const cabangOptions = useMemo(() => [...new Set(employees.map(e => e.cabang))].sort(), [employees]);

  const stats = useMemo(() => {
    const now = new Date();
    const total = employees.length;
    const aktif = employees.filter(e => {
      const c = e.contracts?.[0];
      if (!c || e.status !== 'AKTIF') return false;
      return differenceInDays(new Date(c.traineeSelesai), now) >= 0;
    }).length;
    const nonAktif = total - aktif;
    const segera = employees.filter(e => {
      const c = e.contracts?.[0];
      if (!c) return false;
      const d = differenceInDays(new Date(c.traineeSelesai), now);
      return d >= 0 && d <= 30;
    }).length;
    return { total, aktif, nonAktif, segera };
  }, [employees]);

  // Sort logic
  const sortedEmployees = useMemo(() => {
    if (!sortCol) return employees;
    return [...employees].sort((a, b) => {
      let va: any, vb: any;
      if (sortCol === 'posisi') { va = a.contracts?.[0]?.posisi || ''; vb = b.contracts?.[0]?.posisi || ''; }
      else if (sortCol === 'traineeSelesai') { va = a.contracts?.[0]?.traineeSelesai || ''; vb = b.contracts?.[0]?.traineeSelesai || ''; }
      else { va = a[sortCol] || ''; vb = b[sortCol] || ''; }
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [employees, sortCol, sortDir]);

  const totalPages = Math.ceil(sortedEmployees.length / PER_PAGE);
  const rows = sortedEmployees.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const pageNums = useMemo(() => {
    const p: (number | string)[] = [];
    if (totalPages <= 5) { for (let i = 1; i <= totalPages; i++) p.push(i); }
    else {
      p.push(1);
      if (page > 3) p.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) p.push(i);
      if (page < totalPages - 2) p.push('...');
      p.push(totalPages);
    }
    return p;
  }, [page, totalPages]);

  const handleSort = (col: SortKey) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!isAdmin) { toast.error("Akses Ditolak"); return; }
    setIsDeleting(id);
    try {
      const r = await deleteEmployee(id);
      if (r.success) { toast.success(`${name} telah dihapus.`); await fetchData(); }
      else toast.error(r.error || "Gagal menghapus.");
    } catch { toast.error("Gagal menghubungkan ke server."); }
    finally { setIsDeleting(null); }
  };

  const fmtDate = (s: string) => !s ? '-' : new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  const badge = (emp: any) => {
    if (emp.status !== 'AKTIF') return <Badge bg="#FEF2F2" color="#DC2626" border="#FECACA">Non-Aktif</Badge>;
    const c = emp.contracts?.[0];
    if (c) {
      const d = differenceInDays(new Date(c.traineeSelesai), new Date());
      if (d < 0) return <Badge bg="#FEF2F2" color="#DC2626" border="#FECACA">Expired</Badge>;
      if (d <= 30) return <Badge bg="#FFF7ED" color="#EA580C" border="#FED7AA">Segera Habis</Badge>;
    }
    return <Badge bg="#ECFDF5" color="#059669" border="#A7F3D0">Aktif</Badge>;
  };

  const tabs = ['Daftar Karyawan', 'Directory', 'ORG Chart'];

  return (
    <div style={{ fontFamily: F }}>
      {/* ===== TOP HEADER ===== */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1E293B', margin: 0 }}>Karyawan</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isAdmin && <ExportExcelButton variant="default" />}
          {isAdmin && (
            <Link href="/karyawan/tambah" style={{ textDecoration: 'none' }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', fontSize: 14, fontWeight: 600, backgroundColor: '#1E293B', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: F }}>
                <Plus size={16} /> Tambah baru
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* VIEWER INFO */}
      {!isAdmin && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 16, fontSize: 13, color: '#64748B' }}>
          <Eye size={14} color="#94A3B8" />
          <span>Mode <strong>Viewer</strong> — Anda hanya dapat melihat data. Hubungi Admin untuk perubahan.</span>
        </div>
      )}

      {/* ===== TABS + SEARCH/FILTER/SORT ===== */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {tabs.map((t, i) => (
            <button key={t} onClick={() => setActiveTab(i)} style={{
              padding: '10px 16px', fontSize: 14, fontWeight: activeTab === i ? 600 : 400,
              color: activeTab === i ? '#1E293B' : '#94A3B8', background: 'none', border: 'none',
              borderBottom: activeTab === i ? '2px solid #1E293B' : '2px solid transparent',
              cursor: 'pointer', fontFamily: F, marginBottom: -1,
            }}>{t}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8 }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
              style={{ width: 180, height: 36, paddingLeft: 32, paddingRight: 10, fontSize: 13, border: '1px solid #E2E8F0', borderRadius: 8, outline: 'none', fontFamily: F, color: '#475569' }} />
          </div>
          <button onClick={() => setShowFilter(!showFilter)} style={{ ...btnOutline, gap: 6, background: showFilter ? '#F1F5F9' : '#fff' }}>
            <SlidersHorizontal size={14} /> Filter
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button style={{ ...btnOutline, gap: 6 }}>
                <ArrowUpDown size={14} /> Sort
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" style={{ fontFamily: F, minWidth: 180 }}>
              <DropdownMenuItem onClick={() => handleSort('namaLengkap')} className="cursor-pointer text-sm">
                Nama {sortCol === 'namaLengkap' && (sortDir === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('nik')} className="cursor-pointer text-sm">
                NIK {sortCol === 'nik' && (sortDir === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('posisi')} className="cursor-pointer text-sm">
                Posisi {sortCol === 'posisi' && (sortDir === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('cabang')} className="cursor-pointer text-sm">
                Cabang {sortCol === 'cabang' && (sortDir === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('traineeSelesai')} className="cursor-pointer text-sm">
                Trainee Selesai {sortCol === 'traineeSelesai' && (sortDir === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setSortCol(''); setSortDir('asc'); }} className="cursor-pointer text-sm text-slate-400">
                Reset
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ===== FILTER ROW ===== */}
      {showFilter && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, padding: '12px 16px', background: '#FAFBFC', borderRadius: 10, border: '1px solid #F1F5F9' }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cabang</label>
            <select value={cabang} onChange={e => setCabang(e.target.value)} style={selectStyle}>
              <option value="">Semua Cabang</option>
              {cabangOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
              <option value="">Semua Status</option>
              <option value="AKTIF">Aktif</option>
              <option value="NON-AKTIF">Non-Aktif</option>
            </select>
          </div>
          <button onClick={() => { setCabang(''); setStatusFilter(''); setShowFilter(false); }} style={{ ...btnOutline, alignSelf: 'flex-end', fontSize: 12, height: 34, color: '#94A3B8' }}>
            Reset Filter
          </button>
        </div>
      )}

      {/* ===== STAT CARDS ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        <StatCard icon="#94A3B8" bg="#F1F5F9" value={stats.total} delta={`+${stats.total}`} deltaColor="#059669" label="Total karyawan" />
        <StatCard icon="#059669" bg="#ECFDF5" value={stats.aktif} delta={`+${stats.aktif}`} deltaColor="#059669" label="Karyawan aktif" />
        <StatCard icon="#DC2626" bg="#FEF2F2" value={stats.nonAktif} delta={`-${stats.nonAktif}`} deltaColor="#DC2626" label="Non-aktif" />
        <StatCard icon="#D97706" bg="#FFFBEB" value={stats.segera} delta={`+${stats.segera}`} deltaColor="#D97706" label="Kontrak segera habis" />
      </div>

      {/* ===== TABLE ===== */}
      <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 1000 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <TH w={40} align="center"><input type="checkbox" style={{ width: 16, height: 16, accentColor: '#1E293B' }} /></TH>
              <TH w="22%" onClick={() => handleSort('namaLengkap')} sortable>Nama Lengkap <SortArrow col="namaLengkap" current={sortCol} dir={sortDir} /></TH>
              <TH w="9%" onClick={() => handleSort('nik')} sortable>NIK <SortArrow col="nik" current={sortCol} dir={sortDir} /></TH>
              <TH w="10%" onClick={() => handleSort('posisi')} sortable>Posisi <SortArrow col="posisi" current={sortCol} dir={sortDir} /></TH>
              <TH w="8%" onClick={() => handleSort('cabang')} sortable>Cabang <SortArrow col="cabang" current={sortCol} dir={sortDir} /></TH>
              <TH w="11%">Trainee Sejak</TH>
              <TH w="11%" onClick={() => handleSort('traineeSelesai')} sortable>Trainee Selesai <SortArrow col="traineeSelesai" current={sortCol} dir={sortDir} /></TH>
              <TH w="8%" align="center">Status</TH>
              <TH w={36}></TH>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '48px 0', color: '#94A3B8' }}>
                <Loader2 size={22} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
                <div style={{ fontSize: 13 }}>Memuat data...</div>
              </td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: '#94A3B8', fontSize: 13 }}>Tidak ada data ditemukan.</td></tr>
            ) : rows.map((emp: any) => {
              const c = emp.contracts?.[0];
              return (
                <tr key={emp.id} style={{ borderBottom: '1px solid #F1F5F9' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAFBFC'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <TD align="center"><input type="checkbox" style={{ width: 16, height: 16, accentColor: '#1E293B' }} /></TD>
                  <TD>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <User size={16} color="#94A3B8" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: '#1E293B', fontSize: 14, lineHeight: '18px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.namaLengkap}</div>
                        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>{emp.noHp || '-'}</div>
                      </div>
                    </div>
                  </TD>
                  <TD>
                    <Link href={`/karyawan/${emp.id}`} style={{ color: '#3B82F6', fontWeight: 500, fontSize: 13, textDecoration: 'underline' }}>
                      {emp.nik || '-'}
                    </Link>
                  </TD>

                  <TD>{c?.posisi || '-'}</TD>
                  <TD>{emp.cabang}</TD>
                  <TD>{c ? fmtDate(c.traineeSejak) : '-'}</TD>
                  <TD>{c ? fmtDate(c.traineeSelesai) : '-'}</TD>
                  <TD align="center">{badge(emp)}</TD>
                  <TD align="center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#94A3B8' }}>
                          <MoreVertical size={16} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48" style={{ fontFamily: F }}>
                        <DropdownMenuItem asChild className="gap-2 cursor-pointer text-sm">
                          <Link href={`/karyawan/${emp.id}`}><Eye className="w-4 h-4 text-slate-500" /> Lihat detail</Link>
                        </DropdownMenuItem>
                        {isAdmin && (<>
                          <DropdownMenuItem asChild className="gap-2 cursor-pointer text-sm">
                            <Link href={`/karyawan/${emp.id}/edit`}><Pencil className="w-4 h-4 text-slate-500" /> Edit profil</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="gap-2 cursor-pointer text-sm">
                            <Link href={`/karyawan/${emp.id}/kontrak`}><FileClock className="w-4 h-4 text-slate-500" /> Perbarui kontrak</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="gap-2 cursor-pointer text-sm text-red-600 focus:text-red-600 focus:bg-red-50" onSelect={e => e.preventDefault()}>
                                <Trash2 className="w-4 h-4" /> Hapus data
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus data karyawan?</AlertDialogTitle>
                                <AlertDialogDescription>Data <strong>{emp.namaLengkap}</strong> akan dihapus permanen.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(emp.id, emp.namaLengkap)} className="bg-red-600 hover:bg-red-700 text-white">Ya, hapus</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>)}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TD>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
        {/* PAGINATION */}
        {totalPages > 0 && !loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid #E2E8F0', fontSize: 13, color: '#64748B' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>{PER_PAGE} records</span>
              <ChevronDown size={12} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PgBtn onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}><ChevronLeft size={14} /></PgBtn>
              {pageNums.map((p, i) => typeof p === 'number'
                ? <PgBtn key={i} active={page === p} onClick={() => setPage(p)}>{p}</PgBtn>
                : <span key={i} style={{ padding: '0 4px', color: '#94A3B8' }}>...</span>
              )}
              <PgBtn onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}><ChevronRight size={14} /></PgBtn>
            </div>
            <span>{(page - 1) * PER_PAGE + 1} - {Math.min(page * PER_PAGE, sortedEmployees.length)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ SUB-COMPONENTS ============ */

function StatCard({ icon, bg, value, delta, deltaColor, label }: { icon: string; bg: string; value: number; delta: string; deltaColor: string; label: string; }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: '20px 16px' }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <User size={20} color={icon} />
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: '#1E293B', lineHeight: 1 }}>{value.toLocaleString()}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: deltaColor }}>{delta}</span>
      </div>
      <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4, fontWeight: 500 }}>{label}</p>
    </div>
  );
}

function Badge({ bg, color, border, children }: { bg: string; color: string; border: string; children: React.ReactNode; }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, backgroundColor: bg, color, border: `1px solid ${border}` }}>{children}</span>;
}

function SortArrow({ col, current, dir }: { col: string; current: string; dir: string; }) {
  if (col !== current) return <ArrowUpDown size={12} color="#CBD5E1" style={{ marginLeft: 4, verticalAlign: 'middle' }} />;
  return <span style={{ marginLeft: 4, fontSize: 12, color: '#1E293B' }}>{dir === 'asc' ? '↑' : '↓'}</span>;
}

function TH({ children, w, align, onClick, sortable }: { children?: React.ReactNode; w?: number | string; align?: string; onClick?: () => void; sortable?: boolean; }) {
  return <th onClick={onClick} style={{
    padding: '10px 12px', textAlign: (align as any) || 'left', fontSize: 12, fontWeight: 500,
    color: '#64748B', background: '#FAFBFC', whiteSpace: 'nowrap', width: w,
    cursor: sortable ? 'pointer' : 'default', userSelect: 'none',
  }}>{children}</th>;
}

function TD({ children, align }: { children?: React.ReactNode; align?: string; }) {
  return <td style={{ padding: '12px 12px', fontSize: 14, color: '#475569', textAlign: (align as any) || 'left', whiteSpace: 'nowrap' }}>{children}</td>;
}

function PgBtn({ children, active, disabled, onClick }: { children: React.ReactNode; active?: boolean; disabled?: boolean; onClick?: () => void; }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 6, border: active ? '1px solid #1E293B' : '1px solid #E2E8F0',
      background: active ? '#1E293B' : '#fff', color: active ? '#fff' : disabled ? '#CBD5E1' : '#475569',
      fontSize: 13, fontWeight: 500, cursor: disabled ? 'default' : 'pointer',
    }}>{children}</button>
  );
}

const btnOutline: React.CSSProperties = {
  display: 'flex', alignItems: 'center', height: 36, padding: '0 12px',
  fontSize: 13, fontWeight: 500, color: '#475569', background: '#fff',
  border: '1px solid #E2E8F0', borderRadius: 8, cursor: 'pointer',
  fontFamily: "'Satoshi', 'Inter', system-ui, sans-serif",
};

const selectStyle: React.CSSProperties = {
  height: 34, padding: '0 28px 0 10px', fontSize: 13, border: '1px solid #E2E8F0',
  borderRadius: 8, backgroundColor: '#fff', color: '#475569',
  appearance: 'none' as const, cursor: 'pointer', outline: 'none', fontFamily: "'Satoshi', 'Inter', system-ui, sans-serif",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
};