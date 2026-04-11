import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

const supabase = () => createAdminClient()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const veiculo_id = searchParams.get('veiculo_id')
  const status = searchParams.get('status')

  const db = supabase()
  let query = db
    .from('manutencoes')
    .select('*')
    .order('data_agendada', { ascending: false })

  if (veiculo_id) query = query.eq('veiculo_id', veiculo_id)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ manutencoes: data ?? [] })
}

export async function POST(request: Request) {
  const body = await request.json()
  const {
    veiculo_id, veiculo_placa, veiculo_modelo,
    tipo, descricao, data_agendada, km_agendamento,
    responsavel, observacoes
  } = body

  if (!veiculo_placa || !descricao) {
    return NextResponse.json({ error: 'Placa e descrição são obrigatórios.' }, { status: 400 })
  }

  const db = supabase()
  const { data: tenant } = await db.from('tenants').select('id').limit(1).single()

  const { data, error } = await db.from('manutencoes').insert({
    tenant_id: tenant?.id,
    veiculo_id: veiculo_id || null,
    veiculo_placa,
    veiculo_modelo: veiculo_modelo || null,
    tipo: tipo || 'preventiva',
    descricao,
    status: 'agendada',
    data_agendada: data_agendada || null,
    km_agendamento: km_agendamento || null,
    responsavel: responsavel || null,
    observacoes: observacoes || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ manutencao: data })
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const { id, status, data_realizada, km_realizado, custo, responsavel, observacoes, descricao } = body

  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const db = supabase()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (status !== undefined) updates.status = status
  if (data_realizada !== undefined) updates.data_realizada = data_realizada
  if (km_realizado !== undefined) updates.km_realizado = km_realizado
  if (custo !== undefined) updates.custo = custo
  if (responsavel !== undefined) updates.responsavel = responsavel
  if (observacoes !== undefined) updates.observacoes = observacoes
  if (descricao !== undefined) updates.descricao = descricao

  const { error } = await db.from('manutencoes').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const db = supabase()
  const { error } = await db.from('manutencoes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
