import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest } from '@/utils/session'

async function getTenantId(email: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('email', email)
    .single()
  return data?.tenant_id ?? null
}

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const tenantId = await getTenantId(session.email)
  if (!tenantId) return NextResponse.json({ opcoes: [] })

  const { searchParams } = new URL(request.url)
  const categoria = searchParams.get('categoria')

  const supabase = createAdminClient()
  let query = supabase
    .from('config_opcoes')
    .select('id, categoria, valor, ativo')
    .eq('tenant_id', tenantId)
    .eq('ativo', true)
    .order('valor')

  if (categoria) query = query.eq('categoria', categoria)

  const { data, error } = await query
  if (error) return NextResponse.json({ opcoes: [] })

  return NextResponse.json({ opcoes: data ?? [] })
}

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  if (!['gestor', 'diretor', 'analista'].includes(session.perfil))
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })

  const tenantId = await getTenantId(session.email)
  if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado.' }, { status: 404 })

  const { categoria, valor } = await request.json()
  if (!categoria || !valor?.trim())
    return NextResponse.json({ error: 'Campos obrigatórios.' }, { status: 400 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('config_opcoes')
    .insert({ tenant_id: tenantId, categoria, valor: valor.trim(), ativo: true })
    .select('id, categoria, valor, ativo')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ opcao: data })
}

export async function DELETE(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  if (!['gestor', 'diretor', 'analista'].includes(session.perfil))
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })

  const tenantId = await getTenantId(session.email)
  if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado.' }, { status: 404 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400 })

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('config_opcoes')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
