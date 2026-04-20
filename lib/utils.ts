import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateAR(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('T')[0].split('-')
  return `${d}/${m}/${y}`
}

export function formatDateShort(dateStr: string | null | undefined): string {
  return formatDateAR(dateStr)
}

export function formatDateLong(dateStr: string | null | undefined, _includeYear = true): string {
  return formatDateAR(dateStr)
}
