import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { logAudit, getClientIp, AuditAcao } from '@/utils/audit'
import { cookies } from 'next/headers'

function getSession() {
  try {
    const cookieStore = cookies()
    const raw = cookieStore.get('fleetflow-session')?.value
    if (!raw) return null
    return JSON.parse(Buffer.from(raw, 'base64').toString('utf8')) as {
      id: string; email: string; perfil: string; nome: string; tenant_id?: string
    }
  } catch { return null }
}

const db = () => createAdminClient()

const STATUS_LABEL: Record<string, string> = {
  aguardando_atendimento: 'Aguardando Atendimento',
  aguardando_manutencao:  'Aguardando Manutenção',
  em_manutencao:          'Em Manutenção',
  concluida:              'Concluída',
  cancelada:              'Cancelada',
  recusado:               'Recusado',
  manutencao_reprovada:   'Reprovada',
  agendada:               'Agendada',
  em_andamento:           'Em Andamento',
}

// Calcular prazo SLA em dias corridos por urgência
function calcSLA(urgencia: string): Date {
  const dias: Record<string, number> = { muito_alta: 1, alta: 2, media: 3, baixa: 5 }
  const d = new Date()
  d.setDate(d.getDate() + (dias[urgencia] ?? 3))
  return d
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const veiculo_id = searchParams.get('veiculo_id')
  const status     = searchParams.get('status')
  const id         = searchParams.get('id')

  const client = db()

  if (id) {
    const { data, error } = await client
      .from('manutencoes')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: historico } = await client
      .from('manutencao_historico')
      .select('*')
      .eq('manutencao_id', id)
      .order('created_at', { ascending: true })

    return NextResponse.json({ manutencao: data, historico: historico ?? [] })
  }

  let q = client
    .from('manutencoes')
    .select('*')
    .order('created_at', { ascending: false })

  if (veiculo_id) q = q.eq('veiculo_id', veiculo_id)
  if (status && status !== 'all') q = q.eq('status', status)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ manutencoes: data ?? [] })
}

export async function POST(request: Request) {
  const session = getSession()
  const body = await request.json()
  const {
    veiculo_id, veiculo_placa, veiculo_modelo,
    tipo, descricao, data_agendada, km_agendamento,
    responsavel, observacoes, urgencia,
    endereco_oficina, telefone_oficina
  } = body

  if (!veiculo_placa || !descricao) {
    return NextResponse.json({ error: 'Placa e descrição são obrigatórios.' }, { status: 400 })
  }

  const client = db()
  const { data: tenant } = await client.from('tenants').select('id').limit(1).single()
  const urg = urgencia || 'media'

  const { data, error } = await client.from('manutencoes').insert({
    tenant_id:         tenant?.id,
    veiculo_id:        veiculo_id || null,
    veiculo_placa,
    veiculo_modelo:    veiculo_modelo || null,
    tipo:              tipo || 'preventiva',
    descricao,
    status:            'aguardando_atendimento',
    urgencia:          urg,
    data_agendada:     data_agendada || null,
    km_agendamento:    km_agendamento || null,
    responsavel:       responsavel || null,
    observacoes:       observacoes || null,
    endereco_oficina:  endereco_oficina || null,
    telefone_oficina:  telefone_oficina || null,
    sla_prazo:         calcSLA(urg).toISOString(),
    ator_email:        session?.email || 'sistema',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Registrar no histórico
  await client.from('manutencao_historico').insert({
    manutencao_id:  data.id,
    status_anterior: null,
    status_novo:     'aguardando_atendimento',
    ator_email:      session?.email || 'sistema',
    ator_perfil:     session?.perfil || 'gestor',
    observacao:      descricao,
  })

  void logAudit({
    acao: 'MANUTENCAO_CRIADA',
    tenant_id: tenant?.id,
    ator_email: session?.email || 'sistema',
    ator_perfil: session?.perfil || 'gestor',
    dados_depois: data,
    ip: getClientIp(request),
  })

  return NextResponse.json({ manutencao: data })
}

export async function PATCH(request: Request) {
  const session = getSession()
  const body = await request.json()
  const { id, acao, observacao, ...campos } = body

  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const client = db()

  // Buscar manutenção atual
  const { data: atual, error: errFetch } = await client
    .from('manutencoes')
    .select('*')
    .eq('id', id)
    .single()

  if (errFetch || !atual) return NextResponse.json({ error: 'Manutenção não encontrada' }, { status: 404 })

  // Mapa de transições permitidas
  const TRANSICOES: Record<string, { novo_status: string; acao_audit: AuditAcao; campos_extras?: Record<string, unknown> }> = {
    iniciar:            { novo_status: 'aguardando_manutencao', acao_audit: 'MANUTENCAO_INICIADA' },
    recusar:            { novo_status: 'recusado',             acao_audit: 'MANUTENCAO_RECUSADA', campos_extras: { motivo_recusa: observacao } },
    confirmar_entrada:  { novo_status: 'em_manutencao',        acao_audit: 'MANUTENCAO_EM_ANDAMENTO', campos_extras: { data_entrada_oficina: new Date().toISOString() } },
    concluir:           { novo_status: 'concluida',            acao_audit: 'MANUTENCAO_CONCLUIDA', campos_extras: { data_saida_oficina: new Date().toISOString(), data_realizada: new Date().toISOString().split('T')[0] } },
    cancelar:           { novo_status: 'cancelada',            acao_audit: 'MANUTENCAO_CANCELADA' },
    reprovar:           { novo_status: 'manutencao_reprovada', acao_audit: 'MANUTENCAO_REPROVADA', campos_extras: { motivo_reprovacao: observacao } },
    retornar:           { novo_status: 'em_manutencao',        acao_audit: 'MANUTENCAO_RETORNADA' },
  }

  let updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  let novo_status: string | undefined
  let acao_audit: AuditAcao | undefined

  if (acao && TRANSICOES[acao]) {
    const t = TRANSICOES[acao]
    novo_status = t.novo_status
    acao_audit  = t.acao_audit
    updates.status = novo_status
    if (t.campos_extras) Object.assign(updates, t.campos_extras)
  } else {
    // Edição livre de campos (sem transição de status)
    const editaveis = ['descricao','responsavel','observacoes','data_agendada','km_agendamento',
                       'km_realizado','custo','data_realizada','endereco_oficina','telefone_oficina','urgencia']
    for (const k of editaveis) {
      if (campos[k] !== undefined) updates[k] = campos[k]
    }
    if (campos.status !== undefined) {
      updates.status = campos.status
      novo_status = campos.status
    }
  }

  const { error } = await client.from('manutencoes').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Registrar no histórico se houve transição de status
  if (novo_status && novo_status !== atual.status) {
    await client.from('manutencao_historico').insert({
      manutencao_id:   id,
      status_anterior: atual.status,
      status_novo:     novo_status,
      ator_email:      session?.email || 'sistema',
      ator_perfil:     session?.perfil || 'gestor',
      observacao:      observacao || null,
    })
  }

  if (acao_audit) {
    void logAudit({
      acao: acao_audit,
      ator_email: session?.email || 'sistema',
      ator_perfil: session?.perfil || 'gestor',
      dados_antes:  { status: atual.status },
      dados_depois: { status: novo_status, ...updates },
      ip: getClientIp(request),
    })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const client = db()
  const { error } = await client.from('manutencoes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// Suppress unused variable warning for STATUS_LABEL (kept for documentation purposes)
void STATUS_LABEL
