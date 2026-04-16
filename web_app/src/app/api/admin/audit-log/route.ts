import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest } from '@/utils/session'

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request)
  if (!session || !['gestor', 'diretor', 'analista'].includes(session.perfil)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const acao       = searchParams.get('acao')
  const ator_email = searchParams.get('ator_email')
  const data_ini   = searchParams.get('data_ini')
  const data_fim   = searchParams.get('data_fim')
  const page       = parseInt(searchParams.get('page') ?? '1')
  const limit      = 50
  const offset     = (page - 1) * limit

  const db = createAdminClient()
  let q = db
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (acao)       q = q.eq('acao', acao)
  if (ator_email) q = q.ilike('ator_email', `%${ator_email}%`)
  if (data_ini)   q = q.gte('created_at', data_ini)
  if (data_fim)   q = q.lte('created_at', data_fim + 'T23:59:59Z')

  const { data, error, count } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ logs: data ?? [], total: count ?? 0, page, limit })
}
