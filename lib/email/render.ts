/**
 * Render de emails en HTML plano (sin dependencias extra: tablas + estilos inline,
 * que es lo único que respetan Gmail / Outlook).
 *
 * La idea es que ninguna plantilla escriba `<html>` a mano: arman bloques con los
 * helpers de acá y `renderEmail()` los envuelve en el layout de la comunidad y
 * genera además la versión texto plano.
 */

const COLORS = {
  bg: '#f4f4f5',
  card: '#ffffff',
  border: '#e4e4e7',
  text: '#18181b',
  muted: '#71717a',
  brand: '#1f4e79',
  brandText: '#ffffff',
} as const

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ─── Bloques ──────────────────────────────────────────────────────────────────

export type EmailBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  /** Pares etiqueta/valor — ideal para datos de un evento, pago, inscripción. */
  | { type: 'facts'; items: { label: string; value: string }[] }
  | { type: 'button'; label: string; url: string }
  | { type: 'note'; text: string }
  | { type: 'divider' }
  /** Escotilla de escape: HTML ya escapado por quien lo arma. */
  | { type: 'raw'; html: string; text?: string }

export const block = {
  heading: (text: string): EmailBlock => ({ type: 'heading', text }),
  paragraph: (text: string): EmailBlock => ({ type: 'paragraph', text }),
  list: (items: string[]): EmailBlock => ({ type: 'list', items }),
  facts: (items: { label: string; value: string }[]): EmailBlock => ({ type: 'facts', items }),
  button: (label: string, url: string): EmailBlock => ({ type: 'button', label, url }),
  note: (text: string): EmailBlock => ({ type: 'note', text }),
  divider: (): EmailBlock => ({ type: 'divider' }),
  raw: (html: string, text?: string): EmailBlock => ({ type: 'raw', html, text }),
}

function renderBlock(b: EmailBlock): string {
  switch (b.type) {
    case 'heading':
      return `<h2 style="margin:0 0 12px;font-size:20px;line-height:1.3;font-weight:600;color:${COLORS.text};">${escapeHtml(b.text)}</h2>`

    case 'paragraph':
      return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${COLORS.text};">${escapeHtml(b.text)}</p>`

    case 'list':
      return `<ul style="margin:0 0 16px;padding-left:20px;font-size:15px;line-height:1.6;color:${COLORS.text};">${b.items
        .map(i => `<li style="margin-bottom:6px;">${escapeHtml(i)}</li>`)
        .join('')}</ul>`

    case 'facts':
      return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 16px;border-collapse:collapse;">${b.items
        .map(
          ({ label, value }) => `<tr>
            <td style="padding:6px 12px 6px 0;font-size:14px;color:${COLORS.muted};white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
            <td style="padding:6px 0;font-size:14px;color:${COLORS.text};font-weight:500;">${escapeHtml(value)}</td>
          </tr>`
        )
        .join('')}</table>`

    case 'button':
      return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px;">
        <tr><td style="border-radius:6px;background:${COLORS.brand};">
          <a href="${escapeHtml(b.url)}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:600;color:${COLORS.brandText};text-decoration:none;border-radius:6px;">${escapeHtml(b.label)}</a>
        </td></tr>
      </table>`

    case 'note':
      return `<p style="margin:0 0 16px;padding:12px 14px;background:${COLORS.bg};border-left:3px solid ${COLORS.border};font-size:14px;line-height:1.6;color:${COLORS.muted};">${escapeHtml(b.text)}</p>`

    case 'divider':
      return `<hr style="border:none;border-top:1px solid ${COLORS.border};margin:24px 0;" />`

    case 'raw':
      return b.html
  }
}

function blockToText(b: EmailBlock): string {
  switch (b.type) {
    case 'heading':
      return `${b.text}\n${'-'.repeat(Math.min(b.text.length, 60))}`
    case 'paragraph':
      return b.text
    case 'list':
      return b.items.map(i => `• ${i}`).join('\n')
    case 'facts':
      return b.items.map(({ label, value }) => `${label}: ${value}`).join('\n')
    case 'button':
      return `${b.label}: ${b.url}`
    case 'note':
      return b.text
    case 'divider':
      return '---'
    case 'raw':
      return b.text ?? ''
  }
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export type RenderEmailOptions = {
  /** Título del documento; por defecto, el asunto. */
  title: string
  blocks: EmailBlock[]
  /** Texto de preview que muestran los clientes junto al asunto. */
  preheader?: string
  /** Pie opcional adicional (además del institucional). */
  footer?: string
}

export type RenderedEmail = { html: string; text: string }

export function renderEmail({ title, blocks, preheader, footer }: RenderEmailOptions): RenderedEmail {
  const body = blocks.map(renderBlock).join('\n')
  const footerText = footer ?? 'Este es un mensaje automático de la plataforma de la Comunidad CcD. Por favor, no respondas a este correo.'

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.bg};font-family:${FONT};">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>` : ''}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${COLORS.bg};padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background:${COLORS.card};border:1px solid ${COLORS.border};border-radius:10px;">
      <tr><td style="padding:20px 28px;border-bottom:1px solid ${COLORS.border};">
        <span style="font-size:15px;font-weight:700;color:${COLORS.brand};letter-spacing:0.02em;">Comunidad CcD</span>
      </td></tr>
      <tr><td style="padding:28px;">
${body}
      </td></tr>
      <tr><td style="padding:18px 28px;border-top:1px solid ${COLORS.border};">
        <p style="margin:0;font-size:12px;line-height:1.5;color:${COLORS.muted};">${escapeHtml(footerText)}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`

  const text = [title, '', ...blocks.map(blockToText).filter(Boolean), '', '---', footerText].join('\n\n')

  return { html, text }
}
