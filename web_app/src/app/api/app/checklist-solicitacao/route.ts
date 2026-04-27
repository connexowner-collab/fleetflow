import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest } from '@/utils/auth/session'

/** GET — verifica se há solicitação pendente para o motorista autenticado */
export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, tenant_id')
    .eq('email', session.email)
    .single()

  if (!profile) return NextResponse.json({ solicitacao: null })

  const { data } = await supabase
    .from('checklist_solicitacoes')
    .select('id, solicitante_nome, placa, mensagem, created_at')
    .eq('motorista_id', profile.id)
    .is('atendido_em', null)
    .is('cancelado_em', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({ solicitacao: data ?? null })
}

/** DELETE — motorista dispensa o popup (sem checklist — apenas para UI, não cancela a solicitação) */
export async function DELETE(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })

  // Não cancela — só informa que motorista viu. O cancelamento é feito pelo gestor.
  return NextResponse.json({ ok: true })
}
