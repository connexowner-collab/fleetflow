import { NextResponse, NextRequest } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest, canManageFleet } from '@/utils/auth/session'

// GET /api/admin/frota/documentos?veiculo_id=xxx
export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const veiculo_id = searchParams.get('veiculo_id')
  if (!veiculo_id) return NextResponse.json({ error: 'veiculo_id obrigatório' }, { status: 400 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('veiculo_documentos')
    .select('id, tipo, data_vencimento, observacao, url_anexo')
    .eq('veiculo_id', veiculo_id)
    .order('tipo')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ documentos: data ?? [] })
}

// PATCH /api/admin/frota/documentos
export async function PATCH(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session || !canManageFleet(session.perfil)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const body = await request.json()
  const { id, data_vencimento, observacao, url_anexo } = body

  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const { error } = await supabase
    .from('veiculo_documentos')
    .update({
      data_vencimento: data_vencimento || null,
      observacao: observacao || null,
      url_anexo: url_anexo || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// POST /api/admin/frota/documentos
export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session || !canManageFleet(session.perfil)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const body = await request.json()
  const { veiculo_id, tipo, data_vencimento, observacao, url_anexo } = body

  if (!veiculo_id || !tipo) {
    return NextResponse.json({ error: 'veiculo_id e tipo são obrigatórios' }, { status: 400 })
  }

  try {
    // Busca o tenant_id do perfil do usuário
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('email', session.email)
      .single()

    if (!userProfile?.tenant_id) throw new Error('Tenant não encontrado para este usuário')

    const { error } = await supabase
      .from('veiculo_documentos')
      .upsert({
        tenant_id: userProfile.tenant_id,
        veiculo_id,
        tipo,
        data_vencimento: data_vencimento || null,
        observacao: observacao || null,
        url_anexo: url_anexo || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'veiculo_id,tipo' })

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
