import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest } from '@/utils/auth/session'

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const body = await request.json()
  const { endpoint, keys } = body as {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Dados de subscription inválidos.' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, tenant_id')
    .eq('email', session.email)
    .single()

  if (!profile) return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 })

  const userAgent = request.headers.get('user-agent') ?? ''

  await supabase
    .from('push_subscriptions')
    .upsert({
      tenant_id:  profile.tenant_id,
      user_id:    profile.id,
      endpoint,
      p256dh:     keys.p256dh,
      auth:       keys.auth,
      user_agent: userAgent,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,endpoint' })

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { endpoint } = await request.json()
  if (!endpoint) return NextResponse.json({ error: 'endpoint obrigatório.' }, { status: 400 })

  const supabase = createAdminClient()
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)

  return NextResponse.json({ ok: true })
}
