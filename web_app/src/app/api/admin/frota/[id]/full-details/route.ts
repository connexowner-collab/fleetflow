import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest, canManageFleet } from '@/utils/auth/session'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = getSessionFromRequest(request)
  if (!session || !canManageFleet(session.perfil)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
  }

  const supabase = createAdminClient()

  try {
    // Execução paralela no SERVIDOR (muito mais rápido que no cliente)
    const [veiculoRes, documentosRes, checklistsRes] = await Promise.all([
      supabase
        .from('veiculos')
        .select(`
          id, placa, modelo, marca, tipo, capacidade, combustivel, cor,
          renavam, chassi, filial, ano_fabricacao, ano_modelo, km_atual, status, device_id,
          profiles ( nome )
        `)
        .eq('id', id)
        .single(),
      
      supabase
        .from('veiculo_documentos')
        .select('id, tipo, data_vencimento, observacao, url_anexo')
        .eq('veiculo_id', id)
        .order('tipo'),

      supabase
        .from('checklists')
        .select('id, codigo, motorista_nome, status, created_at, km_atual')
        .eq('veiculo_id', id)
        .order('created_at', { ascending: false })
        .limit(10)
    ])

    if (veiculoRes.error) throw veiculoRes.error

    return NextResponse.json({
      veiculo: veiculoRes.data,
      documentos: documentosRes.data ?? [],
      checklists: checklistsRes.data ?? [],
      timestamp: Date.now()
    }, {
      headers: {
        'Cache-Control': 'private, max-age=60, s-maxage=60' // Cache de 1 minuto no nível de rede
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
