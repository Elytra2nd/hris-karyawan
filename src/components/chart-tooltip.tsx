'use client'

// Tooltip chart bergaya shadcn: container memakai token tema (popover) sehingga
// otomatis gelap di dark-mode & terang di light-mode. Tiap baris = indicator
// kotak warna + nama + value (rata kanan, tabular-nums). Dipakai bersama oleh
// donut & bar chart agar konsisten.

interface TooltipItem {
  name?: string | number
  value?: string | number
  color?: string
  dataKey?: string | number
  payload?: Record<string, unknown>
}

interface ChartTooltipProps {
  active?: boolean
  payload?: TooltipItem[]
  /** Label di atas (mis. nama posisi/bulan). Kosongkan untuk sembunyikan. */
  label?: string | number
  /** Suffix tiap value, mis. " orang". */
  valueSuffix?: string
  /** Teks bantuan kecil di bawah (mis. "klik untuk filter"). */
  hint?: string
}

function resolveColor(item: TooltipItem): string {
  return (
    item.color ??
    (item.payload?.color as string | undefined) ??
    (item.payload?.fill as string | undefined) ??
    'var(--primary)'
  )
}

export function ChartTooltip({ active, payload, label, valueSuffix = '', hint }: ChartTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="min-w-[8rem] rounded-lg border border-border/60 bg-popover px-2.5 py-1.5 text-xs shadow-xl">
      {label != null && label !== '' && (
        <p className="mb-1.5 font-semibold text-popover-foreground">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ backgroundColor: resolveColor(item) }}
              aria-hidden="true"
            />
            <span className="text-muted-foreground">{item.name}</span>
            <span className="ml-auto pl-3 font-mono font-medium tabular-nums text-popover-foreground">
              {item.value}
              {valueSuffix}
            </span>
          </div>
        ))}
      </div>
      {hint && <p className="mt-1.5 text-[10px] text-muted-foreground/70">{hint}</p>}
    </div>
  )
}
