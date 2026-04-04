import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET() {
  const supabase = createAdminClient()
  try {
    const { data, error } = await supabase
      .from('veiculos')
      .select('id, placa, modelo, tipo, capacidade, status, km_atual, profiles!motorista_id(nome)')
      .order('placa', { ascending: true })

    if (error) throw error
    return NextResponse.json({ veiculos: data ?? [] })
  } catch {
    return NextResponse.json({ veiculos: [] })
  }
}

export async function POST(request: Request) {
  const supabase = createAdminClient()
  const body = await request.json()
  const { placa, modelo, capacidade } = body

  try {
    // Pega o primeiro tenant
    const { data: tenant } = await supabase.from('tenants').select('id').single()
    if (!tenant) throw new Error('Tenant não encontrado')

    const { error } = await supabase.from('veiculos').insert({
      tenant_id: tenant.id,
      placa: placa.toUpperCase(),
      modelo,
      status: 'Disponível',
      capacidade: capacidade || null,
    })
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao cadastrar'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
