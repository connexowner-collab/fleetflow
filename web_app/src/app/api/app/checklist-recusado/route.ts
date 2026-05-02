import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest } from '@/utils/session'

// GET /api/app/checklist-recusado
// Retorna checklists do motorista com status Recusado e recusa_lida=false
export async function GET(request: Request) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, tenant_id')
    .eq('email', session.email)
    .single()

  if (!profile) return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 })

  const { data, error } = await supabase
    .from('checklists')
    .select('id, codigo, placa, veiculo_nome, created_at, motivo_recusa')
    .eq('motorista_id', profile.id)
    .eq('tenant_id', profile.tenant_id)
    .eq('status', 'Recusado')
    .eq('recusa_lida', false)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ recusados: data ?? [] })
}

// PATCH /api/app/checklist-recusado  { id }
// Marca um checklist recusado como lido pelo motorista
export async function PATCH(request: Request) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, tenant_id')
    .eq('email', session.email)
    .single()

  if (!profile) return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 })

  const body = await request.json() as { id: string }
  const { id } = body
  if (!id) return NextResponse.json({ error: 'id é obrigatório.' }, { status: 400 })

  const { error } = await supabase
    .from('checklists')
    .update({ recusa_lida: true })
    .eq('id', id)
    .eq('motorista_id', profile.id)
    .eq('tenant_id', profile.tenant_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
