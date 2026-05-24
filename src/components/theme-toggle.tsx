'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import { Moon, Sun } from '@phosphor-icons/react'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
    )
  }

  const isDark = theme === 'dark'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="h-9 w-9 p-0"
        >
          {isDark ? (
            <Sun size={16} className="text-yellow-500" />
          ) : (
            <Moon size={16} className="text-foreground/70" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {isDark ? 'Mode Terang' : 'Mode Gelap'}
      </TooltipContent>
    </Tooltip>
  )
}
