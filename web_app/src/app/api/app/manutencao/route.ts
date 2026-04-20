import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest } from '@/utils/auth/session'

const STATUS_MAP: Record<string, string> = {
  aguardando_atendimento: 'Aguardando Atendimento',
  aguardando_manutencao:  'Aguardando Manutenção',
  em_manutencao:          'Em Manutenção',
  concluida:              'Concluída',
  cancelada:              'Cancelada',
  recusado:               'Recusada',
  manutencao_reprovada:   'Recusada',
  agendada:               'Aguardando Atendimento',
  em_andamento:           'Em Manutenção',
}

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page      = parseInt(searchParams.get('page')  ?? '1')
  const limit     = parseInt(searchParams.get('limit') ?? '20')
  const offset    = (page - 1) * limit
  const status    = searchParams.get('status')
  const dataInicio = searchParams.get('data_inicio')
  const dataFim   = searchParams.get('data_fim')

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, placa_vinculada, tenant_id')
    .eq('email', session.email)
    .single()

  if (!profile) return NextResponse.json({ manutencoes: [], total: 0 })

  let query = supabase
    .from('manutencoes')
    .select('id, codigo, veiculo_placa, urgencia, status, motivo, descricao, km_atual, km_agendamento, created_at, observacoes, observacao_operador', { count: 'exact' })
    .eq('motorista_id', profile.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status)     query = query.eq('status', status)
  if (dataInicio) query = query.gte('created_at', dataInicio)
  if (dataFim)    query = query.lte('created_at', dataFim)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const manutencoes = (data ?? []).map(m => ({
    id:               m.id,
    codigo:           m.codigo,
    data_abertura:    m.created_at,
    motivo:           m.motivo ?? 'Corretiva',
    urgencia:         m.urgencia ?? 'media',
    descricao:        m.descricao,
    km:               m.km_atual ?? m.km_agendamento ?? 0,
    status:           STATUS_MAP[m.status] ?? m.status,
    observacao_recusa: m.observacao_operador ?? m.observacoes,
    timeline: [],
    log:      [],
    anexos:   [],
  }))

  const statusAbertos = ['Aguardando Atendimento', 'Aguardando Manutenção', 'Em Manutenção']
  const temAberta = manutencoes.some(m => statusAbertos.includes(m.status))

  return NextResponse.json({ manutencoes, total: count ?? 0, page, limit, tem_aberta: temAberta })
}

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, nome, placa_vinculada, tenant_id')
    .eq('email', session.email)
    .single()

  if (!profile) return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 })
  if (!profile.placa_vinculada) return NextResponse.json({ error: 'Nenhum veículo vinculado.' }, { status: 400 })

  const { data: veiculo } = await supabase
    .from('veiculos')
    .select('id, placa, modelo, km_atual')
    .eq('placa', profile.placa_vinculada)
    .eq('tenant_id', profile.tenant_id)
    .is('deleted_at', null)
    .single()

  if (!veiculo) return NextResponse.json({ error: 'Veículo não encontrado.' }, { status: 404 })

  // Verificar manutenção em aberto
  const statusAbertos = ['aguardando_atendimento', 'aguardando_manutencao', 'em_manutencao']
  const { data: abertas } = await supabase
    .from('manutencoes')
    .select('id')
    .eq('veiculo_id', veiculo.id)
    .in('status', statusAbertos)
    .limit(1)

  if (abertas && abertas.length > 0) {
    return NextResponse.json({ error: 'Já existe uma manutenção em aberto para este veículo.' }, { status: 409 })
  }

  const body = await request.json()
  const { motivo, urgencia, descricao, km_atual } = body

  if (!motivo || !descricao) return NextResponse.json({ error: 'Motivo e descrição são obrigatórios.' }, { status: 400 })

  const kmAtual = parseInt(String(km_atual ?? veiculo.km_atual))
  if (kmAtual < (veiculo.km_atual ?? 0)) {
    return NextResponse.json({
      error: `KM Atual deve ser maior ou igual ao KM anterior (${veiculo.km_atual} km).`
    }, { status: 400 })
  }

  // Gerar código sequencial
  const { count } = await supabase
    .from('manutencoes')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', profile.tenant_id)

  const seq    = String((count ?? 0) + 1).padStart(5, '0')
  const codigo = `MAN-${seq}`

  const { data: manutencao, error } = await supabase
    .from('manutencoes')
    .insert({
      tenant_id:      profile.tenant_id,
      codigo,
      motorista_id:   profile.id,
      motorista_nome: profile.nome,
      veiculo_id:     veiculo.id,
      veiculo_placa:  veiculo.placa,
      veiculo_modelo: veiculo.modelo ?? null,
      tipo:           'corretiva',
      motivo,
      urgencia:       urgencia ?? 'media',
      descricao,
      km_atual:       kmAtual,
      km_agendamento: kmAtual,
      ator_email:     session.email,
      status:         'aguardando_atendimento',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Atualizar KM do veículo
  await supabase.from('veiculos').update({ km_atual: kmAtual }).eq('id', veiculo.id)

  return NextResponse.json({ manutencao, codigo })
}
