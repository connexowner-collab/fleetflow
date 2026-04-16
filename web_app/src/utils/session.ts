/**
 * Session utility for API routes that accept plain `Request` objects.
 * For routes using NextRequest, see @/utils/auth/session instead.
 */

export interface SessionUser {
  email: string
  perfil: string
  nome: string
  sv?: number
}

/**
 * Extracts and decodes the fleetflow-session cookie from a standard Request.
 * The cookie value is a base64-encoded JSON string with { email, perfil, nome, sv }.
 */
export async function getSessionFromRequest(request: Request): Promise<SessionUser | null> {
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return null

  const match = cookieHeader.match(/(?:^|;\s*)fleetflow-session=([^;]+)/)
  if (!match?.[1]) return null

  try {
    const decoded = Buffer.from(match[1], 'base64').toString('utf-8')
    const parsed = JSON.parse(decoded)
    if (!parsed.email || !parsed.perfil) return null
    return {
      email: parsed.email,
      perfil: parsed.perfil,
      nome: parsed.nome ?? parsed.email,
      sv: parsed.sv,
    }
  } catch {
    return null
  }
}
