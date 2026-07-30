import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { obtenerAccessTokenVigente } from '@/lib/mercadopago/org-account'

function isValidSignature(request: Request, dataId: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) return true // sin secret configurado, no se puede validar (solo para desarrollo)

  const signatureHeader = request.headers.get('x-signature')
  const requestId = request.headers.get('x-request-id')
  if (!signatureHeader || !requestId) return false

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((p) => {
      const [k, v] = p.split('=')
      return [k?.trim(), v?.trim()]
    })
  )
  const ts = parts.ts
  const v1 = parts.v1
  if (!ts || !v1) return false

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`
  const expected = createHmac('sha256', secret).update(manifest).digest('hex')

  const expectedBuf = Buffer.from(expected)
  const receivedBuf = Buffer.from(v1)
  if (expectedBuf.length !== receivedBuf.length) return false
  return timingSafeEqual(expectedBuf, receivedBuf)
}

export async function POST(request: Request) {
  const url = new URL(request.url)
  let body: { type?: string; action?: string; data?: { id?: string } } = {}
  try {
    body = await request.json()
  } catch {
    // algunas notificaciones no traen body (ej. pruebas manuales)
  }

  const type = body.type ?? url.searchParams.get('type') ?? undefined
  const dataId = body.data?.id ?? url.searchParams.get('data.id') ?? undefined

  if (type !== 'payment' || !dataId) {
    return NextResponse.json({ ok: true })
  }

  if (!isValidSignature(request, dataId)) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
  }

  // Cada organización tiene su propio access_token de Mercado Pago, y un pago solo
  // puede consultarse con el token de la cuenta que lo recibió. Por eso al crear la
  // preferencia embebemos nuestro pagos.id en notification_url: nos permite ubicar
  // la organización ANTES de llamar a payment.get (no alcanza con external_reference,
  // que recién conocemos después de esa llamada).
  const pagoId = url.searchParams.get('pago_id')
  if (!pagoId) {
    return NextResponse.json({ ok: true })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: pago } = await supabaseAdmin
    .from('pagos')
    .select('id, mp_payment_id, mp_organizacion_id, evento_participante_id')
    .eq('id', pagoId)
    .maybeSingle()

  if (!pago || !pago.mp_organizacion_id) {
    return NextResponse.json({ ok: true })
  }

  const accessToken = await obtenerAccessTokenVigente(pago.mp_organizacion_id)
  if (!accessToken) {
    return NextResponse.json({ ok: true })
  }

  const client = new MercadoPagoConfig({ accessToken })
  const paymentClient = new Payment(client)

  let payment
  try {
    payment = await paymentClient.get({ id: dataId })
  } catch {
    return NextResponse.json({ error: 'No se pudo consultar el pago' }, { status: 502 })
  }

  // Idempotencia: ya procesamos este mismo pago de Mercado Pago
  if (pago.mp_payment_id != null && String(pago.mp_payment_id) === String(payment.id)) {
    return NextResponse.json({ ok: true })
  }

  const estadoPago =
    payment.status === 'approved' ? 'confirmado' : payment.status === 'rejected' || payment.status === 'cancelled' ? 'rechazado' : 'pendiente'

  await supabaseAdmin
    .from('pagos')
    .update({ estado_pago: estadoPago, mp_payment_id: payment.id })
    .eq('id', pago.id)

  if (estadoPago === 'confirmado') {
    await supabaseAdmin
      .from('evento_participantes')
      .update({ estado_participacion: 'inscripto' })
      .eq('id', pago.evento_participante_id)
      .eq('estado_participacion', 'interesado')
  }

  return NextResponse.json({ ok: true })
}
