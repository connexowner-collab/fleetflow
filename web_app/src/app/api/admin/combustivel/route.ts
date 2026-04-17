import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest } from '@/utils/session'

const supabase = () => createAdminClient()

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const veiculo_id = searchParams.get('veiculo_id')
  const limit = parseInt(searchParams.get('limit') ?? '100')

  const db = supabase()
  let query = db
    .from('abastecimentos')
    .select('*')
    .order('data', { ascending: false })
    .limit(limit)

  if (veiculo_id) query = query.eq('veiculo_id', veiculo_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Calcular consumo médio por veículo
  const registros = (data ?? []).map((r) => ({
    ...r,
    consumo_km_l:
      r.km_anterior && r.km_atual > r.km_anterior && r.litros
        ? ((r.km_atual - r.km_anterior) / r.litros).toFixed(2)
        : null,
  }))

  return NextResponse.json({ abastecimentos: registros })
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const body = await request.json()
  const {
    veiculo_id, veiculo_placa, veiculo_modelo, motorista_nome,
    data, tipo_combustivel, litros, valor_litro,
    km_atual, km_anterior, posto, observacoes
  } = body

  if (!veiculo_placa || !litros || !valor_litro || !km_atual) {
    return NextResponse.json(
      { error: 'Placa, litros, valor por litro e KM atual são obrigatórios.' },
      { status: 400 }
    )
  }

  const db = supabase()
  const { data: tenant } = await db.from('tenants').select('id').limit(1).single()

  const { data: created, error } = await db.from('abastecimentos').insert({
    tenant_id: tenant?.id,
    veiculo_id: veiculo_id || null,
    veiculo_placa,
    veiculo_modelo: veiculo_modelo || null,
    motorista_nome: motorista_nome || null,
    data: data || new Date().toISOString().split('T')[0],
    tipo_combustivel: tipo_combustivel || 'diesel',
    litros: parseFloat(litros),
    valor_litro: parseFloat(valor_litro),
    km_atual: parseInt(km_atual),
    km_anterior: parseInt(km_anterior ?? 0),
    posto: posto || null,
    observacoes: observacoes || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ abastecimento: created })
}

export async function DELETE(request: Request) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const db = supabase()
  const { error } = await db.from('abastecimentos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
