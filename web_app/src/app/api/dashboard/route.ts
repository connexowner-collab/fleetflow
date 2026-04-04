import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET() {
  const supabase = createAdminClient()

  try {
    const [veiculos, ocorrencias, trocas, checklists] = await Promise.all([
      supabase.from('veiculos').select('id, status', { count: 'exact' }),
      supabase.from('ocorrencias').select('id, status, gravidade', { count: 'exact' }),
      supabase.from('trocas').select('id, status', { count: 'exact' }),
      supabase.from('checklists').select('id', { count: 'exact' }),
    ])

    const totalVeiculos = veiculos.count ?? 0
    const emManutencao = (veiculos.data ?? []).filter((v) => v.status === 'Em Manutenção').length
    const ocorrenciasAtivas = (ocorrencias.data ?? []).filter((o) => o.status === 'Aberta' || o.status === 'Em Tratativa').length
    const gravesNaoTratadas = (ocorrencias.data ?? []).filter((o) => o.gravidade === 'Grave' && o.status === 'Aberta').length
    const trocasPendentes = (trocas.data ?? []).filter((t) => t.status === 'Pendente').length
    const totalChecklists = checklists.count ?? 0

    return NextResponse.json({
      totalVeiculos,
      emManutencao,
      ocorrenciasAtivas,
      gravesNaoTratadas,
      trocasPendentes,
      totalChecklists,
    })
  } catch {
    return NextResponse.json({ totalVeiculos: 0, emManutencao: 0, ocorrenciasAtivas: 0, gravesNaoTratadas: 0, trocasPendentes: 0, totalChecklists: 0 })
  }
}
