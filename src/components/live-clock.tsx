'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'

export function LiveClock() {
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    setTime(new Date())
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  if (!time) return null

  return (
    <span className="font-mono tabular-nums">
      {format(time, 'HH:mm:ss', { locale: localeID })}
    </span>
  )
}
