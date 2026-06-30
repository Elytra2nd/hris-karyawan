'use client'

// Tombol yang membuka panel Notifikasi (lonceng di header) lewat CustomEvent
// global, sehingga komponen server (mis. banner dashboard) bisa memicunya tanpa
// shared state. NotificationBell mendengarkan event 'atms:open-notifications'.
export const OPEN_NOTIFICATIONS_EVENT = 'atms:open-notifications'

export function OpenNotificationsButton({
  className,
  children,
  ariaLabel,
}: {
  className?: string
  children: React.ReactNode
  ariaLabel?: string
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={className}
      onClick={() => window.dispatchEvent(new CustomEvent(OPEN_NOTIFICATIONS_EVENT))}
    >
      {children}
    </button>
  )
}
