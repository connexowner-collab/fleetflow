import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest } from '@/utils/session'

// GET /api/admin/frota/documentos?veiculo_id=xxx
export async function GET(request: Request) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const veiculo_id = searchParams.get('veiculo_id')
  if (!veiculo_id) return NextResponse.json({ error: 'veiculo_id obrigatório' }, { status: 400 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('veiculo_documentos')
    .select('id, tipo, numero, data_vencimento, observacao')
    .eq('veiculo_id', veiculo_id)
    .order('tipo')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ documentos: data ?? [] })
}

// PATCH /api/admin/frota/documentos
export async function PATCH(request: Request) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const supabase = createAdminClient()
  const body = await request.json()
  const { id, numero, data_vencimento, observacao } = body

  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const { error } = await supabase
    .from('veiculo_documentos')
    .update({
      numero: numero || null,
      data_vencimento: data_vencimento || null,
      observacao: observacao || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// POST /api/admin/frota/documentos
export async function POST(request: Request) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const supabase = createAdminClient()
  const body = await request.json()
  const { veiculo_id, tipo, numero, data_vencimento, observacao } = body

  if (!veiculo_id || !tipo) {
    return NextResponse.json({ error: 'veiculo_id e tipo são obrigatórios' }, { status: 400 })
  }

  try {
    // Busca o tenant_id da empresa
    const { data: tenant } = await supabase.from('tenants').select('id').single()
    if (!tenant) throw new Error('Tenant não encontrado')

    const { error } = await supabase
      .from('veiculo_documentos')
      .insert({
        tenant_id: tenant.id,
        veiculo_id,
        tipo,
        numero: numero || null,
        data_vencimento: data_vencimento || null,
        observacao: observacao || null,
      })

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
