import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

const roleMap: Record<string, string> = {
  'Motorista': 'motorista',
  'Analista de Frota': 'analista',
  'Gestor': 'gestor',
  'Diretor': 'diretor',
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createAdminClient()
  const { id } = await params
  const body = await request.json()
  const { nome, cargo, ativo, telas_permitidas, veiculo_id, placa } = body

  try {
    const updates: Record<string, unknown> = {}
    if (nome !== undefined) updates.nome = nome
    if (cargo !== undefined) updates.perfil = roleMap[cargo] ?? cargo
    if (ativo !== undefined) updates.ativo = ativo
    if (telas_permitidas !== undefined) updates.telas_permitidas = telas_permitidas
    if (veiculo_id !== undefined) updates.veiculo_id = veiculo_id || null
    if (placa !== undefined) updates.placa_vinculada = placa || null

    const { error } = await supabase.from('profiles').update(updates).eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao editar usuário'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createAdminClient()
  const { id } = await params
  try {
    const { error } = await supabase.auth.admin.deleteUser(id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao excluir usuário'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
