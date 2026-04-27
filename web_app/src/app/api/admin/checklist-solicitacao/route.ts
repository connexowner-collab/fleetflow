import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest } from '@/utils/auth/session'
import { sendPushToUser } from '@/utils/push'

/** POST — gestor solicita checklist para um motorista */
export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const body = await request.json()
  const { motorista_id, placa, mensagem } = body

  if (!motorista_id) return NextResponse.json({ error: 'motorista_id obrigatório.' }, { status: 400 })

  const supabase = createAdminClient()

  const { data: solicitante } = await supabase
    .from('profiles')
    .select('id, nome, tenant_id')
    .eq('email', session.email)
    .single()

  if (!solicitante) return NextResponse.json({ error: 'Solicitante não encontrado.' }, { status: 404 })

  const { data, error } = await supabase
    .from('checklist_solicitacoes')
    .insert({
      tenant_id:       solicitante.tenant_id,
      motorista_id,
      solicitante_id:  solicitante.id,
      solicitante_nome:solicitante.nome,
      placa:           placa ?? null,
      mensagem:        mensagem ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Web Push para o motorista
  sendPushToUser(motorista_id, {
    title: '📋 Checklist Solicitado',
    body:  `${solicitante.nome} solicitou um novo checklist. Acesse o app para realizá-lo.`,
    tag:   'checklist_solicitado',
    data:  { solicitacao_id: data.id },
  }).catch(console.error)

  return NextResponse.json({ solicitacao: data })
}

/** DELETE — gestor cancela a solicitação */
export async function DELETE(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('checklist_solicitacoes')
    .update({ cancelado_em: new Date().toISOString() })
    .eq('id', id)
    .is('atendido_em', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

/** GET — lista solicitações pendentes (para o painel do gestor) */
export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('email', session.email)
    .single()

  if (!profile) return NextResponse.json({ solicitacoes: [] })

  const { data } = await supabase
    .from('checklist_solicitacoes')
    .select('id, motorista_id, solicitante_nome, placa, mensagem, created_at, atendido_em, cancelado_em, profiles!motorista_id(nome, email)')
    .eq('tenant_id', profile.tenant_id)
    .is('cancelado_em', null)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ solicitacoes: data ?? [] })
}
