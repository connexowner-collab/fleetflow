import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

// GET /api/admin/veiculos - lista para dropdown de Gestão de Acessos
// Exclui: deletados, inativos, Em Manutenção (R2, R8)
export async function GET() {
  const supabase = createAdminClient()
  try {
    const { data, error } = await supabase
      .from('veiculos')
      .select('id, placa, modelo, status')
      .is('deleted_at', null)
      .not('status', 'in', '("Inativo","Em Manutenção")')
      .order('placa')
    if (error) throw error
    return NextResponse.json({ veiculos: data ?? [] })
  } catch {
    return NextResponse.json({ veiculos: [] })
  }
}

// PATCH /api/admin/veiculos - altera status do veículo
export async function PATCH(request: Request) {
  const supabase = createAdminClient()
  const { id, status } = await request.json()

  if (!id || !status) return NextResponse.json({ error: 'id e status obrigatórios' }, { status: 400 })

  const statusValidos = ['Ativo', 'Inativo', 'Em Manutenção', 'Disponível', 'Em Rota']
  if (!statusValidos.includes(status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  const { error } = await supabase.from('veiculos').update({ status }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
