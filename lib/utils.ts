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
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('T')[0].split('-')
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`
}

export function formatDateLong(dateStr: string | null | undefined, includeYear = true): string {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('T')[0].split('-')
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  return includeYear ? `${parseInt(d)} de ${months[parseInt(m)-1]} de ${y}` : `${parseInt(d)} de ${months[parseInt(m)-1]}`
}
