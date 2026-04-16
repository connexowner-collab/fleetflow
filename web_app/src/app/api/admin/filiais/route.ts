import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest } from '@/utils/session'
import { logAudit, getClientIp } from '@/utils/audit'

const db = () => createAdminClient()

export async function GET() {
  const { data, error } = await db()
    .from('filiais')
    .select('*')
    .order('nome', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ filiais: data ?? [] })
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request)
  if (!session || !['gestor', 'diretor'].includes(session.perfil)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const body = await request.json()
  const { nome, cidade, estado, endereco, telefone } = body

  if (!nome?.trim()) {
    return NextResponse.json({ error: 'Nome da filial é obrigatório.' }, { status: 400 })
  }

  const { data: tenant } = await db().from('tenants').select('id').limit(1).single()

  const { data, error } = await db().from('filiais').insert({
    tenant_id: tenant?.id,
    nome: nome.trim(),
    cidade: cidade || null,
    estado: estado || null,
    endereco: endereco || null,
    telefone: telefone || null,
    ativa: true,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  void logAudit({
    acao: 'FILIAL_CRIADA',
    tenant_id: tenant?.id,
    ator_email: session.email,
    ator_perfil: session.perfil,
    dados_depois: data,
    ip: getClientIp(request),
  })

  return NextResponse.json({ filial: data })
}

export async function PATCH(request: Request) {
  const session = await getSessionFromRequest(request)
  if (!session || !['gestor', 'diretor'].includes(session.perfil)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const body = await request.json()
  const { id, nome, cidade, estado, endereco, telefone, ativa } = body

  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (nome !== undefined) updates.nome = nome
  if (cidade !== undefined) updates.cidade = cidade
  if (estado !== undefined) updates.estado = estado
  if (endereco !== undefined) updates.endereco = endereco
  if (telefone !== undefined) updates.telefone = telefone
  if (ativa !== undefined) updates.ativa = ativa

  const { error } = await db().from('filiais').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  void logAudit({
    acao: ativa === false ? 'FILIAL_DESATIVADA' : 'FILIAL_EDITADA',
    ator_email: session.email,
    ator_perfil: session.perfil,
    dados_depois: { id, ...updates },
    ip: getClientIp(request),
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const session = await getSessionFromRequest(request)
  if (!session || !['gestor', 'diretor'].includes(session.perfil)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  // Soft delete: desativar em vez de excluir (preserva histórico)
  const { error } = await db().from('filiais').update({ ativa: false, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
