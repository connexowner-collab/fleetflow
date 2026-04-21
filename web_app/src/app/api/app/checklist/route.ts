import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest } from '@/utils/auth/session'

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const offset = (page - 1) * limit

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, placa_vinculada, tenant_id')
    .eq('email', session.email)
    .single()

  if (!profile) return NextResponse.json({ checklists: [], total: 0 })

  let query = supabase
    .from('checklists')
    .select('id, codigo, codigo_sequencial, placa, veiculo_nome, unidade, setor, area, tipo_checklist, status, tem_avaria, created_at, pdf_url, assinado_em', { count: 'exact' })
    .eq('motorista_id', profile.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Se veículo vinculado, filtrar pelo par motorista+veículo
  if (profile.placa_vinculada) {
    query = query.eq('placa', profile.placa_vinculada)
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ checklists: data ?? [], total: count ?? 0, page, limit })
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

  // Pegar dados do veículo
  const { data: veiculo } = await supabase
    .from('veiculos')
    .select('id, placa, modelo, marca, chassi, km_atual')
    .eq('placa', profile.placa_vinculada)
    .eq('tenant_id', profile.tenant_id)
    .is('deleted_at', null)
    .single()

  if (!veiculo) return NextResponse.json({ error: 'Veículo não encontrado.' }, { status: 404 })

  // Parsear FormData
  let body: Record<string, unknown>
  const contentType = request.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    body = await request.json()
  } else {
    const formData = await request.formData()
    body = Object.fromEntries(
      [...formData.entries()].filter(([, v]) => !(v instanceof File))
    )
  }

  const kmAtual = parseInt(String(body.km_atual ?? '0'))

  // Validar KM
  if (kmAtual < (veiculo.km_atual ?? 0)) {
    return NextResponse.json({
      error: `KM Atual deve ser maior ou igual ao KM anterior (${veiculo.km_atual} km).`
    }, { status: 400 })
  }

  // Gerar código sequencial
  const { count } = await supabase
    .from('checklists')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', profile.tenant_id)

  const seq = String((count ?? 0) + 1).padStart(5, '0')
  const codigo = `CHK-${seq}`

  // Parsear itens (aceita tanto 'itens' quanto 'inspecao' por compatibilidade)
  const itens: Array<{ nome: string; conforme: boolean }> = []
  try {
    const raw = body.itens ?? body.inspecao ?? '[]'
    const parsed = JSON.parse(String(raw))
    // Suporta formato { nome: string, conforme: bool } ou { [nome]: 'ok'|'avaria' }
    if (Array.isArray(parsed)) {
      itens.push(...parsed)
    } else if (typeof parsed === 'object') {
      for (const [nome, val] of Object.entries(parsed)) {
        itens.push({ nome, conforme: val === 'ok' || val === true })
      }
    }
  } catch { /* */ }

  // Parsear avarias
  const avarias: Array<{ descricao: string; tipo: string; gravidade: string }> = []
  try { avarias.push(...JSON.parse(String(body.avarias ?? '[]'))) } catch { /* */ }

  const temAvaria = avarias.length > 0

  // Calcular status
  const temNaoConforme = itens.some(i => !i.conforme)
  const status = temAvaria || temNaoConforme ? 'Com Pendências' : 'Aprovado'

  // Inserir checklist
  const { data: checklist, error } = await supabase
    .from('checklists')
    .insert({
      tenant_id: profile.tenant_id,
      codigo,
      codigo_sequencial: seq,
      motorista_id: profile.id,
      motorista_nome: profile.nome,
      veiculo_id: veiculo.id,
      placa: veiculo.placa,
      veiculo_nome: `${veiculo.marca ?? ''} ${veiculo.modelo}`.trim(),
      tipo_checklist: body.tipo_checklist
        ? String(body.tipo_checklist)
        : (body.tipo === 'pos' ? 'Pós-operação' : body.tipo === 'pre' ? 'Pré-operação' : 'Pré-operação'),
      unidade: String(body.unidade ?? ''),
      setor: String(body.setor ?? ''),
      area: String(body.area ?? ''),
      km_anterior: veiculo.km_atual ?? 0,
      km_atual: kmAtual,
      observacao: String(body.observacao ?? ''),
      status,
      tem_avaria: temAvaria,
      assinatura_base64: String(body.assinatura ?? ''),
      email_envio: String(body.email_envio ?? body.email ?? session.email),
      cpf_motorista: String(body.cpf ?? ''),
      assinado_em: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Inserir itens
  if (itens.length > 0) {
    await supabase.from('checklist_itens').insert(
      itens.map(i => ({ checklist_id: checklist.id, nome: i.nome, conforme: i.conforme }))
    )
  }

  // Atualizar KM do veículo
  await supabase.from('veiculos').update({ km_atual: kmAtual }).eq('id', veiculo.id)

  return NextResponse.json({ checklist, codigo })
}
