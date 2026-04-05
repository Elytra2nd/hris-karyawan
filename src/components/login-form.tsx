'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, LockKeyhole, FileText, Building2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    const res = await signIn('credentials', {
      redirect: false,
      username,
      password,
    });

    if (res?.error) {
      setError('Username atau password salah!');
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-4 font-sans">
      
      {/* Container Utama: Lebih Ramping */}
      <div className="w-full max-w-100 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        
        {/* Header Branding: Ukuran Ikon & Teks Diperkecil */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-blue-200 shadow-xl inline-block">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-slate-900">
              HRIS KARYAWAN
            </h1>
            <div className="flex items-center gap-1.5 justify-center text-slate-500 font-semibold text-xs mt-0.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>PT. Multi Makmur - Cabang Kalbar</span>
            </div>
          </div>
        </div>

        <Card className="shadow-xl border-none font-sans bg-white/95 backdrop-blur-md overflow-hidden rounded-2xl">
          {/* Garis Aksen Lebih Tipis */}
          <div className="h-1.5 w-full bg-linear-to-r from-blue-400 via-blue-600 to-blue-800" />
          
          <CardHeader className="space-y-1.5 text-center pt-8 pb-6">
            <CardTitle className="text-xl font-black tracking-tight text-slate-900 uppercase">
              Autentikasi
            </CardTitle>
            <CardDescription className="text-xs font-medium px-6 leading-relaxed">
              Masukkan kredensial Anda untuk mengakses database kontrak.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-[10px] font-bold uppercase tracking-widest text-slate-600 ml-0.5">
                  Username ID
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Username"
                  required
                  disabled={loading}
                  className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm placeholder:text-slate-400 rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-slate-600 ml-0.5">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm placeholder:text-slate-400 rounded-lg"
                />
              </div>
              
              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-[11px] font-bold text-red-600 border border-red-100 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold h-12 text-sm transition-all shadow-md shadow-blue-200 rounded-xl active:scale-[0.98]" 
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifikasi...
                  </span>
                ) : (
                  'Masuk ke Sistem'
                )}
              </Button>
            </form>
            
            <div className="mt-8 text-center">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                HRIS Internal Security • v2.1
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer Luar: Font Diperkecil */}
        <div className="flex justify-between items-center px-2 text-[10px] text-slate-400 font-semibold font-sans uppercase tracking-tight">
          <span>&copy; 2026 PT. Multi Makmur</span>
          <span>Access Verified</span>
        </div>
      </div>
    </div>
  );
}