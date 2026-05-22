type LogLevel = 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  context?: string
  [key: string]: unknown
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    message,
    ts: new Date().toISOString(),
    ...meta,
  }

  if (process.env.NODE_ENV === 'production') {
    // Structured JSON in production for log aggregators
    console[level](JSON.stringify(entry))
  } else {
    const prefix = `[${level.toUpperCase()}] ${entry.ts}`
    const suffix = meta ? JSON.stringify(meta) : ''
    console[level](`${prefix} ${message}`, suffix || '')
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
}
