import { NextResponse, NextRequest } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest, canManageFleet } from '@/utils/auth/session'

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session || !canManageFleet(session.perfil)) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const dataInicio = searchParams.get('data_inicio')
  const dataFim = searchParams.get('data_fim')
  const atorEmail = searchParams.get('ator_email')
  const acao = searchParams.get('acao')
  const usuarioAfetado = searchParams.get('usuario_afetado')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 50

  const supabase = createAdminClient()
  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (dataInicio) query = query.gte('created_at', dataInicio)
  if (dataFim) query = query.lte('created_at', dataFim + 'T23:59:59Z')
  if (atorEmail) query = query.ilike('ator_email', `%${atorEmail}%`)
  if (acao) query = query.eq('acao', acao)
  if (usuarioAfetado) query = query.ilike('usuario_afetado_email', `%${usuarioAfetado}%`)

  const { data: logs, error, count } = await query

  if (error) return NextResponse.json({ logs: [], total: 0 })

  return NextResponse.json({ logs: logs ?? [], total: count ?? 0, page, limit })
}
