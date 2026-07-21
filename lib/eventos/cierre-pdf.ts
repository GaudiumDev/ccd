// PDF export helpers para el cierre de convivencia. Usa jsPDF (importado dinámicamente).
// Client-only.
import type jsPDF from 'jspdf'
import { formatDateAR } from '@/lib/utils'
import type { PreguntaInforme, Movimiento } from './cierre'
import { calcularResumenEconomico, formatMonto } from './cierre'

const fmt = (n: number) => `$${formatMonto(n)}`

const MARGIN = 15
const LINE = 6

type Cursor = { doc: jsPDF; y: number }

function nuevaPagina(c: Cursor) {
  c.doc.addPage()
  c.y = MARGIN
}

function ensureSpace(c: Cursor, needed: number) {
  const pageH = c.doc.internal.pageSize.getHeight()
  if (c.y + needed > pageH - MARGIN) nuevaPagina(c)
}

function writeWrapped(c: Cursor, text: string, opts?: { size?: number; bold?: boolean; gap?: number }) {
  const size = opts?.size ?? 11
  const pageW = c.doc.internal.pageSize.getWidth()
  c.doc.setFontSize(size)
  c.doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal')
  const lines = c.doc.splitTextToSize(text || '—', pageW - MARGIN * 2) as string[]
  for (const line of lines) {
    ensureSpace(c, LINE)
    c.doc.text(line, MARGIN, c.y)
    c.y += LINE
  }
  if (opts?.gap) c.y += opts.gap
}

function encabezado(c: Cursor, titulo: string, evento: EventoInfo) {
  writeWrapped(c, titulo, { size: 16, bold: true })
  c.y += 1
  const sub = [
    evento.nombre,
    evento.fecha_inicio ? formatDateAR(evento.fecha_inicio.split('T')[0]) : null,
    evento.confraternidad_nombre,
  ].filter(Boolean).join('  ·  ')
  writeWrapped(c, sub, { size: 10 })
  c.y += 2
  const pageW = c.doc.internal.pageSize.getWidth()
  c.doc.setDrawColor(180)
  c.doc.line(MARGIN, c.y, pageW - MARGIN, c.y)
  c.y += 6
}

async function nuevoDoc(): Promise<jsPDF> {
  const { default: JsPDF } = await import('jspdf')
  return new JsPDF({ unit: 'mm', format: 'a4' })
}

function nombreArchivo(evento: EventoInfo, sufijo: string): string {
  const base = (evento.nombre || 'evento').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-')
  return `${base}-${sufijo}.pdf`
}

export type EventoInfo = {
  nombre: string
  fecha_inicio: string | null
  confraternidad_nombre: string | null
}

// ─── Listado de conviventes ───────────────────────────────────────────────────

export async function exportConviventesPDF(
  evento: EventoInfo,
  conviventes: { nombre: string; apellido: string; email?: string | null; telefono?: string | null; rol: string }[],
) {
  const doc = await nuevoDoc()
  const c: Cursor = { doc, y: MARGIN }
  encabezado(c, 'Listado de Conviventes', evento)
  writeWrapped(c, `Total: ${conviventes.length}`, { size: 10, gap: 2 })
  conviventes.forEach((p, i) => {
    const contacto = [p.email, p.telefono].filter(Boolean).join(' · ')
    const linea = `${i + 1}. ${p.apellido}, ${p.nombre}${p.rol ? `  (${p.rol})` : ''}${contacto ? `  —  ${contacto}` : ''}`
    writeWrapped(c, linea, { size: 10 })
  })
  doc.save(nombreArchivo(evento, 'conviventes'))
}

// ─── Informe del Coordinador (confidencial) ───────────────────────────────────

export async function exportInformeCoordinadorPDF(
  evento: EventoInfo,
  preguntas: PreguntaInforme[],
  respuestas: Record<string, string>,
) {
  const doc = await nuevoDoc()
  const c: Cursor = { doc, y: MARGIN }
  encabezado(c, 'Informe del Coordinador', evento)
  writeWrapped(c, 'CONFIDENCIAL', { size: 9, bold: true, gap: 3 })
  preguntas.forEach((p, i) => {
    writeWrapped(c, `${i + 1}. ${p.texto}`, { size: 11, bold: true })
    writeWrapped(c, respuestas?.[p.id] || '—', { size: 11, gap: 4 })
  })
  doc.save(nombreArchivo(evento, 'informe-coordinador'))
}

// ─── Informe de Carismas (confidencial) ───────────────────────────────────────

export async function exportInformeCarismasPDF(
  evento: EventoInfo,
  carismas: { nombre: string; texto: string }[],
) {
  const doc = await nuevoDoc()
  const c: Cursor = { doc, y: MARGIN }
  encabezado(c, 'Informe de Carismas del Equipo', evento)
  writeWrapped(c, 'CONFIDENCIAL', { size: 9, bold: true, gap: 3 })
  carismas.forEach(item => {
    writeWrapped(c, item.nombre, { size: 11, bold: true })
    writeWrapped(c, item.texto || '—', { size: 11, gap: 4 })
  })
  doc.save(nombreArchivo(evento, 'informe-carismas'))
}

// ─── Informe económico ────────────────────────────────────────────────────────

export async function exportInformeEconomicoPDF(evento: EventoInfo, movimientos: Movimiento[]) {
  const doc = await nuevoDoc()
  const c: Cursor = { doc, y: MARGIN }
  encabezado(c, 'Informe Económico', evento)
  const { ingresos, egresos, saldo, diezmo } = calcularResumenEconomico(movimientos)

  writeWrapped(c, 'Movimientos', { size: 12, bold: true, gap: 1 })
  movimientos.forEach(m => {
    const concepto = m.concepto || (m.tipo === 'ingreso' ? m.subtipo_ingreso : m.categoria_egreso) || m.tipo
    const signo = m.tipo === 'ingreso' ? '+' : '−'
    const fecha = m.fecha ? formatDateAR(m.fecha) : ''
    writeWrapped(c, `${signo} ${fmt(Number(m.monto))}  ${concepto}${fecha ? `  (${fecha})` : ''}`, { size: 10 })
  })
  c.y += 4
  writeWrapped(c, `Ingresos: ${fmt(ingresos)}`, { size: 11 })
  writeWrapped(c, `Egresos: ${fmt(egresos)}`, { size: 11 })
  writeWrapped(c, `Saldo: ${fmt(saldo)}`, { size: 12, bold: true })
  writeWrapped(c, `Diezmo (20% al Equipo Timón): ${fmt(diezmo)}`, { size: 11, bold: true })
  doc.save(nombreArchivo(evento, 'informe-economico'))
}
