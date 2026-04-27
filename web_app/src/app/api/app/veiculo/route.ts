import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest } from '@/utils/auth/session'

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, placa_vinculada, tenant_id')
    .eq('email', session.email)
    .single()

  if (!profile?.placa_vinculada) {
    return NextResponse.json({ veiculo: null })
  }

  const { data: veiculo } = await supabase
    .from('veiculos')
    .select('id, placa, marca, modelo, ano_fabricacao, ano_modelo, tipo, combustivel, cor, renavam, chassi, filial, km_atual, status, capacidade, deleted_at')
    .eq('placa', profile.placa_vinculada)
    .eq('tenant_id', profile.tenant_id)
    .is('deleted_at', null)
    .single()

  if (!veiculo) return NextResponse.json({ veiculo: null })

  // Documentos do veículo
  const { data: documentos } = await supabase
    .from('veiculo_documentos')
    .select('tipo, vencimento, pdf_url, deleted_at')
    .eq('veiculo_id', veiculo.id)
    .is('deleted_at', null)

  return NextResponse.json({ veiculo, documentos: documentos ?? [] })
}
