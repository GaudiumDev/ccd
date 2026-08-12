import { formatMonto } from '@/lib/eventos/cierre'
import { formatDateAR } from '@/lib/utils'

import { block, type EmailBlock } from './render'
import { defineTemplate } from './template'

/**
 * Catálogo de plantillas de la plataforma.
 *
 * Para agregar una: exportá un `defineTemplate<Props>({ subject, blocks })` acá
 * y usala con `sendTemplateEmail(templates.miPlantilla, props, { to })`.
 * Nada más hay que tocar.
 */

// ─── Genérica ─────────────────────────────────────────────────────────────────

export type EmailGenericoProps = {
  titulo: string
  asunto?: string
  parrafos: string[]
  datos?: { label: string; value: string }[]
  cta?: { label: string; url: string }
  nota?: string
}

export const generico = defineTemplate<EmailGenericoProps>({
  subject: p => p.asunto ?? p.titulo,
  preheader: p => p.parrafos[0] ?? p.titulo,
  blocks: p => {
    const blocks: EmailBlock[] = [block.heading(p.titulo)]
    for (const texto of p.parrafos) blocks.push(block.paragraph(texto))
    if (p.datos?.length) blocks.push(block.facts(p.datos))
    if (p.cta) blocks.push(block.button(p.cta.label, p.cta.url))
    if (p.nota) blocks.push(block.note(p.nota))
    return blocks
  },
})

// ─── Acceso a la plataforma ───────────────────────────────────────────────────

export type AccesoCreadoProps = {
  nombre: string
  nombreUsuario: string
  passwordTemporal?: string
  loginUrl: string
}

export const accesoCreado = defineTemplate<AccesoCreadoProps>({
  subject: () => 'Tu acceso a la plataforma de la Comunidad CcD',
  preheader: p => `Usuario: ${p.nombreUsuario}`,
  tags: () => ({ categoria: 'acceso' }),
  blocks: p => {
    const blocks: EmailBlock[] = [
      block.heading(`¡Hola, ${p.nombre}!`),
      block.paragraph('Ya podés ingresar a la plataforma de la Comunidad CcD con estos datos:'),
      block.facts([
        { label: 'Usuario', value: p.nombreUsuario },
        ...(p.passwordTemporal ? [{ label: 'Contraseña temporal', value: p.passwordTemporal }] : []),
      ]),
      block.button('Ingresar a la plataforma', p.loginUrl),
    ]
    if (p.passwordTemporal) {
      blocks.push(block.note('Por seguridad, cambiá la contraseña temporal la primera vez que ingreses.'))
    }
    return blocks
  },
})

// ─── Inscripciones ────────────────────────────────────────────────────────────

export type InscripcionProps = {
  nombre: string
  evento: string
  fechaInicio?: string | null
  fechaFin?: string | null
  lugar?: string | null
  detalleUrl?: string
  /** Estado de la inscripción para ajustar el mensaje. */
  estado?: 'confirmado' | 'pendiente' | 'lista_espera'
}

function datosEvento(p: InscripcionProps) {
  const datos = [{ label: 'Evento', value: p.evento }]
  if (p.fechaInicio) {
    const rango =
      p.fechaFin && p.fechaFin !== p.fechaInicio
        ? `${formatDateAR(p.fechaInicio)} al ${formatDateAR(p.fechaFin)}`
        : formatDateAR(p.fechaInicio)
    datos.push({ label: 'Fecha', value: rango })
  }
  if (p.lugar) datos.push({ label: 'Lugar', value: p.lugar })
  return datos
}

export const inscripcionRegistrada = defineTemplate<InscripcionProps>({
  subject: p =>
    p.estado === 'lista_espera'
      ? `Estás en lista de espera: ${p.evento}`
      : p.estado === 'pendiente'
        ? `Recibimos tu inscripción a ${p.evento}`
        : `Inscripción confirmada: ${p.evento}`,
  preheader: p => p.evento,
  tags: p => ({ categoria: 'inscripcion', estado: p.estado ?? 'confirmado' }),
  blocks: p => {
    const mensaje =
      p.estado === 'lista_espera'
        ? 'Quedaste en lista de espera. Te avisamos apenas se libere un lugar.'
        : p.estado === 'pendiente'
          ? 'Recibimos tu inscripción. Te confirmamos el lugar en los próximos días.'
          : 'Tu inscripción quedó confirmada. ¡Te esperamos!'

    const blocks: EmailBlock[] = [
      block.heading(`¡Hola, ${p.nombre}!`),
      block.paragraph(mensaje),
      block.facts(datosEvento(p)),
    ]
    if (p.detalleUrl) blocks.push(block.button('Ver detalle del evento', p.detalleUrl))
    return blocks
  },
})

export const recordatorioEvento = defineTemplate<InscripcionProps & { diasRestantes?: number }>({
  subject: p => `Recordatorio: ${p.evento}`,
  preheader: p => (p.fechaInicio ? `Comienza el ${formatDateAR(p.fechaInicio)}` : p.evento),
  tags: () => ({ categoria: 'recordatorio' }),
  blocks: p => {
    const cuando =
      typeof p.diasRestantes === 'number'
        ? p.diasRestantes === 0
          ? 'Es hoy.'
          : p.diasRestantes === 1
            ? 'Es mañana.'
            : `Faltan ${p.diasRestantes} días.`
        : ''

    const blocks: EmailBlock[] = [
      block.heading(`¡Hola, ${p.nombre}!`),
      block.paragraph(`Te recordamos tu participación en ${p.evento}. ${cuando}`.trim()),
      block.facts(datosEvento(p)),
    ]
    if (p.detalleUrl) blocks.push(block.button('Ver detalle del evento', p.detalleUrl))
    return blocks
  },
})

// ─── Pagos ────────────────────────────────────────────────────────────────────

export type PagoProps = {
  nombre: string
  evento: string
  monto: number
  moneda?: string
  medioPago?: string
  fechaPago?: string | null
  motivo?: string
  detalleUrl?: string
}

export const pagoConfirmado = defineTemplate<PagoProps>({
  subject: p => `Pago confirmado — ${p.evento}`,
  preheader: p => `${p.moneda ?? '$'} ${formatMonto(p.monto)}`,
  tags: () => ({ categoria: 'pago', estado: 'confirmado' }),
  blocks: p => {
    const blocks: EmailBlock[] = [
      block.heading('Confirmamos tu pago'),
      block.paragraph(`¡Hola, ${p.nombre}! Registramos tu pago para ${p.evento}.`),
      block.facts([
        { label: 'Monto', value: `${p.moneda ?? '$'} ${formatMonto(p.monto)}` },
        ...(p.medioPago ? [{ label: 'Medio de pago', value: p.medioPago }] : []),
        ...(p.fechaPago ? [{ label: 'Fecha', value: formatDateAR(p.fechaPago) }] : []),
      ]),
    ]
    if (p.detalleUrl) blocks.push(block.button('Ver mi inscripción', p.detalleUrl))
    return blocks
  },
})

export const pagoRechazado = defineTemplate<PagoProps>({
  subject: p => `No pudimos validar tu pago — ${p.evento}`,
  preheader: p => p.motivo ?? 'Revisá los datos del comprobante',
  tags: () => ({ categoria: 'pago', estado: 'rechazado' }),
  blocks: p => {
    const blocks: EmailBlock[] = [
      block.heading('No pudimos validar tu pago'),
      block.paragraph(`¡Hola, ${p.nombre}! Revisamos el comprobante que enviaste para ${p.evento} y no pudimos confirmarlo.`),
      block.facts([
        { label: 'Monto informado', value: `${p.moneda ?? '$'} ${formatMonto(p.monto)}` },
        ...(p.medioPago ? [{ label: 'Medio de pago', value: p.medioPago }] : []),
      ]),
    ]
    if (p.motivo) blocks.push(block.note(`Motivo: ${p.motivo}`))
    if (p.detalleUrl) blocks.push(block.button('Cargar nuevamente el comprobante', p.detalleUrl))
    return blocks
  },
})

// ─── Eventos ──────────────────────────────────────────────────────────────────

export type EventoEstadoProps = {
  evento: string
  organizacion?: string | null
  fechaInicio?: string | null
  lugar?: string | null
  detalleUrl?: string
  /** Comentario del Equipo Timón / responsable (motivo de la decisión). */
  comentario?: string | null
}

export const eventoAprobado = defineTemplate<EventoEstadoProps>({
  subject: p => `Evento aprobado: ${p.evento}`,
  tags: () => ({ categoria: 'evento', estado: 'aprobado' }),
  blocks: p => {
    const blocks: EmailBlock[] = [
      block.heading('El evento fue aprobado'),
      block.paragraph(`${p.evento} ya está aprobado y puede avanzar a publicación.`),
      block.facts([
        ...(p.organizacion ? [{ label: 'Organización', value: p.organizacion }] : []),
        ...(p.fechaInicio ? [{ label: 'Fecha', value: formatDateAR(p.fechaInicio) }] : []),
        ...(p.lugar ? [{ label: 'Lugar', value: p.lugar }] : []),
      ]),
    ]
    if (p.comentario) blocks.push(block.note(p.comentario))
    if (p.detalleUrl) blocks.push(block.button('Ver evento', p.detalleUrl))
    return blocks
  },
})

export const eventoSuspendido = defineTemplate<EventoEstadoProps>({
  subject: p => `Evento suspendido: ${p.evento}`,
  tags: () => ({ categoria: 'evento', estado: 'suspendido' }),
  blocks: p => {
    const blocks: EmailBlock[] = [
      block.heading('El evento fue suspendido'),
      block.paragraph(`Te informamos que ${p.evento} quedó suspendido.`),
      block.facts([
        ...(p.organizacion ? [{ label: 'Organización', value: p.organizacion }] : []),
        ...(p.fechaInicio ? [{ label: 'Fecha prevista', value: formatDateAR(p.fechaInicio) }] : []),
      ]),
    ]
    if (p.comentario) blocks.push(block.note(`Motivo: ${p.comentario}`))
    if (p.detalleUrl) blocks.push(block.button('Ver evento', p.detalleUrl))
    return blocks
  },
})

// ─── Registro ─────────────────────────────────────────────────────────────────

export const templates = {
  generico,
  accesoCreado,
  inscripcionRegistrada,
  recordatorioEvento,
  pagoConfirmado,
  pagoRechazado,
  eventoAprobado,
  eventoSuspendido,
} as const

export type TemplateName = keyof typeof templates
