// Crea accesos (auth.users) para los cecistas importados.
//
// Login = SOLO el nombre de usuario (la app le agrega @ccd.internal por detrás,
// invisible para el cecista). Password inicial = el mismo nombre de usuario (TEMPORAL).
//
// - Normaliza el username a ASCII (ñ→n, sin tildes) porque el email interno oculto
//   no admite caracteres no-ASCII. Guarda esa versión en personas.nombre_usuario,
//   así lo que teclea el cecista coincide.
// - Idempotente: saltea los que ya tienen login (auth_user_id) o cuyo email ya existe.
// - Usa el Admin API (service role). Un trigger de la DB crea el perfil y enlaza
//   personas.auth_user_id vía user_metadata.persona_id (igual que /api/personas/invite).
//
// Uso:
//   node scripts/create_cecista_logins.mjs --dry-run     # simula, no escribe nada
//   node scripts/create_cecista_logins.mjs               # crea los accesos
//   node scripts/create_cecista_logins.mjs --limit 20    # probar con pocos primero
//
// Requiere en .env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { readFileSync, writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

// ─── cargar .env (simple, sin dependencias) ───────────────────────────────────
try {
  for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch { /* si no hay .env, se usan las env vars del entorno */ }

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY_ = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!URL_ || !KEY_) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env')
  process.exit(1)
}

const DRY = process.argv.includes('--dry-run')
const limitArg = process.argv.indexOf('--limit')
const LIMIT = limitArg > -1 ? parseInt(process.argv[limitArg + 1], 10) : Infinity
const CONCURRENCY = 5

const admin = createClient(URL_, KEY_, { auth: { autoRefreshToken: false, persistSession: false } })

// ñ→n, quita tildes, minúsculas
const toAscii = (s) =>
  s.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/ñ/gi, 'n').toLowerCase().trim()

// ─── traer cecistas que aún no tienen login ───────────────────────────────────
async function fetchPending() {
  const out = []
  const PAGE = 1000
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin
      .from('personas')
      .select('id, nombre_usuario, auth_user_id')
      .eq('tipo_persona', 'cecista')
      .not('nombre_usuario', 'is', null)
      .is('auth_user_id', null)
      .order('codigo_interno', { ascending: true })
      .range(from, from + PAGE - 1)
    if (error) throw error
    out.push(...data)
    if (data.length < PAGE) break
  }
  return out
}

async function processOne(p) {
  const user = toAscii(p.nombre_usuario)
  if (!user) return { status: 'skip', reason: 'username vacío', id: p.id }

  if (DRY) return { status: 'dry', user }

  // sincronizar el username a la versión ASCII si cambió
  if (user !== p.nombre_usuario) {
    const { error } = await admin.from('personas').update({ nombre_usuario: user }).eq('id', p.id)
    if (error && error.code === '23505')
      return { status: 'fail', user, reason: 'username ASCII ya en uso' }
    if (error) return { status: 'fail', user, reason: error.message }
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: `${user}@ccd.internal`,
    password: user, // TEMPORAL = el mismo usuario
    email_confirm: true,
    user_metadata: { persona_id: p.id },
  })

  if (error) {
    if (/already.*registered|already been registered/i.test(error.message))
      return { status: 'exists', user }
    return { status: 'fail', user, reason: error.message }
  }

  // respaldo: enlazar auth_user_id explícitamente (el trigger también lo hace)
  if (data?.user) await admin.from('personas').update({ auth_user_id: data.user.id }).eq('id', p.id)
  return { status: 'created', user }
}

// ─── main ─────────────────────────────────────────────────────────────────────
const pending = (await fetchPending()).slice(0, LIMIT === Infinity ? undefined : LIMIT)
console.log(`${DRY ? '[DRY-RUN] ' : ''}Cecistas sin login: ${pending.length}`)

const counts = { created: 0, exists: 0, skip: 0, fail: 0, dry: 0 }
const failures = []
let done = 0

for (let i = 0; i < pending.length; i += CONCURRENCY) {
  const batch = pending.slice(i, i + CONCURRENCY)
  const results = await Promise.all(batch.map(processOne))
  for (const r of results) {
    counts[r.status] = (counts[r.status] || 0) + 1
    if (r.status === 'fail') failures.push(r)
  }
  done += batch.length
  if (done % 100 === 0 || done === pending.length)
    process.stdout.write(`\r  procesados ${done}/${pending.length}`)
}
process.stdout.write('\n')

console.log('\nResumen:', counts)
if (failures.length) {
  const path = new URL('./cecista_logins_fallidos.json', import.meta.url)
  writeFileSync(path, JSON.stringify(failures, null, 2))
  console.log(`Fallidos (${failures.length}) guardados en scripts/cecista_logins_fallidos.json`)
}
if (!DRY && counts.created)
  console.log('\n⚠️  Password inicial = nombre de usuario (TEMPORAL). Forzar cambio en el primer login.')
