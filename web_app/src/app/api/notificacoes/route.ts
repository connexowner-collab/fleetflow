import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest } from '@/utils/session'

const supabase = () => createAdminClient()

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const nao_lidas = searchParams.get('nao_lidas')

  const db = supabase()
  let query = db
    .from('notificacoes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (nao_lidas === 'true') query = query.eq('lida', false)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const count_nao_lidas = (data ?? []).filter((n) => !n.lida).length
  return NextResponse.json({ notificacoes: data ?? [], count_nao_lidas })
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const body = await request.json()
  const { tipo, prioridade, titulo, mensagem, destinatario, referencia_id, referencia_tipo } = body

  if (!titulo || !mensagem) {
    return NextResponse.json({ error: 'Título e mensagem são obrigatórios.' }, { status: 400 })
  }

  const db = supabase()
  const { data: tenant } = await db.from('tenants').select('id').limit(1).single()

  const { data, error } = await db.from('notificacoes').insert({
    tenant_id: tenant?.id,
    destinatario: destinatario || 'all',
    tipo: tipo || 'sistema',
    prioridade: prioridade || 'media',
    titulo,
    mensagem,
    referencia_id: referencia_id || null,
    referencia_tipo: referencia_tipo || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notificacao: data })
}

export async function PATCH(request: Request) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const body = await request.json()
  const { id, lida, marcar_todas } = body

  const db = supabase()

  if (marcar_todas) {
    const { error } = await db
      .from('notificacoes')
      .update({ lida: true })
      .eq('lida', false)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const { error } = await db
    .from('notificacoes')
    .update({ lida: lida ?? true })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const db = supabase()
  const { error } = await db.from('notificacoes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
