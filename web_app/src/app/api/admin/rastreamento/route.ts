import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest } from '@/utils/session'

const supabase = () => createAdminClient()

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const db = supabase()
  const { data, error } = await db
    .from('rastreamento')
    .select('*')
    .order('ultima_atualizacao', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ posicoes: data ?? [] })
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const body = await request.json()
  const { veiculo_id, veiculo_placa, lat, lng, velocidade, ignicao, odometro, status } = body

  if (!veiculo_id || !veiculo_placa) {
    return NextResponse.json({ error: 'veiculo_id e veiculo_placa são obrigatórios.' }, { status: 400 })
  }

  const db = supabase()
  const { data: tenant } = await db.from('tenants').select('id').limit(1).single()

  // Upsert — atualiza posição existente ou insere nova
  const { data, error } = await db
    .from('rastreamento')
    .upsert({
      tenant_id: tenant?.id,
      veiculo_id,
      veiculo_placa,
      lat: lat ?? null,
      lng: lng ?? null,
      velocidade: velocidade ?? 0,
      ignicao: ignicao ?? false,
      odometro: odometro ?? 0,
      status: status ?? 'offline',
      ultima_atualizacao: new Date().toISOString(),
    }, { onConflict: 'veiculo_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ posicao: data })
}
