import { NextResponse, NextRequest } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest, canManageFleet } from '@/utils/auth/session'

export async function GET() {
  const supabase = createAdminClient()
  try {
    const { data, error } = await supabase
      .from('veiculos')
      .select(`
        id, placa, modelo, marca, tipo, capacidade, combustivel, cor,
        renavam, chassi, filial, ano_fabricacao, ano_modelo,
        km_atual, status, device_id, created_at, deleted_at,
        profiles!motorista_id(nome)
      `)
      .is('deleted_at', null)
      .order('placa', { ascending: true })

    if (error) throw error

    // Busca documentos de todos os veículos
    const ids = (data ?? []).map((v: { id: string }) => v.id)
    let docs: { veiculo_id: string; tipo: string; data_vencimento: string | null; numero: string | null; observacao: string | null }[] = []
    if (ids.length > 0) {
      const { data: docData } = await supabase
        .from('veiculo_documentos')
        .select('veiculo_id, tipo, data_vencimento, numero, observacao')
        .in('veiculo_id', ids)
      docs = docData ?? []
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const veiculos = (data ?? []).map((v: any) => {
      const veiculoDocs = docs.filter(d => d.veiculo_id === v.id)
      const docStatus = calcDocStatus(veiculoDocs)
      return { ...v, documentos: veiculoDocs, doc_status: docStatus }
    })

    return NextResponse.json({ veiculos })
  } catch {
    return NextResponse.json({ veiculos: [] })
  }
}

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session || !canManageFleet(session.perfil)) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 })
  }
  const supabase = createAdminClient()
  const body = await request.json()
  const {
    placa, modelo, marca, tipo, combustivel, cor,
    renavam, chassi, filial, ano_fabricacao, ano_modelo,
    capacidade, device_id,
  } = body

  // Validações
  if (!placa || !modelo || !marca || !tipo || !combustivel || !cor || !renavam || !chassi || !filial || !ano_fabricacao || !ano_modelo) {
    return NextResponse.json({ error: 'Campos obrigatórios não preenchidos.' }, { status: 400 })
  }
  const placaFormatada = placa.toUpperCase().trim()
  if (!validarPlaca(placaFormatada)) {
    return NextResponse.json({ error: 'Formato de placa inválido. Use ABC-1234 ou ABC1D23.' }, { status: 400 })
  }
  const renavamLimpo = renavam.replace(/\D/g, '')
  if (renavamLimpo.length !== 9 && renavamLimpo.length !== 11) {
    return NextResponse.json({ error: 'RENAVAM deve ter 9 ou 11 dígitos.' }, { status: 400 })
  }
  const chassiLimpo = chassi.trim().toUpperCase()
  if (chassiLimpo.length !== 17) {
    return NextResponse.json({ error: 'Chassi deve ter 17 caracteres.' }, { status: 400 })
  }

  try {
    const { data: tenant } = await supabase.from('tenants').select('id').single()
    if (!tenant) throw new Error('Tenant não encontrado')

    // Verifica placa duplicada
    const { data: existente } = await supabase
      .from('veiculos')
      .select('id')
      .eq('placa', placaFormatada)
      .is('deleted_at', null)
      .single()
    if (existente) {
      return NextResponse.json({ error: 'Já existe um veículo ativo com essa placa.' }, { status: 400 })
    }

    const { data: novo, error } = await supabase.from('veiculos').insert({
      tenant_id: tenant.id,
      placa: placaFormatada,
      modelo,
      marca,
      tipo,
      combustivel,
      cor,
      renavam: renavamLimpo,
      chassi: chassiLimpo,
      filial,
      ano_fabricacao: Number(ano_fabricacao),
      ano_modelo: Number(ano_modelo),
      capacidade: capacidade || null,
      device_id: device_id || null,
      status: 'Ativo',
    }).select('id').single()
    if (error) throw error

    // Cria registros de documentos vazios para o novo veículo
    if (novo?.id) {
      await supabase.from('veiculo_documentos').insert([
        { veiculo_id: novo.id, tenant_id: tenant.id, tipo: 'CRLV' },
        { veiculo_id: novo.id, tenant_id: tenant.id, tipo: 'Seguro' },
        { veiculo_id: novo.id, tenant_id: tenant.id, tipo: 'Licenciamento' },
      ])
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao cadastrar'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session || !canManageFleet(session.perfil)) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 })
  }
  const supabase = createAdminClient()
  const body = await request.json()
  const { id, placa, renavam, chassi, ...rest } = body

  if (!id) return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400 })

  const updates: Record<string, unknown> = { ...rest }

  if (placa) {
    const placaFormatada = placa.toUpperCase().trim()
    if (!validarPlaca(placaFormatada)) {
      return NextResponse.json({ error: 'Formato de placa inválido.' }, { status: 400 })
    }
    // Verifica duplicata (exclui o próprio veículo)
    const { data: existente } = await supabase
      .from('veiculos').select('id').eq('placa', placaFormatada).is('deleted_at', null).neq('id', id).single()
    if (existente) {
      return NextResponse.json({ error: 'Já existe um veículo ativo com essa placa.' }, { status: 400 })
    }
    updates.placa = placaFormatada
  }

  if (renavam) {
    const renavamLimpo = renavam.replace(/\D/g, '')
    if (renavamLimpo.length !== 9 && renavamLimpo.length !== 11) {
      return NextResponse.json({ error: 'RENAVAM deve ter 9 ou 11 dígitos.' }, { status: 400 })
    }
    updates.renavam = renavamLimpo
  }

  if (chassi) {
    const chassiLimpo = chassi.trim().toUpperCase()
    if (chassiLimpo.length !== 17) {
      return NextResponse.json({ error: 'Chassi deve ter 17 caracteres.' }, { status: 400 })
    }
    updates.chassi = chassiLimpo
  }

  try {
    const { error } = await supabase.from('veiculos').update(updates).eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao atualizar'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session || !canManageFleet(session.perfil)) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 })
  }
  const supabase = createAdminClient()
  const { id } = await request.json()

  if (!id) return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400 })

  try {
    // Desvincular motorista antes do soft delete (R6)
    await supabase.from('profiles').update({ placa_vinculada: null }).eq('placa_vinculada',
      (await supabase.from('veiculos').select('placa').eq('id', id).single()).data?.placa ?? ''
    )
    await supabase.from('veiculos').update({ motorista_id: null }).eq('id', id)

    // Soft delete
    const { error } = await supabase
      .from('veiculos')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao excluir'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

// ── Helpers ────────────────────────────────────────────────

function validarPlaca(placa: string): boolean {
  const mercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/
  const antigo   = /^[A-Z]{3}-?[0-9]{4}$/
  return mercosul.test(placa) || antigo.test(placa.replace('-', ''))
}

function calcDocStatus(docs: { tipo: string; data_vencimento: string | null }[]): 'ok' | 'alerta' | 'vencido' | 'sem-data' {
  if (!docs.length) return 'sem-data'
  const hoje = new Date()
  const em30 = new Date()
  em30.setDate(hoje.getDate() + 30)

  let status: 'ok' | 'alerta' | 'vencido' | 'sem-data' = 'sem-data'
  for (const doc of docs) {
    if (!doc.data_vencimento) continue
    const venc = new Date(doc.data_vencimento)
    if (venc < hoje) return 'vencido'
    if (venc <= em30) status = 'alerta'
    else if (status === 'sem-data') status = 'ok'
  }
  return status
}
