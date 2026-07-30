/**
 * Origin público real de la request. Detrás de un túnel (VS Code Dev Tunnels,
 * ngrok) o un proxy, el Host que le llega a Next.js sigue siendo `localhost`
 * aunque el protocolo público sea https — por eso hay que preferir
 * x-forwarded-host/x-forwarded-proto cuando están presentes.
 */
export function getPublicOrigin(request: Request): string {
  const headers = request.headers
  const forwardedHost = headers.get('x-forwarded-host')
  const forwardedProto = headers.get('x-forwarded-proto')

  if (forwardedHost) {
    return `${forwardedProto ?? 'https'}://${forwardedHost}`
  }

  return new URL(request.url).origin
}
