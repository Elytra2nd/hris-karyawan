import LoginForm from '@/components/login-form'

export default function LoginPage() {
  return (
    <main className="min-h-svh flex flex-col lg:grid lg:grid-cols-2">

      {/* ─── Panel Branding Biru ─── */}
      {/* Mobile: strip atas ±40vh · Desktop: kolom kiri penuh */}
      <div className="relative overflow-hidden bg-primary flex flex-col justify-between p-8 min-h-[38svh] lg:min-h-0 lg:p-12">
        {/* Dekoratif: lingkaran blur */}
        <div className="absolute -top-20 -left-20 w-52 h-52 lg:w-72 lg:h-72 rounded-full bg-white/5" />
        <div className="absolute top-1/3 -right-12 w-36 h-36 lg:-right-16 lg:w-56 lg:h-56 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 left-1/4 w-64 h-64 lg:w-96 lg:h-96 rounded-full bg-white/5" />
        <div className="hidden lg:block absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-white/10" />

        {/* Logo */}
        <div className="relative z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/astra-motor.png"
            alt="Astra Motor"
            className="h-7 lg:h-9 w-auto object-contain brightness-0 invert"
          />
        </div>

        {/* Greeting */}
        <div className="relative z-10 space-y-2 lg:space-y-4">
          <p aria-hidden="true" className="text-3xl lg:text-5xl font-bold text-white leading-snug">
            Selamat<br />Datang!
          </p>
          <p className="text-blue-100 text-sm lg:text-base leading-relaxed max-w-xs">
            Trainee Monitoring System — pantau dan kelola data trainee Astra Motor Kalimantan Barat.
          </p>
        </div>

        {/* Footer brand — hidden mobile, tampil desktop */}
        <div className="relative z-10 hidden lg:block">
          <p className="text-blue-200 text-sm">
            © 2026 PT Astra Motor Kalimantan Barat
          </p>
          <p className="text-blue-300/70 text-xs mt-1">
            Trainee Monitoring System v2.1
          </p>
        </div>
      </div>

      {/* ─── Panel Form ─── */}
      {/* Mobile: sisa layar ±60vh · Desktop: kolom kanan penuh */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 lg:py-12 bg-background">
        <LoginForm />
      </div>

    </main>
  )
}
