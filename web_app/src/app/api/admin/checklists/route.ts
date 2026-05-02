import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest } from '@/utils/session'

// GET /api/admin/checklists?status=&search=&page=&limit=
export async function GET(request: Request) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const allowed = ['gestor', 'diretor', 'analista']
  if (!allowed.includes(session.perfil)) {
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
  }

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('email', session.email)
    .single()

  if (!profile?.tenant_id) {
    return NextResponse.json({ error: 'Tenant não encontrado.' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const status  = searchParams.get('status') ?? ''
  const search  = searchParams.get('search') ?? ''
  const page    = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit   = Math.min(100, parseInt(searchParams.get('limit') ?? '50'))
  const offset  = (page - 1) * limit

  let query = supabase
    .from('checklists')
    .select(
      'id, codigo, motorista_nome, placa, km_atual, status, tem_avaria, created_at, tipo_checklist',
      { count: 'exact' }
    )
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status && status !== 'Todos') {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(
      `placa.ilike.%${search}%,motorista_nome.ilike.%${search}%,codigo.ilike.%${search}%`
    )
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ checklists: data ?? [], total: count ?? 0, page, limit })
}

// PATCH /api/admin/checklists  { id, status, observacao_validacao? }
export async function PATCH(request: Request) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const allowed = ['gestor', 'diretor', 'analista']
  if (!allowed.includes(session.perfil)) {
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
  }

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('email', session.email)
    .single()

  if (!profile?.tenant_id) {
    return NextResponse.json({ error: 'Tenant não encontrado.' }, { status: 404 })
  }

  const body = await request.json() as { id: string; status: string; observacao_validacao?: string; motivo_recusa?: string }
  const { id, status, observacao_validacao, motivo_recusa } = body

  if (!id || !status) {
    return NextResponse.json({ error: 'id e status são obrigatórios.' }, { status: 400 })
  }

  const validStatuses = ['Aprovado', 'Recusado', 'Validado', 'Pendente', 'Cancelado']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Status inválido.' }, { status: 400 })
  }

  const update: Record<string, unknown> = { status }
  if (status === 'Validado' && observacao_validacao?.trim()) {
    update.observacao_validacao = observacao_validacao.trim()
  }
  if (status === 'Recusado') {
    update.motivo_recusa = motivo_recusa?.trim() ?? null
    update.recusa_lida   = false   // reset flag so motorista sees the new rejection
  }

  const { data, error } = await supabase
    .from('checklists')
    .update(update)
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .select('id, status')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ checklist: data })
}

// GET /api/admin/checklists/[id]/itens  → handled via separate route
// GET /api/admin/checklists/[id]/fotos  → handled via separate route
