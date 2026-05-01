import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest } from '@/utils/session'

// GET /api/admin/frota/checklists?veiculo_id=xxx
export async function GET(request: Request) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const veiculo_id = searchParams.get('veiculo_id')
  const placa = searchParams.get('placa')

  const supabase = createAdminClient()

  let query = supabase
    .from('checklists')
    .select('id, codigo, motorista_nome, status, created_at, placa, km_atual, tipo_checklist')
    .order('created_at', { ascending: false })
    .limit(50)

  if (veiculo_id) query = query.eq('veiculo_id', veiculo_id)
  else if (placa) query = query.eq('placa', placa)
  else return NextResponse.json({ error: 'veiculo_id ou placa obrigatório' }, { status: 400 })

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ checklists: data ?? [] })
}
