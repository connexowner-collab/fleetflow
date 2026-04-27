import { createAdminClient } from '@/utils/supabase/admin'

export interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, unknown>
}

/**
 * Envia Web Push para todos os dispositivos registrados de um usuário.
 * Usa VAPID keys das variáveis de ambiente.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  const vapidPublic  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  const vapidEmail   = process.env.VAPID_EMAIL ?? 'mailto:admin@fleetflow.com.br'

  if (!vapidPublic || !vapidPrivate) return

  const supabase = createAdminClient()
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (!subs?.length) return

  const webpush = await import('web-push')
  webpush.setVapidDetails(vapidEmail, vapidPublic, vapidPrivate)

  const message = JSON.stringify({
    title:  payload.title,
    body:   payload.body,
    icon:   payload.icon  ?? '/icons/icon-192x192.png',
    badge:  payload.badge ?? '/icons/icon-192x192.png',
    tag:    payload.tag,
    data:   payload.data ?? {},
  })

  await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        message
      ).catch(async (err: { statusCode?: number }) => {
        // Remove subscription inválida (expirada/revogada)
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', sub.endpoint)
        }
      })
    )
  )
}

/**
 * Cria uma notificação no banco E envia Web Push.
 */
export async function criarNotificacaoEPush(params: {
  tenantId: string
  destinatarioId?: string
  destinatarioEmail?: string
  tipo?: string
  prioridade?: string
  titulo: string
  mensagem: string
  referenciaId?: string
  referenciaTipo?: string
}): Promise<void> {
  const supabase = createAdminClient()

  await supabase.from('notificacoes').insert({
    tenant_id:      params.tenantId,
    destinatario:   params.destinatarioEmail ?? 'all',
    tipo:           params.tipo ?? 'sistema',
    prioridade:     params.prioridade ?? 'media',
    titulo:         params.titulo,
    mensagem:       params.mensagem,
    referencia_id:  params.referenciaId  ?? null,
    referencia_tipo:params.referenciaTipo ?? null,
  })

  if (params.destinatarioId) {
    await sendPushToUser(params.destinatarioId, {
      title: params.titulo,
      body:  params.mensagem,
      tag:   params.tipo,
    }).catch(console.error)
  }
}
